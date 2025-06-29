# 技術コンテキスト（2025/6/29更新）

## 技術スタック

### フロントエンド
- **Next.js 15.3.4**: React フレームワーク（App Router使用）
- **React 19.0.0**: UIライブラリ
- **TypeScript 5**: 型安全性の確保
- **Tailwind CSS 4.0**: ユーティリティファーストCSS
- **PostCSS**: CSS処理

### バックエンド
- **Next.js API Routes**: サーバーサイドAPI
- **Prisma 6.10.1**: ORM（Object-Relational Mapping）
- **PostgreSQL**: リレーショナルデータベース
- **bcryptjs 3.0.2**: パスワードハッシュ化

### 開発環境
- **Node.js**: JavaScript実行環境
- **npm**: パッケージマネージャー
- **ESLint 9**: コード品質チェック
- **ts-node 10.9.2**: TypeScript実行環境

## プロジェクト構造

### ディレクトリ構成
```
man-hour-management/
├── .clinerules/           # Cline設定・メモリバンク
├── .next/                 # Next.js ビルド出力
├── lib/                   # ライブラリ設定
│   └── prisma.ts         # Prisma クライアント設定
├── prisma/               # データベース関連
│   ├── schema.prisma     # データベーススキーマ
│   ├── seed.ts          # 初期データ投入
│   └── migrations/      # マイグレーションファイル
├── public/              # 静的ファイル
├── src/                 # ソースコード
│   ├── app/            # Next.js App Router
│   │   ├── api/        # API Routes
│   │   ├── dashboard/  # ダッシュボード画面
│   │   ├── login/      # ログイン画面
│   │   ├── projects/   # プロジェクト管理画面
│   │   ├── time-entry/ # 工数入力画面
│   │   └── users/      # ユーザー管理画面
│   ├── components/     # 再利用可能コンポーネント
│   ├── contexts/       # React Context
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
├── package.json        # 依存関係・スクリプト
└── tsconfig.json       # TypeScript設定
```

### API Routes 構成
```
/api/
├── admin/
│   ├── default-data/    # デフォルトデータ作成
│   └── init-data/       # 初期データ投入
├── organizations/       # 組織管理API
│   ├── companies/       # 会社管理API
│   ├── divisions/       # 事業部管理API
│   ├── departments/     # 部署管理API
│   └── groups/          # グループ管理API
├── phases/              # 工程管理API
├── projects/            # プロジェクト管理API
├── tasks/               # タスク管理API
│   └── [id]/           # 個別タスクAPI
├── time-entries/        # 工数管理API
│   └── [id]/           # 個別工数API
├── users/               # ユーザー管理API
│   └── login/          # ログインAPI
└── test-db/            # DB接続テスト
```

## データベース設計

### Prisma Schema 構成
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 主要モデル
1. **User**: ユーザー情報・組織所属
2. **Project**: プロジェクト情報
3. **Phase**: 工程情報
4. **Task**: タスク情報
5. **TimeEntry**: 工数入力情報
6. **Company**: 会社マスタ
7. **Division**: 事業部マスタ
8. **Department**: 部署マスタ
9. **Group**: グループマスタ

### リレーション設計
- User → Project (1:N, Manager関係)
- User → TimeEntry (1:N)
- Project → Phase (1:N)
- Project → Task (1:N)
- Project → TimeEntry (1:N)
- Phase → Task (1:N)
- Phase → TimeEntry (1:N)
- Task → TimeEntry (1:N)

## 開発環境セットアップ

### 必要な環境
- Node.js (推奨: LTS版)
- PostgreSQL データベース
- npm または yarn

### 環境変数設定
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 開発サーバー起動
```bash
# 依存関係インストール
npm install

# データベースマイグレーション
npx prisma migrate dev

# 初期データ投入
npx prisma db seed

# 開発サーバー起動
npm run dev
```

### 利用可能なスクリプト
```json
{
  "dev": "next dev --turbopack",     # 開発サーバー（Turbopack使用）
  "build": "next build",             # プロダクションビルド
  "start": "next start",             # プロダクションサーバー
  "lint": "next lint"                # ESLint実行
}
```

## 技術的制約・考慮事項

### パフォーマンス
- **Turbopack**: 高速な開発環境
- **App Router**: Next.js 13+ の新しいルーティング
- **Server Components**: サーバーサイドレンダリング最適化

### セキュリティ
- **bcryptjs**: パスワードハッシュ化
- **環境変数**: 機密情報の安全な管理
- **型安全性**: TypeScriptによる実行時エラー防止

