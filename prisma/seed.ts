import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_PHASES, DEFAULT_TASKS } from '../src/utils/defaultData';

const prisma = new PrismaClient();

async function main() {
  // 既存のユーザーをチェック
  const existingUser = await prisma.user.findUnique({
    where: { email: 'sasao@sas-com.com' }
  });

  if (!existingUser) {
    // パスワードをハッシュ化（実際のアプリでパスワード認証を実装する場合）
    const hashedPassword = await bcrypt.hash('ts05140952', 10);

    // 初期ユーザー（笹尾 豊樹、管理者）を作成
    const user = await prisma.user.create({
      data: {
        name: '笹尾 豊樹',
        email: 'sasao@sas-com.com',
        password: hashedPassword,
        role: 'ADMIN', // 管理者権限
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
    }

    // 各工程にデフォルトタスクを作成
    for (const phase of phases) {
      for (let j = 0; j < DEFAULT_TASKS.length; j++) {
        const taskData = DEFAULT_TASKS[j];
        await prisma.task.create({
          data: {
            phaseId: phase.id,
            projectId: project.id,
            name: taskData.name,
            description: taskData.description,
            estimatedHours: 0,
            order: j + 1
          }
        });
      }
    }

    console.log('サンプルプロジェクトとデフォルトの工程・タスクが作成されました');
  } else {
    console.log('サンプルプロジェクトは既に存在します');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });