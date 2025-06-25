const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('データベース接続テスト中...');
    
    // ユーザー数を確認
    const userCount = await prisma.user.count();
    console.log(`ユーザー数: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany();
      console.log('ユーザー一覧:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    // プロジェクト数を確認
    const projectCount = await prisma.project.count();
    console.log(`プロジェクト数: ${projectCount}`);
    
    if (projectCount > 0) {
      const projects = await prisma.project.findMany();
      console.log('プロジェクト一覧:');
      projects.forEach(project => {
        console.log(`- ${project.name}: ${project.description}`);
      });
    }
    
    // 工程数を確認
    const phaseCount = await prisma.phase.count();
    console.log(`工程数: ${phaseCount}`);
    
    // タスク数を確認
    const taskCount = await prisma.task.count();
    console.log(`タスク数: ${taskCount}`);
    
    // 時間入力数を確認
    const timeEntryCount = await prisma.timeEntry.count();
    console.log(`時間入力数: ${timeEntryCount}`);
    
  } catch (error) {
    console.error('データベースエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
