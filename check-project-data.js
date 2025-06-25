const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkProjectData() {
  console.log('=== プロジェクトデータ詳細確認 ===');
  
  try {
    // プロジェクト詳細確認
    const projects = await prisma.project.findMany({
      include: {
        phases: {
          include: {
            tasks: true
          }
        },
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    console.log('\n1. プロジェクト詳細:');
    projects.forEach(project => {
      console.log(`\nプロジェクト: ${project.name}`);
      console.log(`  ID: ${project.id}`);
      console.log(`  ステータス: ${project.status}`);
      console.log(`  開始日: ${project.startDate}`);
      console.log(`  マネージャー: ${project.manager ? project.manager.name : '未設定'}`);
      console.log(`  工程数: ${project.phases.length}`);
      
      if (project.phases.length > 0) {
        console.log('  工程一覧:');
        project.phases.forEach(phase => {
          console.log(`    - ${phase.name} (ID: ${phase.id}, タスク数: ${phase.tasks.length})`);
          if (phase.tasks.length > 0) {
            console.log('      タスク一覧:');
            phase.tasks.forEach(task => {
              console.log(`        - ${task.name} (ID: ${task.id})`);
            });
          }
        });
      } else {
        console.log('  ⚠️ 工程が設定されていません');
      }
    });
    
    // 工程とタスクの総数確認
    const phaseCount = await prisma.phase.count();
    const taskCount = await prisma.task.count();
    
    console.log(`\n2. 全体統計:`);
    console.log(`  総工程数: ${phaseCount}`);
    console.log(`  総タスク数: ${taskCount}`);
    
    // 時間入力の詳細確認
    const timeEntries = await prisma.timeEntry.findMany({
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
        phase: { select: { name: true } },
        task: { select: { name: true } }
      }
    });
    
    console.log(`\n3. 時間入力詳細 (${timeEntries.length}件):`);
    if (timeEntries.length > 0) {
      timeEntries.forEach(entry => {
        console.log(`  - ${entry.user.name}: ${entry.hours}h`);
        console.log(`    プロジェクト: ${entry.project.name}`);
        console.log(`    工程: ${entry.phase.name}`);
        console.log(`    タスク: ${entry.task.name}`);
        console.log(`    日付: ${entry.date}`);
        console.log(`    説明: ${entry.description || '(なし)'}`);
      });
    } else {
      console.log('  時間入力データがありません');
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectData();
