# プロジェクト概要書

## プロジェクト名
工数管理システム (Man-Hour Management System)

## プロジェクトの目的
企業やチームにおける工数管理を効率化し、プロジェクトの進捗管理と工数の可視化を実現するWebアプリケーションの開発。

## 主要な機能要件

### 1. ユーザー管理
- ユーザー登録・認証機能
- 役割ベースのアクセス制御（ADMIN、MANAGER、MEMBER）
- ログイン・ログアウト機能

### 2. プロジェクト管理
- プロジェクトの作成・編集・削除
- プロジェクトステータス管理（ACTIVE、COMPLETED、ON_HOLD）
- プロジェクトマネージャーの割り当て

### 3. 工程・タスク管理
- プロジェクト内の工程（Phase）管理
- 工程内のタスク管理
- 見積工数の設定

### 4. 工数入力・管理
- 日次工数入力機能
- 工数の編集・削除機能
- 一括工数入力機能

### 5. ダッシュボード・レポート
- プロジェクト別工数集計
- 工程別工数集計
- 月次レポート機能
- 進捗状況の可視化

## 技術要件

### フロントエンド
- Next.js 15.3.4 (React 19.0.0)
- TypeScript
- Tailwind CSS 4.0

### バックエンド
- Next.js API Routes
- Prisma ORM 6.10.1
- PostgreSQL データベース

### 認証・セキュリティ
- bcryptjs によるパスワードハッシュ化
- セッションベース認証

### 開発環境
- Node.js
- TypeScript
- ESLint

## データモデル概要

### 主要エンティティ
1. **User** - ユーザー情報
2. **Project** - プロジェクト情報
3. **Phase** - 工程情報
4. **Task** - タスク情報
5. **TimeEntry** - 工数入力情報

### リレーション
- User ←→ Project (1:N, マネージャー関係)
- User ←→ TimeEntry (1:N)
- Project ←→ Phase (1:N)
- Project ←→ Task (1:N)
- Project ←→ TimeEntry (1:N)
- Phase ←→ Task (1:N)
- Phase ←→ TimeEntry (1:N)
- Task ←→ TimeEntry (1:N)

## 成功基準
1. 複数ユーザーによる同時工数入力が可能
2. リアルタイムでの工数集計・可視化
3. 役割に応じた適切なアクセス制御
4. 直感的で使いやすいUI/UX
5. データの整合性確保

## 制約事項
- PostgreSQLデータベースを使用
- レスポンシブデザイン対応
- ブラウザ互換性（モダンブラウザ対応）

## プロジェクト範囲
- 工数管理の基本機能実装
- ダッシュボードによる可視化
- ユーザー管理機能
- 基本的なレポート機能

## 除外事項
- 高度な分析機能
- 外部システム連携
- モバイルアプリ
- 複雑な承認ワークフロー
