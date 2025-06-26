const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function cleanupProjects() {
  try {
    console.log('=== プロジェクトクリーンアップ開始 ===');
    
    // 現在のプロジェクト一覧を表示
    const projects = await prisma.project.findMany();
    console.log('\n現在のプロジェクト:');
    projects.forEach(project => {
      console.log(`- ${project.name} (ID: ${project.id})`);
    });
    
    // 削除対象のプロジェクト名
    const projectsToDelete = ['サンプルプロジェクト', '年間スキル報告書'];
    
    for (const projectName of projectsToDelete) {
      const project = await prisma.project.findFirst({
        where: { name: projectName }
      });
      
      if (project) {
        console.log(`\n"${projectName}" を削除中...`);
        
        // 関連データを削除（Cascade Deleteが設定されているため、プロジェクトを削除すれば関連データも削除される）
        await prisma.project.delete({
          where: { id: project.id }
        });
        
        console.log(`✅ "${projectName}" を削除しました`);
      } else {
        console.log(`ℹ️ "${projectName}" は見つかりませんでした`);
      }
    }
    
    // 削除後のプロジェクト一覧を表示
    const remainingProjects = await prisma.project.findMany();
    console.log('\n削除後のプロジェクト:');
    if (remainingProjects.length > 0) {
      remainingProjects.forEach(project => {
        console.log(`- ${project.name} (ID: ${project.id})`);
      });
    } else {
      console.log('プロジェクトはありません');
    }
    
    console.log('\n=== クリーンアップ完了 ===');
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupProjects();
