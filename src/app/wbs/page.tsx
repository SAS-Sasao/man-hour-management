'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import WBSGanttTable from '@/components/WBSGanttTable';
import WBSCalendar from '@/components/WBSCalendar';
import WBSDashboard from '@/components/WBSDashboard';
import BulkWBSModal from '@/components/BulkWBSModal';
import { CalendarTask, Project, User, Phase } from '@/types';

const WBSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gantt' | 'dashboard'>('gantt');
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showBulkWBSModal, setShowBulkWBSModal] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  // プロジェクトとユーザーデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // プロジェクト一覧を取得
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }

        // ユーザー一覧を取得
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }

        // フェーズ一覧を取得
        const phasesResponse = await fetch('/api/phases');
        if (phasesResponse.ok) {
          const phasesData = await phasesResponse.json();
          setPhases(phasesData);
        }

        // タスク一覧を取得
        const tasksResponse = await fetch('/api/tasks');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // タスククリック時の処理
  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // タスク詳細モーダル
  const TaskDetailModal: React.FC = () => {
    if (!selectedTask) return null;

    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
        case 'REVIEW_PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'REVIEWED': return 'bg-green-100 text-green-800';
        case 'COMPLETED': return 'bg-green-500 text-white';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusLabel = (status: string): string => {
      switch (status) {
        case 'NOT_STARTED': return '未対応';
        case 'IN_PROGRESS': return '対応中';
        case 'REVIEW_PENDING': return 'レビュー待ち';
        case 'REVIEWED': return 'レビュー済';
        case 'COMPLETED': return '完了';
        default: return '不明';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">タスク詳細</h3>
            <button
              onClick={() => setShowTaskModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
              <p className="text-lg font-semibold">{selectedTask.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プロジェクト</label>
                <p className="text-gray-900">{selectedTask.projectName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">フェーズ</label>
                <p className="text-gray-900">{selectedTask.phaseName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <p className="text-gray-900">{selectedTask.assigneeName || '未割当'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTask.status)}`}>
                  {getStatusLabel(selectedTask.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予定開始日</label>
                <p className="text-gray-900">
                  {selectedTask.plannedStartDate 
                    ? new Date(selectedTask.plannedStartDate).toLocaleDateString('ja-JP')
                    : '未設定'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予定終了日</label>
                <p className="text-gray-900">
                  {selectedTask.plannedEndDate 
                    ? new Date(selectedTask.plannedEndDate).toLocaleDateString('ja-JP')
                    : '未設定'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">実際の開始日</label>
                <p className="text-gray-900">
                  {selectedTask.actualStartDate 
                    ? new Date(selectedTask.actualStartDate).toLocaleDateString('ja-JP')
                    : '未開始'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">実際の終了日</label>
                <p className="text-gray-900">
                  {selectedTask.actualEndDate 
                    ? new Date(selectedTask.actualEndDate).toLocaleDateString('ja-JP')
                    : '未完了'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予定工数</label>
                <p className="text-gray-900">{selectedTask.estimatedHours}時間</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">実績工数</label>
                <p className="text-gray-900">{selectedTask.actualHours}時間</p>
              </div>
            </div>

            {/* 進捗バー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工数進捗</label>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${selectedTask.estimatedHours > 0 
                      ? Math.min((selectedTask.actualHours / selectedTask.estimatedHours) * 100, 100)
                      : 0
                    }%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTask.estimatedHours > 0 
                  ? `${Math.round((selectedTask.actualHours / selectedTask.estimatedHours) * 100)}%`
                  : '0%'
                } 完了
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowTaskModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">WBS管理</h1>
          
          <div className="flex items-center space-x-4">
            {/* フィルター */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全プロジェクト</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全担当者</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {/* 作業追加ボタン */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>既存作業追加</span>
              </button>
              <button
                onClick={() => setShowBulkWBSModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>新規作業作成</span>
              </button>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('gantt')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gantt'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ガントチャート
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ダッシュボード
            </button>
          </nav>
        </div>

        {/* コンテンツ */}
        <div className="min-h-[600px]">
          {activeTab === 'gantt' && (
            <WBSGanttTable
              projectId={selectedProject || undefined}
              assigneeId={selectedAssignee || undefined}
            />
          )}
          
          {activeTab === 'dashboard' && (
            <WBSDashboard
              projectId={selectedProject || undefined}
            />
          )}
        </div>

        {/* タスク詳細モーダル */}
        {showTaskModal && <TaskDetailModal />}

        {/* 作業追加モーダル */}
        {showAddTaskModal && (
          <WBSTaskAddModal
            projects={projects}
            phases={phases}
            tasks={tasks}
            users={users}
            onClose={() => setShowAddTaskModal(false)}
            onSuccess={() => {
              setShowAddTaskModal(false);
              // データを再取得
              window.location.reload();
            }}
          />
        )}

        {/* 新規作業作成モーダル */}
        {showNewTaskModal && (
          <NewTaskCreateModal
            projects={projects}
            phases={phases}
            users={users}
            onClose={() => setShowNewTaskModal(false)}
            onSuccess={() => {
              setShowNewTaskModal(false);
              // データを再取得
              window.location.reload();
            }}
          />
        )}

        {/* バルクWBS作業作成モーダル */}
        {showBulkWBSModal && (
          <BulkWBSModal
            isOpen={showBulkWBSModal}
            onClose={() => setShowBulkWBSModal(false)}
            onSave={async (entries) => {
              try {
                const response = await fetch('/api/wbs', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ entries }),
                });

                if (response.ok) {
                  alert('WBS作業を一括登録しました');
                  // データを再取得
                  window.location.reload();
                } else {
                  const error = await response.text();
                  throw new Error(error);
                }
              } catch (error) {
                console.error('WBS作業登録エラー:', error);
                throw error;
              }
            }}
            projectId={selectedProject || undefined}
          />
        )}
      </div>
    </Layout>
  );
};

// 作業追加モーダルコンポーネント
interface WBSTaskAddModalProps {
  projects: Project[];
  phases: Phase[];
  tasks: any[];
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}

const WBSTaskAddModal: React.FC<WBSTaskAddModalProps> = ({
  projects,
  phases,
  tasks,
  users,
  onClose,
  onSuccess
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [plannedEndDate, setPlannedEndDate] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [status, setStatus] = useState<string>('NOT_STARTED');
  const [loading, setLoading] = useState(false);

  // 選択されたプロジェクトに関連するフェーズをフィルタリング
  const filteredPhases = phases.filter(phase => 
    !selectedProject || phase.projectId === selectedProject
  );

  // 選択されたプロジェクトに関連するタスクをフィルタリング
  const filteredTasks = tasks.filter(task => 
    !selectedProject || task.projectId === selectedProject
  );

  // タスク選択の切り替え
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // 全選択/全解除
  const toggleAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
  };

  // WBS作業を登録
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTasks.length === 0) {
      alert('作業を選択してください');
      return;
    }

    setLoading(true);
    
    try {
      const wbsEntries = selectedTasks.map(taskId => {
        const task = tasks.find(t => t.id === taskId);
        return {
          name: task?.name || '作業名未設定',
          description: task?.description || null,
          taskId,
          projectId: selectedProject,
          assigneeId: assigneeId || null,
          plannedStartDate: plannedStartDate || null,
          plannedEndDate: plannedEndDate || null,
          estimatedHours: estimatedHours || task?.estimatedHours || 0,
          status,
          actualStartDate: null,
          actualEndDate: null,
          actualHours: 0
        };
      });

      const response = await fetch('/api/wbs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: wbsEntries }),
      });

      if (response.ok) {
        alert('WBS作業を登録しました');
        onSuccess();
      } else {
        const error = await response.text();
        alert(`登録に失敗しました: ${error}`);
      }
    } catch (error) {
      console.error('WBS作業登録エラー:', error);
      alert('登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">WBS作業追加</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* プロジェクト選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト選択
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedTasks([]); // プロジェクト変更時にタスク選択をリセット
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">プロジェクトを選択してください</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* タスク選択 */}
          {selectedProject && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  作業選択 ({selectedTasks.length}/{filteredTasks.length}件選択)
                </label>
                <button
                  type="button"
                  onClick={toggleAllTasks}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedTasks.length === filteredTasks.length ? '全解除' : '全選択'}
                </button>
              </div>
              <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    選択されたプロジェクトに作業がありません
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredTasks.map(task => {
                      const phase = phases.find(p => p.id === task.phaseId);
                      return (
                        <label
                          key={task.id}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{task.name}</div>
                            <div className="text-sm text-gray-500">
                              {phase?.name} • 予定工数: {task.estimatedHours}h
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 共通設定 */}
          {selectedTasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  担当者
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">担当者を選択（任意）</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NOT_STARTED">未対応</option>
                  <option value="IN_PROGRESS">対応中</option>
                  <option value="REVIEW_PENDING">レビュー待ち</option>
                  <option value="REVIEWED">レビュー済</option>
                  <option value="COMPLETED">完了</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予定開始日
                </label>
                <input
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予定終了日
                </label>
                <input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予定工数（時間）※空欄の場合は各作業のデフォルト値を使用
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours || ''}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="全作業に共通の予定工数を設定（任意）"
                />
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || selectedTasks.length === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登録中...' : `${selectedTasks.length}件の作業を登録`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 新規作業作成モーダルコンポーネント
interface NewTaskCreateModalProps {
  projects: Project[];
  phases: Phase[];
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}

const NewTaskCreateModal: React.FC<NewTaskCreateModalProps> = ({
  projects,
  phases,
  users,
  onClose,
  onSuccess
}) => {
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [plannedEndDate, setPlannedEndDate] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [status, setStatus] = useState<string>('NOT_STARTED');
  const [loading, setLoading] = useState(false);

  // 選択されたプロジェクトに関連するフェーズをフィルタリング
  const filteredPhases = phases.filter(phase => 
    !selectedProject || phase.projectId === selectedProject
  );

  // 新規作業とWBSエントリを作成
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskName.trim()) {
      alert('作業名を入力してください');
      return;
    }

    if (!selectedProject) {
      alert('プロジェクトを選択してください');
      return;
    }

    if (!selectedPhase) {
      alert('フェーズを選択してください');
      return;
    }

    setLoading(true);
    
    try {
      // 1. 新規タスクを作成
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: taskName.trim(),
          description: taskDescription.trim() || null,
          projectId: selectedProject,
          phaseId: selectedPhase,
          estimatedHours: estimatedHours || 0,
          status: 'NOT_STARTED'
        }),
      });

      if (!taskResponse.ok) {
        const error = await taskResponse.text();
        throw new Error(`タスク作成に失敗しました: ${error}`);
      }

      const newTask = await taskResponse.json();

      // 2. WBSエントリを作成
      const wbsResponse = await fetch('/api/wbs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: [{
            name: taskName.trim(),
            description: taskDescription.trim() || null,
            taskId: newTask.id,
            projectId: selectedProject,
            assigneeId: assigneeId || null,
            plannedStartDate: plannedStartDate || null,
            plannedEndDate: plannedEndDate || null,
            estimatedHours: estimatedHours || 0,
            status,
            actualStartDate: null,
            actualEndDate: null,
            actualHours: 0
          }]
        }),
      });

      if (!wbsResponse.ok) {
        const error = await wbsResponse.text();
        throw new Error(`WBS作業登録に失敗しました: ${error}`);
      }

      alert('新規作業を作成し、WBSに登録しました');
      onSuccess();
    } catch (error) {
      console.error('新規作業作成エラー:', error);
      alert(error instanceof Error ? error.message : '作成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">新規作業作成</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 作業名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="作業名を入力してください"
              required
            />
          </div>

          {/* 作業説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業説明
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="作業の詳細説明を入力してください（任意）"
            />
          </div>

          {/* プロジェクト選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedPhase(''); // プロジェクト変更時にフェーズ選択をリセット
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">プロジェクトを選択してください</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* フェーズ選択 */}
          {selectedProject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フェーズ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">フェーズを選択してください</option>
                {filteredPhases.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* WBS設定 */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">WBS設定</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  担当者
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">担当者を選択（任意）</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NOT_STARTED">未対応</option>
                  <option value="IN_PROGRESS">対応中</option>
                  <option value="REVIEW_PENDING">レビュー待ち</option>
                  <option value="REVIEWED">レビュー済</option>
                  <option value="COMPLETED">完了</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予定開始日
                </label>
                <input
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予定終了日
                </label>
                <input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予定工数（時間）
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours || ''}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="予定工数を入力してください"
                />
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !taskName.trim() || !selectedProject || !selectedPhase}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '作成中...' : '作業を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WBSPage;
