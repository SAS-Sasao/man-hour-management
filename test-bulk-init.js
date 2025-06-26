const fetch = require('node-fetch');

async function testBulkInit() {
  try {
    console.log('一括登録APIのテストを開始します...');
    
    // まず既存のプロジェクトを確認
    const projectsResponse = await fetch('http://localhost:3000/api/projects');
    const projects = await projectsResponse.json();
    console.log('既存プロジェクト:', projects);
    
    if (projects.length === 0) {
      console.log('プロジェクトが存在しません。まずプロジェクトを作成してください。');
      return;
    }
    
    const projectId = projects[0].id;
    console.log(`プロジェクトID: ${projectId} で一括登録をテストします`);
    
    // 既存の工程・作業を確認
    const phasesResponse = await fetch('http://localhost:3000/api/phases');
    const phases = await phasesResponse.json();
    const projectPhases = phases.filter(p => p.projectId === projectId);
    
    const tasksResponse = await fetch('http://localhost:3000/api/tasks');
    const tasks = await tasksResponse.json();
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    console.log(`既存工程数: ${projectPhases.length}`);
    console.log(`既存作業数: ${projectTasks.length}`);
    
    if (projectPhases.length > 0 || projectTasks.length > 0) {
      console.log('既に工程・作業が存在するため、一括登録はスキップされます。');
      return;
    }
    
    // 一括登録を実行
    console.log('一括登録を実行中...');
    const response = await fetch(`http://localhost:3000/api/projects/${projectId}/init-default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('レスポンス:', result);
    
    if (response.ok) {
      console.log('✅ 一括登録が成功しました');
      
      // 登録後のデータを確認
      const newPhasesResponse = await fetch('http://localhost:3000/api/phases');
      const newPhases = await newPhasesResponse.json();
      const newProjectPhases = newPhases.filter(p => p.projectId === projectId);
      
      const newTasksResponse = await fetch('http://localhost:3000/api/tasks');
      const newTasks = await newTasksResponse.json();
      const newProjectTasks = newTasks.filter(t => t.projectId === projectId);
      
      console.log(`登録後工程数: ${newProjectPhases.length}`);
      console.log(`登録後作業数: ${newProjectTasks.length}`);
      
      console.log('\n登録された工程:');
      newProjectPhases.forEach(phase => {
        console.log(`- ${phase.name}: ${phase.description}`);
      });
      
      console.log('\n登録された作業（最初の10件）:');
      newProjectTasks.slice(0, 10).forEach(task => {
        const phase = newProjectPhases.find(p => p.id === task.phaseId);
        console.log(`- ${task.name} (${phase?.name}): ${task.description}`);
      });
      
    } else {
      console.log('❌ 一括登録が失敗しました');
      console.log('エラー:', result);
    }
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

testBulkInit();