### データベース
- **Prisma ORM**: 型安全なデータベースアクセス
- **マイグレーション**: スキーマ変更の管理
- **Cascade Delete**: 関連データの整合性確保

## 依存関係詳細

### 本番依存関係
```json
{
  "@prisma/client": "^6.10.1",      # Prisma クライアント
  "@types/bcryptjs": "^2.4.6",      # bcryptjs 型定義
  "@types/pg": "^8.15.4",           # PostgreSQL 型定義
  "bcryptjs": "^3.0.2",             # パスワードハッシュ化
  "next": "15.3.4",                 # Next.js フレームワーク
  "node-fetch": "^3.3.2",           # HTTP クライアント
  "pg": "^8.16.2",                  # PostgreSQL ドライバー
  "prisma": "^6.10.1",              # Prisma CLI
  "react": "^19.0.0",               # React ライブラリ
  "react-dom": "^19.0.0",           # React DOM
  "ts-node": "^10.9.2"              # TypeScript 実行環境
}
```

### 開発依存関係
```json
{
  "@eslint/eslintrc": "^3",          # ESLint 設定
  "@tailwindcss/postcss": "^4",     # Tailwind PostCSS
  "@types/node": "^20",              # Node.js 型定義
  "@types/react": "^19",             # React 型定義
  "@types/react-dom": "^19",         # React DOM 型定義
  "eslint": "^9",                    # ESLint
  "eslint-config-next": "15.3.4",   # Next.js ESLint設定
  "tailwindcss": "^4",               # Tailwind CSS
  "typescript": "^5"                 # TypeScript
}
```

## 設定ファイル

### TypeScript設定 (tsconfig.json)
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Next.js設定 (next.config.ts)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### ESLint設定 (eslint.config.mjs)
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

## デプロイメント（本番環境稼働中）

### ✅ 本番環境構成（Vercel + Neon PostgreSQL）
- **プラットフォーム**: Vercel（Edge Network活用）
- **データベース**: Neon PostgreSQL（本番用）
- **SSL/CDN**: 自動設定済み
- **ドメイン**: Vercelが提供するドメイン
- **スケーリング**: 自動スケーリング対応

### ✅ 本番環境設定（vercel.json）
```json
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

### ✅ 本番ビルドプロセス（自動化済み）
1. `prisma generate` - Prisma クライアント生成
2. `next build` - Next.js アプリケーションビルド
3. 自動デプロイ - Vercelによる自動デプロイ
4. `npx prisma migrate deploy` - 本番マイグレーション実行（手動）

### ✅ 本番環境変数
- `DATABASE_URL`: Neon PostgreSQL接続文字列（SSL必須）
- `JWT_SECRET`: 本番用JWT秘密鍵
- `NODE_ENV`: production
- `PRISMA_GENERATE_SKIP_AUTOINSTALL`: true

## トラブルシューティング

### よくある問題
1. **データベース接続エラー**
   - DATABASE_URL の確認
   - PostgreSQL サービスの起動確認

2. **Prisma関連エラー**
   - `npx prisma generate` の実行
   - スキーマとマイグレーションの同期確認

3. **型エラー**
   - TypeScript設定の確認
   - 型定義ファイルの更新

### デバッグツール
- **Prisma Studio**: `npx prisma studio`
- **Next.js DevTools**: ブラウザ開発者ツール
- **データベース確認スクリプト**: `check-db.js`

## 本番環境運用・改善点

### 🚨 本番環境監視（最優先）
- **エラー監視**: Sentry等の導入
- **パフォーマンス監視**: Vercel Analytics活用
- **アクセスログ**: 分析・アラート設定
- **データベース監視**: Neon Console活用

### パフォーマンス最適化（本番環境対応）
- **Vercel Edge Network**: 最適化済み
- **データベースクエリ**: Neon PostgreSQL最適化
- **React最適化**: useMemo/useCallback活用
- **バンドルサイズ**: Next.js最適化

### 本番環境セキュリティ強化
- **SSL/TLS**: Vercel自動設定済み
- **セキュリティヘッダー**: 設定が必要
- **環境変数管理**: Vercel Dashboard管理
- **データベースセキュリティ**: Neon SSL接続

### 開発体験向上（本番環境対応）
- **CI/CD パイプライン**: GitHub Actions + Vercel
- **テスト環境構築**: Jest/Testing Library
- **本番環境テスト**: E2Eテスト環境
- **監視ダッシュボード**: 運用監視体制

### 本番環境制約・考慮事項
- **Vercel Function制限**: 最大30秒実行時間
- **Neon PostgreSQL**: 接続数制限あり
- **Edge Network**: 地理的分散配信
- **自動スケーリング**: トラフィック増加対応
