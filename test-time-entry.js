async function testTimeEntry() {
  console.log('=== 工数入力API テスト ===');
  
  try {
    // テストで作成されたフェーズとタスクのIDを使用
    const userId = 'cmcbrnfvi00c2m1n147bdwn0w'; // 笹尾 豊樹
    const projectId = 'cmcbsjxfe00i4m1n1lutulz69'; // 年間スキル報告書
    const phaseId = 'cmcbtn0wn00iam1n1s3q6t6vp'; // テストフェーズ
    const taskId = 'cmcbtn21v00icm1n1271red53'; // テストタスク
    
    console.log('\n工数入力テスト...');
    const response = await fetch('http://localhost:3002/api/time-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        projectId: projectId,
        phaseId: phaseId,
        taskId: taskId,
        date: new Date().toISOString(),
        hours: 1.5,
        description: 'APIテスト用の工数入力'
      }),
    });
    
    console.log('ステータス:', response.status);
    const result = await response.json();
    console.log('レスポンス:', result);
    
    if (response.ok) {
      console.log('✅ 工数入力成功！外部キー制約違反が解決されました！');
    } else {
      console.log('❌ 工数入力失敗:', result.error);
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

testTimeEntry();
