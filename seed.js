const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PHASES = [
  { name: '要件定義', description: 'プロジェクトの要件を定義する工程' },
  { name: '基本設計', description: 'システムの基本設計を行う工程' },
  { name: '詳細設計', description: 'システムの詳細設計を行う工程' },
  { name: '実装', description: 'システムの実装を行う工程' },
  { name: 'テスト', description: 'システムのテストを行う工程' },
  { name: 'リリース', description: 'システムのリリースを行う工程' }
];

const DEFAULT_TASKS = [
  { name: '調査・分析', description: '現状調査と分析を行う' },
  { name: '設計・開発', description: '設計と開発を行う' },
  { name: 'レビュー', description: 'レビューを行う' },
  { name: 'テスト', description: 'テストを行う' },
  { name: 'ドキュメント作成', description: 'ドキュメントを作成する' }
];

async function main() {
  console.log('シードデータの投入を開始します...');

  // 既存のユーザーをチェック
  const existingUser = await prisma.user.findUnique({
    where: { email: 'sasao@sas-com.com' }
  });

  if (!existingUser) {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash('ts05140952', 10);

    // 初期ユーザー（笹尾 豊樹、管理者）を作成
    const user = await prisma.user.create({
      data: {
        name: '笹尾 豊樹',
        email: 'sasao@sas-com.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('初期ユーザーが作成されました:');
    console.log(`- 名前: ${user.name}`);
    console.log(`- メールアドレス: ${user.email}`);
    console.log(`- 権限: ${user.role}`);
    console.log(`- パスワード: ts05140952`);
  } else {
    console.log('笹尾 豊樹さんは既に登録されています');
  }

  // サンプルプロジェクトを作成（存在しない場合のみ）
  const existingProject = await prisma.project.findFirst({
    where: { name: 'サンプルプロジェクト' }
  });

  if (!existingProject) {
    const user = await prisma.user.findUnique({
      where: { email: 'sasao@sas-com.com' }
    });

    const project = await prisma.project.create({
      data: {
        name: 'サンプルプロジェクト',
        description: 'デフォルトの工程とタスクを含むサンプルプロジェクト',
        startDate: new Date(),
        managerId: user?.id,
        status: 'ACTIVE'
      }
    });

    console.log('サンプルプロジェクトが作成されました');

    // デフォルト工程を作成
    const phases = [];
    for (let i = 0; i < DEFAULT_PHASES.length; i++) {
      const phaseData = DEFAULT_PHASES[i];
      const phase = await prisma.phase.create({
        data: {
          projectId: project.id,
          name: phaseData.name,
          description: phaseData.description,
          order: i + 1
        }
      });
      phases.push(phase);
      console.log(`工程「${phase.name}」が作成されました`);
    }

    // 各工程にデフォルトタスクを作成
    for (const phase of phases) {
      for (let j = 0; j < DEFAULT_TASKS.length; j++) {
        const taskData = DEFAULT_TASKS[j];
        const task = await prisma.task.create({
          data: {
            phaseId: phase.id,
            projectId: project.id,
            name: taskData.name,
            description: taskData.description,
            estimatedHours: 0,
            order: j + 1
          }
        });
        console.log(`  タスク「${task.name}」が工程「${phase.name}」に作成されました`);
      }
    }

    console.log('サンプルプロジェクトとデフォルトの工程・タスクが作成されました');
  } else {
    console.log('サンプルプロジェクトは既に存在します');
  }

  console.log('シードデータの投入が完了しました');
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
