const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataIntegrity() {
  console.log('=== データ整合性チェック ===');
  
  try {
    // プロジェクト、フェーズ、タスクの詳細確認
    const projects = await prisma.project.findMany({
      include: {
        phases: {
          include: {
            tasks: true
          }
        }
      }
    });
    
    console.log('\n📋 プロジェクト詳細:');
    projects.forEach(project => {
      console.log(`\n🔹 プロジェクト: ${project.name} (ID: ${project.id})`);
      console.log(`   ステータス: ${project.status}`);
      console.log(`   フェーズ数: ${project.phases.length}`);
      
      if (project.phases.length === 0) {
        console.log('   ⚠️  フェーズが設定されていません！');
      } else {
        project.phases.forEach(phase => {
          console.log(`   📁 フェーズ: ${phase.name} (ID: ${phase.id})`);
          console.log(`      タスク数: ${phase.tasks.length}`);
          
          if (phase.tasks.length === 0) {
            console.log('      ⚠️  タスクが設定されていません！');
          } else {
            phase.tasks.forEach(task => {
              console.log(`      📝 タスク: ${task.name} (ID: ${task.id})`);
            });
          }
        });
      }
    });
    
    // 統計情報
    const stats = {
      projects: await prisma.project.count(),
      phases: await prisma.phase.count(),
      tasks: await prisma.task.count(),
      timeEntries: await prisma.timeEntry.count(),
      users: await prisma.user.count()
    };
    
    console.log('\n📊 統計情報:');
    console.log(`   プロジェクト: ${stats.projects}件`);
    console.log(`   フェーズ: ${stats.phases}件`);
    console.log(`   タスク: ${stats.tasks}件`);
    console.log(`   時間入力: ${stats.timeEntries}件`);
    console.log(`   ユーザー: ${stats.users}件`);
    
    // 問題の特定
    console.log('\n🔍 問題の特定:');
    let hasIssues = false;
    
    if (stats.projects > 0 && stats.phases === 0) {
      console.log('   ❌ プロジェクトは存在するがフェーズが0件');
      hasIssues = true;
    }
    
    if (stats.phases > 0 && stats.tasks === 0) {
      console.log('   ❌ フェーズは存在するがタスクが0件');
      hasIssues = true;
    }
    
    if (stats.timeEntries > 0 && (stats.phases === 0 || stats.tasks === 0)) {
      console.log('   ❌ 時間入力は存在するがフェーズまたはタスクが不足');
      hasIssues = true;
    }
    
    if (!hasIssues) {
      console.log('   ✅ データ構造に問題は見つかりませんでした');
    }
    
    // 既存の時間入力の詳細確認
    if (stats.timeEntries > 0) {
      console.log('\n⏰ 既存の時間入力詳細:');
      const timeEntries = await prisma.timeEntry.findMany({
        include: {
          user: { select: { name: true } },
          project: { select: { name: true } },
          phase: { select: { name: true } },
          task: { select: { name: true } }
        }
      });
      
      timeEntries.forEach(entry => {
        console.log(`   📅 ${entry.date.toISOString().split('T')[0]}: ${entry.hours}h`);
        console.log(`      ユーザー: ${entry.user.name}`);
        console.log(`      プロジェクト: ${entry.project.name}`);
        console.log(`      フェーズ: ${entry.phase.name}`);
        console.log(`      タスク: ${entry.task.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataIntegrity();
