# 本番環境開発ルール

## 🚀 Vercelデプロイ完了状況

### デプロイ環境
- **プラットフォーム**: Vercel
- **データベース**: Neon PostgreSQL (本番環境)
- **ドメイン**: Vercelが提供するドメイン
- **SSL**: 自動設定済み
- **CDN**: Vercel Edge Network

### 本番環境設定
```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "PRISMA_GENERATE_SKIP_AUTOINSTALL": "true"
  }
}
```

### 環境変数（本番）
- `DATABASE_URL`: Neon PostgreSQL接続文字列
- `JWT_SECRET`: 本番用JWT秘密鍵
- `NODE_ENV`: production

## 📋 本番環境での開発ルール

### 🔒 型安全性の厳守

#### 1. TypeScript厳密モード
```typescript
// 必須：すべての変数に明確な型定義
interface TimeEntryData {
  projectId: string;
  phaseId: string;
  taskId: string;
  hours: number;
  date: string;
  description?: string;
}

// 禁止：any型の使用
❌ const data: any = response.data;
✅ const data: TimeEntryData = response.data;
```

#### 2. Prisma型の活用
```typescript
// 必須：Prismaが生成する型を使用
import { User, Project, TimeEntry } from '@prisma/client';

// 必須：リレーション型の明確な定義
type ProjectWithPhases = Project & {
  phases: Phase[];
  timeEntries: TimeEntry[];
};
```

#### 3. API レスポンス型の統一
```typescript
// 必須：統一されたレスポンス型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 使用例
const response: ApiResponse<TimeEntry[]> = await fetch('/api/time-entries');
```

### 🔄 Promise・非同期処理のルール

#### 1. async/await の必須使用
```typescript
// 必須：async/awaitパターン
const handleSubmit = async (data: TimeEntryData) => {
  try {
    const response = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<TimeEntry> = await response.json();
    return result;
  } catch (error) {
    console.error('Time entry creation failed:', error);
    throw error;
  }
};

// 禁止：.then()チェーン（可読性が低い）
❌ fetch('/api/time-entries').then(response => response.json()).then(data => ...);
```

#### 2. エラーハンドリングの必須実装
```typescript
// 必須：try-catchによる包括的エラーハンドリング
const fetchData = async () => {
  try {
    const data = await apiCall();
    return data;
  } catch (error) {
    // ログ出力
    console.error('API Error:', error);
    
    // ユーザーフレンドリーなエラー表示
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('予期しないエラーが発生しました');
    }
    
    // エラーの再スロー（必要に応じて）
    throw error;
  }
};
```

#### 3. Promise.allの適切な使用
```typescript
// 必須：並列処理が可能な場合はPromise.allを使用
const loadInitialData = async () => {
  try {
    const [users, projects, phases] = await Promise.all([
      fetchUsers(),
      fetchProjects(),
      fetchPhases()
    ]);
    
    return { users, projects, phases };
  } catch (error) {
    console.error('Initial data loading failed:', error);
    throw error;
  }
};

// 必須：一部失敗を許容する場合はPromise.allSettled
const bulkOperation = async (items: any[]) => {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed };
};
```

### 🛡️ セキュリティルール

#### 1. 入力値検証の必須実装
```typescript
// 必須：すべての入力値に対するバリデーション
const validateTimeEntry = (data: TimeEntryData): void => {
  if (!data.projectId || typeof data.projectId !== 'string') {
    throw new Error('プロジェクトIDが無効です');
  }
  
  if (!data.hours || data.hours <= 0 || data.hours > 24) {
    throw new Error('工数は0より大きく24以下で入力してください');
  }
  
  if (!data.date || new Date(data.date) > new Date()) {
    throw new Error('未来の日付は入力できません');
  }
};
```

#### 2. 認証チェックの必須実装
```typescript
// 必須：すべてのAPIエンドポイントで認証チェック
export async function POST(request: Request) {
  try {
    // 認証チェック
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 権限チェック
    if (user.role === 'MEMBER' && !isOwnData(user.id, requestData)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // 処理実行
    const result = await processRequest(requestData);
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 3. SQLインジェクション対策
```typescript
// 必須：Prismaを使用（生SQLの禁止）
✅ const users = await prisma.user.findMany({
  where: { email: userEmail }
});

// 禁止：生SQLクエリ
❌ const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userEmail}`;
```

### 🎯 パフォーマンスルール

#### 1. データベースクエリの最適化
```typescript
// 必須：必要なフィールドのみ選択
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    // 不要なフィールドは除外
  }
});

// 必須：適切なincludeの使用
const projectWithRelations = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    phases: {
      include: {
        tasks: true
      }
    },
    timeEntries: {
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    }
  }
});
```

#### 2. React最適化
```typescript
// 必須：useMemoによる計算結果のメモ化
const expensiveCalculation = useMemo(() => {
  return timeEntries.reduce((total, entry) => total + entry.hours, 0);
}, [timeEntries]);

// 必須：useCallbackによるコールバック関数のメモ化
const handleSubmit = useCallback(async (data: TimeEntryData) => {
  await submitTimeEntry(data);
}, []);

// 必須：React.memoによるコンポーネントのメモ化
const TimeEntryItem = React.memo(({ entry }: { entry: TimeEntry }) => {
  return <div>{entry.description}</div>;
});
```

