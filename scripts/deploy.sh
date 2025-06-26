#!/bin/bash

# Vercelデプロイ用スクリプト
# 使用方法: ./scripts/deploy.sh

echo "🚀 Vercelデプロイの準備を開始します..."

# 1. 依存関係のインストール
echo "📦 依存関係をインストール中..."
npm install

# 2. Prismaクライアントの生成
echo "🔧 Prismaクライアントを生成中..."
npx prisma generate

# 3. ビルドテスト
echo "🏗️ ビルドテストを実行中..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ ビルドテストが成功しました"
    
    # 4. Vercelデプロイ
    echo "🚀 Vercelにデプロイ中..."
    npx vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "🎉 デプロイが完了しました！"
        echo ""
        echo "次の手順を実行してください："
        echo "1. Vercel Dashboard で環境変数を設定"
        echo "2. データベースマイグレーションを実行"
        echo "3. 初期データの投入"
        echo ""
        echo "詳細はREADME.mdのVercelデプロイ手順を参照してください。"
    else
        echo "❌ デプロイに失敗しました"
        exit 1
    fi
else
    echo "❌ ビルドテストに失敗しました"
    echo "エラーを修正してから再度実行してください"
    exit 1
fi
