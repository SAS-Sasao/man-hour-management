# システムパターン

## アーキテクチャ概要

### 全体構成
```
Frontend (Next.js + React) ←→ API Routes ←→ Prisma ORM ←→ PostgreSQL
```

### レイヤー構成
1. **プレゼンテーション層**: React Components + Pages
2. **API層**: Next.js API Routes
3. **ビジネスロジック層**: Utils + Context
4. **データアクセス層**: Prisma ORM
5. **データ層**: PostgreSQL Database

## 主要な設計パターン

### 1. コンポーネント設計パターン

#### レイアウトパターン
- **Layout Component**: 共通レイアウトの提供
- **Page Components**: 各画面の実装
- **Modal Components**: ポップアップ機能

```typescript
// Layout.tsx - 共通レイアウトパターン
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

#### 状態管理パターン
- **Context API**: グローバル状態管理
- **useApp Hook**: 状態とアクションの統一アクセス

```typescript
// AppContext.tsx - 状態管理パターン
interface AppState {
  currentUser: User | null;
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  users: User[];
}
```

### 2. API設計パターン

#### RESTful API構造
```
/api/users          - ユーザー管理
/api/projects       - プロジェクト管理
/api/phases         - 工程管理
/api/tasks          - タスク管理
/api/time-entries   - 工数管理
/api/admin/*        - 管理機能
```

#### API Response Pattern
```typescript
// 成功レスポンス
{
  success: true,
  data: T,
  message?: string
}

// エラーレスポンス
{
  success: false,
  error: string,
  details?: any
}
```

#### エラーハンドリングパターン
```typescript
try {
  // API処理
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('API Error:', error);
  return NextResponse.json(
    { success: false, error: 'Internal Server Error' },
    { status: 500 }
  );
}
```

### 3. データベース設計パターン

#### Prisma Schema Pattern
```prisma
model User {
  id              String      @id @default(cuid())
  name            String
  email           String      @unique
  password        String
  role            Role        @default(MEMBER)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  // Relations
  managedProjects Project[]   @relation("ProjectManager")
  timeEntries     TimeEntry[]
  @@map("users")
}
```

#### リレーション設計パターン
- **1:N関係**: User ←→ TimeEntry
- **参照整合性**: Cascade Delete で関連データの整合性確保
- **インデックス**: 検索性能向上のための適切なインデックス設計

### 4. 認証・認可パターン

#### セッションベース認証
```typescript
// ログイン処理パターン
const hashedPassword = await bcrypt.hash(password, 10);
const user = await prisma.user.findUnique({
  where: { email }
});
const isValid = await bcrypt.compare(password, user.password);
```

#### 役割ベースアクセス制御（RBAC）
```typescript
enum Role {
  ADMIN    // 全権限
  MANAGER  // プロジェクト管理権限
  MEMBER   // 基本権限
}
```

## コンポーネント関係図

### 主要コンポーネント構造
```
App
├── Layout
│   ├── Navigation
│   └── Main Content
├── Pages
│   ├── Dashboard
│   ├── Projects
│   ├── TimeEntry
│   ├── Users
│   └── Login
├── Modals
│   └── BulkTimeEntryModal
└── Context
    └── AppContext
```

### データフロー
```
User Action → Component → Context → API → Prisma → Database
                ↓
            State Update → Re-render
```

## 重要な実装パターン

### 1. 工数入力パターン
```typescript
// 工数入力の基本フロー
const handleTimeEntrySubmit = async (data: TimeEntryData) => {
  try {
    // バリデーション
    validateTimeEntry(data);
    
    // API呼び出し
    const response = await fetch('/api/time-entries', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // 状態更新
    if (response.ok) {
      await fetchTimeEntries(); // 再取得
      showSuccessMessage();
    }
  } catch (error) {
    showErrorMessage(error.message);
  }
};
```

### 2. 一括処理パターン
```typescript
// 一括工数入力パターン
const handleBulkTimeEntry = async (entries: TimeEntryData[]) => {
  const results = await Promise.allSettled(
    entries.map(entry => createTimeEntry(entry))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  showBulkResult(successful, failed);
};
```

### 3. データ集計パターン
```typescript
// ダッシュボード集計パターン
const calculateProjectStats = (timeEntries: TimeEntry[], projects: Project[]) => {
  return projects.map(project => {
    const projectEntries = timeEntries.filter(entry => entry.projectId === project.id);
    const totalHours = projectEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    return {
      ...project,
      totalHours,
      progressPercentage: calculateProgress(project, totalHours)
    };
  });
};
```

### 4. 権限制御パターン
```typescript
// 役割ベース表示制御
const RoleBasedComponent = ({ userRole, children }) => {
  if (userRole === 'MEMBER') {
    return <MemberView>{children}</MemberView>;
  }
  
  if (userRole === 'MANAGER') {
    return <ManagerView>{children}</ManagerView>;
  }
  
  return <AdminView>{children}</AdminView>;
};
```

## パフォーマンス最適化パターン

### 1. データ取得最適化
- **初期データロード**: アプリ起動時に必要なデータを一括取得
- **条件付き取得**: ユーザー権限に応じたデータフィルタリング
- **キャッシュ戦略**: Context での状態保持

### 2. レンダリング最適化
- **React.memo**: 不要な再レンダリング防止
- **useMemo/useCallback**: 計算結果とコールバックのメモ化
- **条件付きレンダリング**: 権限に応じた表示制御

### 3. API最適化
- **バッチ処理**: 複数操作の一括実行
- **エラーハンドリング**: 適切なエラー処理とユーザーフィードバック

## セキュリティパターン

### 1. 入力検証
```typescript
// バリデーションパターン
const validateTimeEntry = (data: TimeEntryData) => {
  if (!data.hours || data.hours <= 0) {
    throw new Error('工数は0より大きい値を入力してください');
  }
  
  if (!data.date || new Date(data.date) > new Date()) {
    throw new Error('未来の日付は入力できません');
  }
};
```

### 2. 認証チェック
```typescript
// API認証パターン
const requireAuth = (handler) => async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  return handler(req, res, user);
};
```

### 3. データアクセス制御
```typescript
// データフィルタリングパターン
const getFilteredTimeEntries = (user: User, timeEntries: TimeEntry[]) => {
  if (user.role === 'MEMBER') {
    return timeEntries.filter(entry => entry.userId === user.id);
  }
  
  return timeEntries; // ADMIN/MANAGER は全データ閲覧可能
};
```

## エラーハンドリングパターン

### 1. フロントエンドエラー処理
```typescript
// エラー表示パターン
const [error, setError] = useState<string | null>(null);

const handleError = (error: Error) => {
  setError(error.message);
  setTimeout(() => setError(null), 5000); // 5秒後に自動消去
};
```

### 2. API エラー処理
```typescript
// API エラーレスポンスパターン
catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    return NextResponse.json(
      { success: false, error: 'Database error' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 400 }
  );
}
```

## 🆕 WBS管理パターン

### 1. WBS独立管理パターン
```typescript
// WBSEntry - 独立した作業管理システム
model WBSEntry {
  id                String      @id @default(cuid())
  name              String      // 作業名
  description       String?     // 作業説明
  taskId            String?     // 関連タスク（任意）
  projectId         String?     // 関連プロジェクト（任意）
  phaseId           String?     // 関連フェーズ（任意）
  assigneeId        String?     // 担当者（任意）
  status            TaskStatus  @default(NOT_STARTED)
  plannedStartDate  DateTime?   // 予定開始日
  plannedEndDate    DateTime?   // 予定終了日
  actualStartDate   DateTime?   // 実際の開始日
  actualEndDate     DateTime?   // 実際の終了日
  estimatedHours    Float       @default(0)
  actualHours       Float       @default(0)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

### 2. WBS可視化パターン

#### ダッシュボード集計パターン
```typescript
// 進捗レポート生成
const generateProgressReport = (wbsEntries: WBSEntry[], projectId?: string) => {
  const filteredEntries = projectId 
    ? wbsEntries.filter(entry => entry.projectId === projectId)
    : wbsEntries;

  const totalTasks = filteredEntries.length;
  const completedTasks = filteredEntries.filter(entry => entry.status === 'COMPLETED').length;
  const inProgressTasks = filteredEntries.filter(entry => entry.status === 'IN_PROGRESS').length;
  const overdueTasks = filteredEntries.filter(entry => isOverdue(entry)).length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
};
```

#### 担当者別作業負荷分析パターン
```typescript
// 作業負荷分析
const analyzeWorkload = (wbsEntries: WBSEntry[], users: User[]) => {
  return users.map(user => {
    const userEntries = wbsEntries.filter(entry => entry.assigneeId === user.id);
    const activeTasks = userEntries.filter(entry => 
      entry.status === 'IN_PROGRESS' || entry.status === 'NOT_STARTED'
    ).length;
    
    const completedTasks = userEntries.filter(entry => entry.status === 'COMPLETED').length;
    const overdueTasksCount = userEntries.filter(entry => isOverdue(entry)).length;
    
    // 効率性計算（実績工数 / 予定工数）
    const totalEstimated = userEntries.reduce((sum, entry) => sum + entry.estimatedHours, 0);
    const totalActual = userEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
    const efficiency = totalEstimated > 0 ? totalActual / totalEstimated : 0;
    
    // 作業負荷レベル判定
    const currentWorkload = determineWorkloadLevel(activeTasks, overdueTasksCount);

    return {
      assigneeId: user.id,
      assigneeName: user.name,
      activeTasks,
      completedTasks,
      overdueTasksCount,
      efficiency,
      currentWorkload
    };
  });
};
```

### 3. WBS遅延分析パターン
```typescript
// 遅延状況判定
const getDelayStatus = (entry: WBSEntry) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!entry.plannedEndDate) return { status: 'unknown', days: 0 };
  
  const plannedEnd = new Date(entry.plannedEndDate);
  plannedEnd.setHours(0, 0, 0, 0);
  
  // 完了済みの場合は実際の終了日と予定終了日を比較
  if (entry.status === 'COMPLETED') {
    if (entry.actualEndDate) {
      const actualEnd = new Date(entry.actualEndDate);
      actualEnd.setHours(0, 0, 0, 0);
      const diffTime = actualEnd.getTime() - plannedEnd.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        return { status: 'delayed', days: diffDays }; // 遅延日数
      } else if (diffDays < 0) {
        return { status: 'on-time', days: Math.abs(diffDays) }; // 前倒し日数
      } else {
        return { status: 'on-time', days: 0 }; // 予定通り
      }
    }
    return { status: 'on-time', days: 0 };
  }
  
  // 未完了の場合は今日の日付と予定終了日を比較
  const diffTime = today.getTime() - plannedEnd.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return { status: 'overdue', days: diffDays }; // 期限超過日数
  }
  
  return { status: 'on-track', days: Math.abs(diffDays) }; // 余裕日数
};
```

### 4. WBS一括操作パターン

#### 一括WBS作業登録パターン
```typescript
// 一括WBS作業登録
const handleBulkWBSCreation = async (entries: WBSEntryData[]) => {
  try {
    const response = await fetch('/api/wbs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    });

    if (response.ok) {
      const result = await response.json();
      showSuccessMessage(`${entries.length}件のWBS作業を登録しました`);
      return result;
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (error) {
    showErrorMessage(`WBS作業登録エラー: ${error.message}`);
    throw error;
  }
};
```

#### 既存タスクからのWBS作業追加パターン
```typescript
// 既存タスクからWBS作業を生成
const createWBSFromTasks = (selectedTasks: Task[], commonSettings: Partial<WBSEntry>) => {
  return selectedTasks.map(task => ({
    name: task.name,
    description: task.description,
    taskId: task.id,
    projectId: task.projectId,
    phaseId: task.phaseId,
    estimatedHours: commonSettings.estimatedHours || task.estimatedHours || 0,
    assigneeId: commonSettings.assigneeId || null,
    plannedStartDate: commonSettings.plannedStartDate || null,
    plannedEndDate: commonSettings.plannedEndDate || null,
    status: commonSettings.status || 'NOT_STARTED',
    actualStartDate: null,
    actualEndDate: null,
    actualHours: 0
  }));
};
```

### 5. WBSガントチャートパターン
```typescript
// ガントチャート表示用データ変換
const transformToGanttData = (wbsEntries: WBSEntry[]) => {
  return wbsEntries.map(entry => ({
    id: entry.id,
    name: entry.name,
    start: entry.plannedStartDate || new Date(),
    end: entry.plannedEndDate || new Date(),
    actualStart: entry.actualStartDate,
    actualEnd: entry.actualEndDate,
    progress: calculateProgress(entry),
    status: entry.status,
    assignee: entry.assignee?.name || '未割当',
    isOverdue: isOverdue(entry),
    delayDays: getDelayStatus(entry).days
  }));
};

// 進捗率計算
const calculateProgress = (entry: WBSEntry): number => {
  if (entry.status === 'COMPLETED') return 100;
  if (entry.status === 'NOT_STARTED') return 0;
  
  // 工数ベースの進捗計算
  if (entry.estimatedHours > 0) {
    return Math.min((entry.actualHours / entry.estimatedHours) * 100, 95);
  }
  
  // 日付ベースの進捗計算
  if (entry.plannedStartDate && entry.plannedEndDate) {
    const today = new Date();
    const start = new Date(entry.plannedStartDate);
    const end = new Date(entry.plannedEndDate);
    
    if (today < start) return 0;
    if (today > end) return 95; // 期限超過でも100%にはしない
    
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min((elapsedDays / totalDays) * 100, 95);
  }
  
  return 50; // デフォルト進捗
};
```

### 6. WBSカレンダー表示パターン
```typescript
// カレンダー表示用データ変換
const transformToCalendarTasks = (wbsEntries: WBSEntry[]): CalendarTask[] => {
  return wbsEntries.map(entry => ({
    id: entry.id,
    name: entry.name,
    projectName: entry.project?.name || '未分類',
    phaseName: entry.phase?.name || '未分類',
    assigneeName: entry.assignee?.name || '未割当',
    status: entry.status,
    plannedStartDate: entry.plannedStartDate,
    plannedEndDate: entry.plannedEndDate,
    actualStartDate: entry.actualStartDate,
    actualEndDate: entry.actualEndDate,
    estimatedHours: entry.estimatedHours,
    actualHours: entry.actualHours,
    isOverdue: isOverdue(entry),
    color: getStatusColor(entry.status)
  }));
};

// ステータス別色分け
const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'NOT_STARTED': return '#6B7280'; // グレー
    case 'IN_PROGRESS': return '#3B82F6'; // ブルー
    case 'REVIEW_PENDING': return '#F59E0B'; // イエロー
    case 'REVIEWED': return '#10B981'; // グリーン
    case 'COMPLETED': return '#059669'; // ダークグリーン
    default: return '#6B7280';
  }
};
```

### 7. WBS統合管理パターン
```typescript
// WBSページでの統合管理
const WBSManagementPattern = {
  // タブ切り替え管理
  tabManagement: {
    gantt: 'ガントチャート表示',
    dashboard: 'ダッシュボード表示',
    calendar: 'カレンダー表示'
  },
  
  // フィルタリング機能
  filtering: {
    byProject: (entries: WBSEntry[], projectId: string) => 
      entries.filter(entry => entry.projectId === projectId),
    byAssignee: (entries: WBSEntry[], assigneeId: string) => 
      entries.filter(entry => entry.assigneeId === assigneeId),
    byStatus: (entries: WBSEntry[], status: TaskStatus) => 
      entries.filter(entry => entry.status === status)
  },
  
  // 一括操作機能
  bulkOperations: {
    createFromTasks: '既存タスクからWBS作業追加',
    createNew: '新規WBS作業一括作成',
    updateStatus: '一括ステータス更新',
    assignUsers: '一括担当者割り当て'
  }
};
```

## 今後の拡張パターン

### 1. 機能拡張の考慮点
- **モジュール化**: 機能ごとの独立性確保
- **設定可能性**: 環境変数による動作制御
- **国際化対応**: 多言語対応の準備
- **🆕 WBS機能拡張**: 依存関係管理、クリティカルパス分析、リソース最適化

### 2. スケーラビリティ
- **データベース最適化**: インデックス設計とクエリ最適化
- **キャッシュ戦略**: Redis等の外部キャッシュ導入検討
- **API分離**: マイクロサービス化の検討
- **🆕 WBSパフォーマンス**: 大規模プロジェクト対応、リアルタイム更新、並列処理最適化
