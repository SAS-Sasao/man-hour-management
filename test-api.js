const fetch = require('node-fetch');

async function testAPI() {
  console.log('=== API エンドポイントテスト ===');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. ユーザー取得テスト
    console.log('\n1. ユーザー取得テスト:');
    const usersResponse = await fetch(`${baseURL}/api/users`);
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✓ ユーザー取得成功: ${users.length}件`);
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    } else {
      console.log('✗ ユーザー取得失敗:', usersResponse.status);
    }
    
    // 2. プロジェクト取得テスト
    console.log('\n2. プロジェクト取得テスト:');
    const projectsResponse = await fetch(`${baseURL}/api/projects`);
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      console.log(`✓ プロジェクト取得成功: ${projects.length}件`);
      projects.forEach(project => {
        console.log(`  - ${project.name} (ステータス: ${project.status})`);
        console.log(`    工程数: ${project.phases ? project.phases.length : 0}`);
        if (project.phases && project.phases.length > 0) {
          project.phases.forEach(phase => {
            console.log(`      - ${phase.name} (タスク数: ${phase.tasks ? phase.tasks.length : 0})`);
          });
        }
      });
    } else {
      console.log('✗ プロジェクト取得失敗:', projectsResponse.status);
    }
    
    // 3. 時間入力取得テスト
    console.log('\n3. 時間入力取得テスト:');
    const timeEntriesResponse = await fetch(`${baseURL}/api/time-entries`);
    if (timeEntriesResponse.ok) {
      const timeEntries = await timeEntriesResponse.json();
      console.log(`✓ 時間入力取得成功: ${timeEntries.length}件`);
      timeEntries.forEach(entry => {
        console.log(`  - ${entry.hours}h (${entry.date})`);
        console.log(`    ユーザー: ${entry.user ? entry.user.name : '不明'}`);
        console.log(`    プロジェクト: ${entry.project ? entry.project.name : '不明'}`);
      });
    } else {
      console.log('✗ 時間入力取得失敗:', timeEntriesResponse.status);
    }
    
    // 4. 時間入力作成テスト
    console.log('\n4. 時間入力作成テスト:');
    
    // まず、利用可能なデータを取得
    const testUserId = users.length > 0 ? users[0].id : null;
    const testProject = projects.length > 0 ? projects[0] : null;
    const testPhase = testProject && testProject.phases && testProject.phases.length > 0 ? testProject.phases[0] : null;
    const testTask = testPhase && testPhase.tasks && testPhase.tasks.length > 0 ? testPhase.tasks[0] : null;
    
    if (testUserId && testProject && testPhase && testTask) {
      const testTimeEntry = {
        userId: testUserId,
        projectId: testProject.id,
        phaseId: testPhase.id,
        taskId: testTask.id,
        date: new Date().toISOString(),
        hours: 2.5,
        description: 'APIテスト用の時間入力'
      };
      
      console.log('テストデータ:', testTimeEntry);
      
      const createResponse = await fetch(`${baseURL}/api/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTimeEntry)
      });
      
      if (createResponse.ok) {
        const createdEntry = await createResponse.json();
        console.log('✓ 時間入力作成成功:', createdEntry.id);
        
        // 作成後に再度取得して確認
        const verifyResponse = await fetch(`${baseURL}/api/time-entries`);
        if (verifyResponse.ok) {
          const updatedEntries = await verifyResponse.json();
          console.log(`✓ 作成後の時間入力数: ${updatedEntries.length}件`);
        }
      } else {
        const errorData = await createResponse.json();
        console.log('✗ 時間入力作成失敗:', createResponse.status, errorData);
      }
    } else {
      console.log('✗ テストデータが不足しています');
      console.log(`  ユーザー: ${testUserId ? 'あり' : 'なし'}`);
      console.log(`  プロジェクト: ${testProject ? 'あり' : 'なし'}`);
      console.log(`  工程: ${testPhase ? 'あり' : 'なし'}`);
      console.log(`  タスク: ${testTask ? 'あり' : 'なし'}`);
    }
    
  } catch (error) {
    console.error('APIテストエラー:', error.message);
  }
}

testAPI();
