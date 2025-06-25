'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { useApp } from '../../../../contexts/AppContext';
import { Phase, Task } from '../../../../types';
import { createDefaultPhasesAndTasks } from '../../../../utils/defaultData';

export default function ProjectPhasesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { state, dispatch } = useApp();
  
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

  const project = state.projects.find(p => p.id === projectId);
  const phases = state.phases
    .filter(p => p.projectId === projectId)
    .sort((a, b) => a.order - b.order);

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

  const handlePhaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPhase) {
      const updatedPhase: Phase = {
        ...editingPhase,
        name: phaseForm.name,
        description: phaseForm.description,
        updatedAt: new Date()
      };
      dispatch({ type: 'UPDATE_PHASE', payload: updatedPhase });
    } else {
      const newPhase: Phase = {
        id: `phase-${Date.now()}`,
        projectId,
        name: phaseForm.name,
        description: phaseForm.description,
        order: phases.length + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dispatch({ type: 'ADD_PHASE', payload: newPhase });
    }

    resetPhaseForm();
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const estimatedHours = parseFloat(taskForm.estimatedHours) || 0;
    const tasksInPhase = state.tasks.filter(t => t.phaseId === selectedPhaseId);
    
    if (editingTask) {
      const updatedTask: Task = {
        ...editingTask,
        name: taskForm.name,
        description: taskForm.description,
        estimatedHours,
        updatedAt: new Date()
      };
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        phaseId: selectedPhaseId,
        projectId,
        name: taskForm.name,
        description: taskForm.description,
        estimatedHours,
        order: tasksInPhase.length + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
    }

    resetTaskForm();
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

  const handleDeletePhase = (phaseId: string) => {
    const tasksInPhase = state.tasks.filter(t => t.phaseId === phaseId);
    const timeEntriesInPhase = state.timeEntries.filter(e => e.phaseId === phaseId);
    
    if (tasksInPhase.length > 0 || timeEntriesInPhase.length > 0) {
      if (!confirm('この工程には作業や工数データが含まれています。削除しますか？')) {
        return;
      }
    }
    
    dispatch({ type: 'DELETE_PHASE', payload: phaseId });
    tasksInPhase.forEach(task => {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
    });
    timeEntriesInPhase.forEach(entry => {
      dispatch({ type: 'DELETE_TIME_ENTRY', payload: entry.id });
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const timeEntriesInTask = state.timeEntries.filter(e => e.taskId === taskId);
    
    if (timeEntriesInTask.length > 0) {
      if (!confirm('この作業には工数データが含まれています。削除しますか？')) {
        return;
      }
    }
    
    dispatch({ type: 'DELETE_TASK', payload: taskId });
    timeEntriesInTask.forEach(entry => {
      dispatch({ type: 'DELETE_TIME_ENTRY', payload: entry.id });
    });
  };

  const handleCreateDefaultStructure = () => {
    if (phases.length > 0) {
      if (!confirm('既存の工程・作業があります。デフォルト構造を追加しますか？')) {
        return;
      }
    }

    const { phases: defaultPhases, tasks: defaultTasks } = createDefaultPhasesAndTasks(projectId);
    
    defaultPhases.forEach(phase => {
      dispatch({ type: 'ADD_PHASE', payload: phase });
    });
    
    defaultTasks.forEach(task => {
      dispatch({ type: 'ADD_TASK', payload: task });
    });

    alert('デフォルト工程・作業を追加しました！');
  };

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
              onClick={handleCreateDefaultStructure}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              デフォルト構造作成
            </button>
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
              const phaseTasks = state.tasks
                .filter(t => t.phaseId === phase.id)
                .sort((a, b) => a.order - b.order);
              
              const phaseTimeEntries = state.timeEntries.filter(e => e.phaseId === phase.id);
              const totalHours = phaseTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
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
                          <span>実績: {totalHours.toFixed(1)}h</span>
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
                          const taskTimeEntries = state.timeEntries.filter(e => e.taskId === task.id);
                          const taskHours = taskTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

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
                                    <span>実績: {taskHours.toFixed(1)}h</span>
                                    {task.estimatedHours > 0 && (
                                      <span className={`${
                                        taskHours > task.estimatedHours ? 'text-red-600' : 'text-green-600'
                                      }`}>
                                        進捗: {((taskHours / task.estimatedHours) * 100).toFixed(0)}%
                                      </span>
                                    )}
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