'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { Phase, Task, Project } from '../../../../types';

export default function ProjectPhasesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  
  const [phaseForm, setPhaseForm] = useState({
    name: '',
    description: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    estimatedHours: ''
  });

  // データ取得
  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // プロジェクト情報を取得
      const projectResponse = await fetch('/api/projects');
      if (!projectResponse.ok) {
        throw new Error('プロジェクトの取得に失敗しました');
      }
      const projectsData = await projectResponse.json();
      const currentProject = projectsData.find((p: Project) => p.id === projectId);
      
      if (!currentProject) {
        throw new Error('プロジェクトが見つかりません');
      }
      setProject(currentProject);

      // フェーズ情報を取得
      const phasesResponse = await fetch('/api/phases');
      if (!phasesResponse.ok) {
        throw new Error('フェーズの取得に失敗しました');
      }
      const phasesData = await phasesResponse.json();
      const projectPhases = phasesData
        .filter((p: Phase) => p.projectId === projectId)
        .sort((a: Phase, b: Phase) => a.order - b.order);
      setPhases(projectPhases);

      // タスク情報を取得
      const tasksResponse = await fetch('/api/tasks');
      if (!tasksResponse.ok) {
        throw new Error('タスクの取得に失敗しました');
      }
      const tasksData = await tasksResponse.json();
      const projectTasks = tasksData.filter((t: Task) => t.projectId === projectId);
      setTasks(projectTasks);

    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const resetPhaseForm = () => {
    setPhaseForm({ name: '', description: '' });
    setEditingPhase(null);
    setShowPhaseForm(false);
  };

  const resetTaskForm = () => {
    setTaskForm({ name: '', description: '', estimatedHours: '' });
    setEditingTask(null);
    setShowTaskForm(false);
    setSelectedPhaseId('');
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPhase) {
        // フェーズ更新
        const response = await fetch(`/api/phases/${editingPhase.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: phaseForm.name,
            description: phaseForm.description,
          }),
        });

        if (response.ok) {
          const updatedPhase = await response.json();
          setPhases(prev => prev.map(phase => 
            phase.id === editingPhase.id 
              ? {
                  ...updatedPhase.data,
                  createdAt: new Date(updatedPhase.data.createdAt),
                  updatedAt: new Date(updatedPhase.data.updatedAt),
                }
              : phase
          ).sort((a, b) => a.order - b.order));
          alert('工程が更新されました');
        } else {
          const errorData = await response.json();
          alert(`工程の更新に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      } else {
        // フェーズ新規作成
        const response = await fetch('/api/phases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            name: phaseForm.name,
            description: phaseForm.description,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const newPhase = result.data || result; // 新しい形式と古い形式の両方に対応
          setPhases(prev => [...prev, {
            ...newPhase,
            createdAt: new Date(newPhase.createdAt),
            updatedAt: new Date(newPhase.updatedAt),
          }].sort((a, b) => a.order - b.order));
          if (result.message) {
            alert(result.message);
          }
        } else {
          const errorData = await response.json();
          alert(`フェーズの作成に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      }

      resetPhaseForm();
    } catch (error) {
      console.error('フェーズ保存エラー:', error);
      alert('フェーズの保存に失敗しました');
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const estimatedHours = parseFloat(taskForm.estimatedHours) || 0;
      
      if (editingTask) {
        // タスク更新
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phaseId: selectedPhaseId,
            projectId,
            name: taskForm.name,
            description: taskForm.description,
            estimatedHours: estimatedHours,
          }),
        });

        if (response.ok) {
          const updatedTask = await response.json();
          setTasks(prev => prev.map(task => 
            task.id === editingTask.id 
              ? {
                  ...updatedTask,
                  createdAt: new Date(updatedTask.createdAt),
                  updatedAt: new Date(updatedTask.updatedAt),
                }
              : task
          ));
        } else {
          const errorData = await response.json();
          alert(`タスクの更新に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      } else {
        // タスク新規作成
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phaseId: selectedPhaseId,
            projectId,
            name: taskForm.name,
            description: taskForm.description,
            estimatedHours: estimatedHours,
          }),
        });

        if (response.ok) {
          const newTask = await response.json();
          setTasks(prev => [...prev, {
            ...newTask,
            createdAt: new Date(newTask.createdAt),
            updatedAt: new Date(newTask.updatedAt),
          }]);
        } else {
          const errorData = await response.json();
          alert(`タスクの作成に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      }

      resetTaskForm();
    } catch (error) {
      console.error('タスク保存エラー:', error);
      alert('タスクの保存に失敗しました');
    }
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setPhaseForm({
      name: phase.name,
      description: phase.description
    });
    setShowPhaseForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedPhaseId(task.phaseId);
    setTaskForm({
      name: task.name,
      description: task.description,
      estimatedHours: task.estimatedHours.toString()
    });
    setShowTaskForm(true);
  };

  const handleDeletePhase = async (phaseId: string) => {
    const tasksInPhase = tasks.filter(t => t.phaseId === phaseId);
    
    let confirmMessage = 'この工程を削除しますか？';
    if (tasksInPhase.length > 0) {
      confirmMessage = `この工程には${tasksInPhase.length}個の作業が含まれています。工程と関連する全ての作業・工数入力データが削除されます。削除しますか？`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/phases/${phaseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // フェーズリストから削除
        setPhases(prev => prev.filter(phase => phase.id !== phaseId));
        // 関連するタスクも削除
        setTasks(prev => prev.filter(task => task.phaseId !== phaseId));
        alert('工程が削除されました');
      } else {
        const errorData = await response.json();
        alert(`工程の削除に失敗しました: ${errorData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('フェーズ削除エラー:', error);
      alert('フェーズの削除に失敗しました');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('この作業を削除しますか？関連する時間入力データも削除されます。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // タスクリストから削除
        setTasks(prev => prev.filter(task => task.id !== taskId));
        alert('タスクが削除されました');
      } else {
        const errorData = await response.json();
        alert(`タスクの削除に失敗しました: ${errorData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('タスク削除エラー:', error);
      alert('タスクの削除に失敗しました');
    }
  };


  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className="text-blue-600 hover:text-blue-800"
          >
            プロジェクト一覧に戻る
          </button>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">プロジェクトが見つかりません</h1>
          <button
            onClick={() => router.push('/projects')}
            className="text-blue-600 hover:text-blue-800"
          >
            プロジェクト一覧に戻る
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              ← プロジェクト一覧に戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-2 text-sm text-gray-500">工程・作業マスタ管理</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPhaseForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              工程追加
            </button>
            <button
              onClick={() => {
                if (phases.length === 0) {
                  alert('まず工程を追加してください');
                  return;
                }
                setSelectedPhaseId(phases[0].id);
                setShowTaskForm(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              作業追加
            </button>
          </div>
        </div>

        {showPhaseForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingPhase ? '工程編集' : '新規工程追加'}
            </h2>
            <form onSubmit={handlePhaseSubmit} className="space-y-4">
              <div>
                <label htmlFor="phaseName" className="block text-sm font-medium text-gray-700">
                  工程名 *
                </label>
                <input
                  type="text"
                  id="phaseName"
                  value={phaseForm.name}
                  onChange={(e) => setPhaseForm({...phaseForm, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="phaseDescription" className="block text-sm font-medium text-gray-700">
                  工程説明
                </label>
                <textarea
                  id="phaseDescription"
                  value={phaseForm.description}
                  onChange={(e) => setPhaseForm({...phaseForm, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetPhaseForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPhase ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showTaskForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingTask ? '作業編集' : '新規作業追加'}
            </h2>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label htmlFor="taskPhase" className="block text-sm font-medium text-gray-700">
                  所属工程 *
                </label>
                <select
                  id="taskPhase"
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">選択してください</option>
                  {phases.map(phase => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
                  作業名 *
                </label>
                <input
                  type="text"
                  id="taskName"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
                  見積工数（時間）
                </label>
                <input
                  type="number"
                  id="estimatedHours"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({...taskForm, estimatedHours: e.target.value})}
                  step="0.25"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
                  作業説明
                </label>
                <textarea
                  id="taskDescription"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetTaskForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {editingTask ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {phases.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500 mb-4">工程が登録されていません</p>
              <button
                onClick={() => setShowPhaseForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                最初の工程を追加
              </button>
            </div>
          ) : (
            phases.map((phase) => {
              const phaseTasks = tasks
                .filter(t => t.phaseId === phase.id)
                .sort((a, b) => a.order - b.order);
              
              const estimatedHours = phaseTasks.reduce((sum, task) => sum + task.estimatedHours, 0);

              return (
                <div key={phase.id} className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{phase.name}</h3>
                        {phase.description && (
                          <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                        )}
                        <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                          <span>作業数: {phaseTasks.length}</span>
                          <span>見積: {estimatedHours}h</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPhaseId(phase.id);
                            setShowTaskForm(true);
                          }}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          作業追加
                        </button>
                        <button
                          onClick={() => handleEditPhase(phase)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeletePhase(phase.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    {phaseTasks.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">作業が登録されていません</p>
                    ) : (
                      <div className="space-y-3">
                        {phaseTasks.map((task) => {
                          return (
                            <div key={task.id} className="border border-gray-200 rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{task.name}</h4>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                  )}
                                  <div className="flex space-x-4 mt-2 text-xs text-gray-600">
                                    <span>見積: {task.estimatedHours}h</span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    編集
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    削除
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
