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

## 今後の拡張パターン

### 1. 機能拡張の考慮点
- **モジュール化**: 機能ごとの独立性確保
- **設定可能性**: 環境変数による動作制御
- **国際化対応**: 多言語対応の準備

### 2. スケーラビリティ
- **データベース最適化**: インデックス設計とクエリ最適化
- **キャッシュ戦略**: Redis等の外部キャッシュ導入検討
- **API分離**: マイクロサービス化の検討
