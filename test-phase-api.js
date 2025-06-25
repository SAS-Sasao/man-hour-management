async function testPhaseAPI() {
  console.log('=== フェーズAPI テスト ===');
  
  try {
    // 年間スキル報告書のプロジェクトIDを使用
    const projectId = 'cmcbsjxfe00i4m1n1lutulz69';
    
    console.log('\n1. フェーズ作成テスト...');
    const createResponse = await fetch('http://localhost:3002/api/phases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: projectId,
        name: 'テストフェーズ',
        description: 'APIテスト用のフェーズ'
      }),
    });
    
    console.log('ステータス:', createResponse.status);
    const createResult = await createResponse.json();
    console.log('レスポンス:', createResult);
    
    if (createResponse.ok) {
      console.log('✅ フェーズ作成成功');
      
      // 作成されたフェーズでタスクを作成
      console.log('\n2. タスク作成テスト...');
      const taskResponse = await fetch('http://localhost:3002/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phaseId: createResult.id,
          projectId: projectId,
          name: 'テストタスク',
          description: 'APIテスト用のタスク',
          estimatedHours: 2.5
        }),
      });
      
      console.log('タスク作成ステータス:', taskResponse.status);
      const taskResult = await taskResponse.json();
      console.log('タスクレスポンス:', taskResult);
      
      if (taskResponse.ok) {
        console.log('✅ タスク作成成功');
      } else {
        console.log('❌ タスク作成失敗');
      }
    } else {
      console.log('❌ フェーズ作成失敗');
    }
    
    console.log('\n3. 現在のフェーズ一覧取得...');
    const getResponse = await fetch('http://localhost:3002/api/phases');
    const phases = await getResponse.json();
    console.log('フェーズ一覧:', phases);
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

testPhaseAPI();