#### 3. 状態管理の最適化
```typescript
// 必須：状態の適切な分割
interface AppState {
  // ユーザー関連
  currentUser: User | null;
  users: User[];
  
  // プロジェクト関連
  projects: Project[];
  currentProject: Project | null;
  
  // 工数関連
  timeEntries: TimeEntry[];
  
  // UI状態
  loading: boolean;
  error: string | null;
}

// 必須：不要な再レンダリングの防止
const { currentUser, projects } = useApp(); // 必要な状態のみ取得
```

### 🔧 コード品質ルール

#### 1. 関数・コンポーネントの設計
```typescript
// 必須：単一責任の原則
const calculateTotalHours = (timeEntries: TimeEntry[]): number => {
  return timeEntries.reduce((total, entry) => total + entry.hours, 0);
};

const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}時間`;
};

// 必須：適切な関数名
❌ const calc = (data: any) => { ... };
✅ const calculateProjectProgress = (project: Project, timeEntries: TimeEntry[]): number => { ... };
```

#### 2. エラーメッセージの統一
```typescript
// 必須：ユーザーフレンドリーなエラーメッセージ
const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field}は必須項目です`,
    INVALID_HOURS: '工数は0より大きい値を入力してください',
    FUTURE_DATE: '未来の日付は入力できません',
  },
  API: {
    NETWORK_ERROR: 'ネットワークエラーが発生しました。しばらく待ってから再試行してください',
    SERVER_ERROR: 'サーバーエラーが発生しました。管理者にお問い合わせください',
    UNAUTHORIZED: 'ログインが必要です',
    FORBIDDEN: 'この操作を実行する権限がありません',
  }
} as const;
```

#### 3. ログ出力の統一
```typescript
// 必須：構造化ログ
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  }
};

// 使用例
logger.info('Time entry created', { userId: user.id, projectId: data.projectId });
logger.error('Database connection failed', error);
```

### 🚀 デプロイメントルール

#### 1. 本番デプロイ前チェックリスト
```bash
# 必須：デプロイ前の確認事項
□ TypeScriptエラーなし: npm run type-check
□ ESLintエラーなし: npm run lint
□ ビルド成功: npm run build
□ 環境変数設定確認
□ データベースマイグレーション確認
□ セキュリティチェック
```

#### 2. 環境変数管理
```typescript
// 必須：環境変数の型安全な取得
const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

// 使用例
const DATABASE_URL = getEnvVar('DATABASE_URL');
const JWT_SECRET = getEnvVar('JWT_SECRET');
```

#### 3. データベースマイグレーション
```bash
# 必須：本番環境でのマイグレーション手順
1. npx prisma migrate deploy  # 本番マイグレーション実行
2. npx prisma generate        # クライアント再生成
3. 動作確認                   # 基本機能の動作確認
```

### 📊 監視・ログルール

#### 1. エラー監視
```typescript
// 必須：重要なエラーの監視
const monitorCriticalError = (error: Error, context: any) => {
  // ログ出力
  logger.error('Critical error occurred', { error: error.message, context });
  
  // 本番環境では外部監視サービスに送信
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket等への送信
    sendToMonitoringService(error, context);
  }
};
```

#### 2. パフォーマンス監視
```typescript
// 必須：重要な処理の実行時間監視
const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logger.info(`Performance: ${operationName}`, { duration });
    
    // 閾値を超えた場合の警告
    if (duration > 5000) { // 5秒
      logger.warn(`Slow operation detected: ${operationName}`, { duration });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Operation failed: ${operationName}`, { duration, error });
    throw error;
  }
};
```

### 🔄 継続的改善ルール

#### 1. コードレビューポイント
- 型安全性の確保
- エラーハンドリングの適切性
- パフォーマンスへの配慮
- セキュリティの確保
- 可読性・保守性

#### 2. 定期的な技術的負債の解消
- 未使用コードの削除
- 依存関係の更新
- パフォーマンスボトルネックの解消
- セキュリティ脆弱性の修正

#### 3. ドキュメント更新
- API仕様書の更新
- README.mdの更新
- memory-bankの更新
- 運用手順書の更新

## 🚨 緊急時対応ルール

### 1. 本番障害発生時
1. **即座にログ確認**: Vercel Function Logsを確認
2. **データベース状態確認**: Neon Consoleで接続状況確認
3. **ロールバック判断**: 必要に応じて前バージョンにロールバック
4. **ユーザー通知**: 影響範囲と復旧見込みを通知

### 2. セキュリティインシデント
1. **即座にアクセス制限**: 必要に応じてサービス停止
2. **ログ保全**: 攻撃ログの保存
3. **脆弱性修正**: セキュリティパッチの適用
4. **再発防止策**: セキュリティ強化の実装

### 3. データ整合性問題
1. **データバックアップ確認**: 最新バックアップの確認
2. **整合性チェック**: データ整合性の詳細確認
3. **修正スクリプト実行**: 安全な修正処理の実行
4. **検証**: 修正結果の検証

## 📈 今後の改善計画

### 短期（1ヶ月以内）
- [ ] 包括的なテスト実装
- [ ] エラー監視システム導入
- [ ] パフォーマンス最適化

### 中期（3ヶ月以内）
- [ ] CI/CDパイプライン構築
- [ ] セキュリティ監査実施
- [ ] 負荷テスト実施

### 長期（6ヶ月以内）
- [ ] マイクロサービス化検討
- [ ] 高可用性アーキテクチャ導入
- [ ] 国際化対応

---

**重要**: これらのルールは本番環境の安定性とセキュリティを確保するために必須です。すべての開発者が遵守し、定期的に見直しを行ってください。
