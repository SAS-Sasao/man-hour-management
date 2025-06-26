const fetch = require('node-fetch');

async function testProjectCreate() {
  console.log('=== プロジェクト作成テスト ===');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. まず既存のユーザーを取得
    console.log('\n1. ユーザー取得:');
    const usersResponse = await fetch(`${baseURL}/api/users`);
    if (!usersResponse.ok) {
      console.log('✗ ユーザー取得失敗:', usersResponse.status);
      return;
    }
    
    const users = await usersResponse.json();
    console.log(`✓ ユーザー取得成功: ${users.length}件`);
    
    const adminUser = users.find(user => user.role === 'ADMIN');
    if (!adminUser) {
      console.log('✗ 管理者ユーザーが見つかりません');
      return;
    }
    
    console.log(`管理者ユーザー: ${adminUser.name} (${adminUser.id})`);
    
    // 2. プロジェクト作成テスト
    console.log('\n2. プロジェクト作成テスト:');
    
    const testProject = {
      name: 'テストプロジェクト_' + Date.now(),
      description: 'APIテスト用のプロジェクト',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'ACTIVE',
      managerId: adminUser.id
    };
    
    console.log('作成するプロジェクト:', testProject);
    
    const createResponse = await fetch(`${baseURL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProject)
    });
    
    console.log('レスポンスステータス:', createResponse.status);
    
    const responseData = await createResponse.json();
    console.log('レスポンスデータ:', JSON.stringify(responseData, null, 2));
    
    if (createResponse.ok) {
      console.log('✓ プロジェクト作成成功');
      
      // 3. 作成されたプロジェクトを確認
      console.log('\n3. プロジェクト一覧確認:');
      const projectsResponse = await fetch(`${baseURL}/api/projects`);
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        console.log(`✓ プロジェクト取得成功: ${projects.length}件`);
        const createdProject = projects.find(p => p.name === testProject.name);
        if (createdProject) {
          console.log('✓ 作成したプロジェクトが確認できました:', createdProject.name);
        } else {
          console.log('✗ 作成したプロジェクトが見つかりません');
        }
      } else {
        console.log('✗ プロジェクト一覧取得失敗:', projectsResponse.status);
      }
    } else {
      console.log('✗ プロジェクト作成失敗');
    }
    
  } catch (error) {
    console.error('テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  }
}

testProjectCreate();
