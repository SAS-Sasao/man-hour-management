'use client';

import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import BulkProjectModal from '../../components/BulkProjectModal';
import { useApp } from '../../contexts/AppContext';
import { Project } from '../../types';

export default function ProjectsPage() {
  const { state, dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Project['status']>('ALL');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as Project['status'],
    managerId: '',
    managerIds: [] as string[],
    memberIds: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
      managerId: '',
      managerIds: [],
      memberIds: []
    });
    setEditingProject(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      status: formData.status,
      managerId: formData.managerId || state.currentUser?.id || '',
      managerIds: formData.managerIds,
      memberIds: formData.memberIds,
      currentUserId: state.currentUser?.id
    };

    try {
      if (editingProject) {
        // プロジェクト更新（APIエンドポイントが必要）
        const response = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (response.ok) {
          const updatedProject = await response.json();
          const project: Project = {
            ...updatedProject,
            startDate: new Date(updatedProject.startDate),
            endDate: updatedProject.endDate ? new Date(updatedProject.endDate) : undefined,
            createdAt: new Date(updatedProject.createdAt),
            updatedAt: new Date(updatedProject.updatedAt),
          };
          dispatch({ type: 'UPDATE_PROJECT', payload: project });
        } else {
          const errorData = await response.json();
          alert(`プロジェクトの更新に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      } else {
        // プロジェクト新規作成
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (response.ok) {
          const responseData = await response.json();
          const newProject = responseData.data || responseData; // APIレスポンス形式に対応
          const project: Project = {
            ...newProject,
            startDate: new Date(newProject.startDate),
            endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
            createdAt: new Date(newProject.createdAt),
            updatedAt: new Date(newProject.updatedAt),
          };
          dispatch({ type: 'ADD_PROJECT', payload: project });
        } else {
          const errorData = await response.json();
          alert(`プロジェクトの作成に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      }

      resetForm();
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      alert('プロジェクトの保存に失敗しました');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    
    // 現在のマネージャーとメンバーのIDを取得
    const currentManagerIds = project.managers?.map(m => m.userId) || [];
    const currentMemberIds = project.members?.map(m => m.userId) || [];
    
    console.log('編集対象プロジェクト:', project);
    console.log('現在のマネージャーIDs:', currentManagerIds);
    console.log('現在のメンバーIDs:', currentMemberIds);
    
    setFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
      status: project.status,
      managerId: project.managerId || '',
      managerIds: currentManagerIds,
      memberIds: currentMemberIds
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('このプロジェクトを削除しますか？関連する工程、作業、工数データもすべて削除されます。')) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // APIで削除が成功した場合のみローカルステートを更新
          dispatch({ type: 'DELETE_PROJECT', payload: projectId });
          
          const relatedPhases = state.phases.filter(phase => phase.projectId === projectId);
          relatedPhases.forEach(phase => {
            dispatch({ type: 'DELETE_PHASE', payload: phase.id });
          });
          
          const relatedTasks = state.tasks.filter(task => task.projectId === projectId);
          relatedTasks.forEach(task => {
            dispatch({ type: 'DELETE_TASK', payload: task.id });
          });
          
          const relatedTimeEntries = state.timeEntries.filter(entry => entry.projectId === projectId);
          relatedTimeEntries.forEach(entry => {
            dispatch({ type: 'DELETE_TIME_ENTRY', payload: entry.id });
          });

          alert('プロジェクトが正常に削除されました');
        } else {
          const errorData = await response.json();
          alert(`プロジェクトの削除に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      } catch (error) {
        console.error('プロジェクト削除エラー:', error);
        alert('プロジェクトの削除に失敗しました');
      }
    }
  };

  const managers = state.users.filter(user => user.role === 'ADMIN' || user.role === 'MANAGER');

  // フィルタリング（メンバー権限の場合は自分が所属するプロジェクトのみ）
  const filteredProjects = state.projects.filter(project => {
    // メンバー権限の場合、自分が所属するプロジェクトのみ表示
    if (state.currentUser?.role === 'MEMBER') {
      if (!state.currentUser) return false;
      
      const currentUserId = state.currentUser.id;
      const isManager = project.managerId === currentUserId;
      const isInManagers = project.managers?.some(m => m.userId === currentUserId);
      const isInMembers = project.members?.some(m => m.userId === currentUserId);
      
      if (!isManager && !isInManagers && !isInMembers) {
        return false;
      }
    }

    const projectName = project.name || '';
    const projectDescription = project.description || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = projectName.toLowerCase().includes(searchTermLower) ||
                         projectDescription.toLowerCase().includes(searchTermLower);
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 統計情報
  const stats = {
    total: state.projects.length,
    active: state.projects.filter(p => p.status === 'ACTIVE').length,
    completed: state.projects.filter(p => p.status === 'COMPLETED').length,
    onHold: state.projects.filter(p => p.status === 'ON_HOLD').length,
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* ヘッダーセクション */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10 rounded-3xl"></div>
          <div className="relative glass-heavy rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text">プロジェクト管理</h1>
                    <p className="text-gray-600 mt-1">プロジェクトの作成、編集、管理を効率的に行います</p>
                  </div>
                </div>
              </div>
              {/* メンバー権限では新規プロジェクトと一括登録ボタンを非表示 */}
              {state.currentUser?.role !== 'MEMBER' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary hover-lift flex items-center space-x-2 px-6 py-3 text-lg"
                  >
                    <span className="text-xl">✨</span>
                    <span>新規プロジェクト</span>
                  </button>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="btn-secondary hover-lift flex items-center space-x-2 px-6 py-3 text-lg"
                  >
                    <span className="text-xl">📋</span>
                    <span>一括登録</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="card hover-lift animate-slideIn">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総プロジェクト</p>
                  <p className="text-3xl font-bold gradient-text">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.1s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">進行中</p>
                  <p className="text-3xl font-bold gradient-text-success">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.2s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">完了</p>
                  <p className="text-3xl font-bold gradient-text-secondary">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.3s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">保留中</p>
                  <p className="text-3xl font-bold text-orange-500">{stats.onHold}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⏸️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="card animate-scaleIn">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="プロジェクト名や説明で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-12 w-full"
                  />
                </div>
              </div>
              <div className="lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="form-select w-full"
                >
                  <option value="ALL">すべてのステータス</option>
                  <option value="ACTIVE">進行中</option>
                  <option value="COMPLETED">完了</option>
                  <option value="ON_HOLD">保留</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* プロジェクト作成・編集フォーム */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold gradient-text flex items-center space-x-3">
                    <span className="text-3xl">{editingProject ? '✏️' : '✨'}</span>
                    <span>{editingProject ? 'プロジェクト編集' : '新規プロジェクト作成'}</span>
                  </h2>
                  <button
                    onClick={resetForm}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="form-label flex items-center space-x-2">
                        <span className="text-lg">📝</span>
                        <span>プロジェクト名 *</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input"
                        placeholder="プロジェクト名を入力..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">👥</span>
                        <span>プロジェクトマネージャー（複数選択可）</span>
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {managers.map(manager => (
                          <label key={manager.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.managerIds.includes(manager.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    managerIds: [...formData.managerIds, manager.id],
                                    managerId: formData.managerId || manager.id // 後方互換性のため
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    managerIds: formData.managerIds.filter(id => id !== manager.id)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{manager.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="startDate" className="form-label flex items-center space-x-2">
                        <span className="text-lg">📅</span>
                        <span>開始日 *</span>
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="endDate" className="form-label flex items-center space-x-2">
                        <span className="text-lg">🏁</span>
                        <span>終了日（予定）</span>
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="status" className="form-label flex items-center space-x-2">
                        <span className="text-lg">🏷️</span>
                        <span>ステータス</span>
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as Project['status']})}
                        className="form-select"
                      >
                        <option value="ACTIVE">🚀 進行中</option>
                        <option value="ON_HOLD">⏸️ 保留</option>
                        <option value="COMPLETED">✅ 完了</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="form-label flex items-center space-x-2">
                      <span className="text-lg">👥</span>
                      <span>プロジェクトメンバー（複数選択可）</span>
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {state.users.map(user => (
                        <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.memberIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  memberIds: [...formData.memberIds, user.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  memberIds: formData.memberIds.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{user.name} ({user.role})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="form-label flex items-center space-x-2">
                      <span className="text-lg">📄</span>
                      <span>説明</span>
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="form-textarea"
                      placeholder="プロジェクトの詳細説明を入力..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-8 py-3 text-lg"
                    >
                      {editingProject ? '更新する' : '作成する'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 一括登録モーダル */}
        <BulkProjectModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            // 成功時の処理（必要に応じてデータを再取得）
            console.log('一括登録が完了しました');
          }}
        />

        {/* プロジェクト一覧 */}
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="card text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || statusFilter !== 'ALL' ? '該当するプロジェクトがありません' : 'プロジェクトがありません'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'ALL' ? '検索条件を変更してみてください' : '新しいプロジェクトを作成して始めましょう'}
              </p>
              {!searchTerm && statusFilter === 'ALL' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  最初のプロジェクトを作成
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => {
                const manager = state.users.find(u => u.id === project.managerId);
                const phases = state.phases.filter(p => p.projectId === project.id);
                const timeEntries = state.timeEntries.filter(e => e.projectId === project.id);
                const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
                
                // 進捗計算
                const now = new Date();
                const progressPercentage = project.endDate 
                  ? Math.min(100, Math.max(0, ((now.getTime() - project.startDate.getTime()) / 
                            (project.endDate.getTime() - project.startDate.getTime())) * 100))
                  : 0;

                // メンバー権限の場合、編集・削除権限をチェック
                const canEdit = state.currentUser?.role !== 'MEMBER' || 
                  (state.currentUser && state.currentUser.id ? (
                    project.managerId === state.currentUser.id ||
                    project.managers?.some(m => m.userId === state.currentUser!.id)
                  ) : false);

                return (
                  <div 
                    key={project.id} 
                    className="card hover-lift animate-fadeIn"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="card-body space-y-4">
                      {/* プロジェクトヘッダー */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                            {project.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`status-badge ${
                              project.status === 'ACTIVE' ? 'status-active' :
                              project.status === 'COMPLETED' ? 'status-completed' :
                              'status-on-hold'
                            }`}>
                              {project.status === 'ACTIVE' ? '🚀 進行中' :
                               project.status === 'COMPLETED' ? '✅ 完了' : '⏸️ 保留'}
                            </span>
                          </div>
                        </div>
                        {/* 編集・削除ボタンは権限がある場合のみ表示 */}
                        {canEdit && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(project)}
                              className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                              title="編集"
                            >
                              <span className="text-sm">✏️</span>
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                              title="削除"
                            >
                              <span className="text-sm">🗑️</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* プロジェクト説明 */}
                      {project.description && (
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {project.description}
                        </p>
                      )}

                      {/* 進捗バー */}
                      {project.endDate && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">進捗</span>
                            <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* プロジェクト詳細 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>👤</span>
                            <span>マネージャー</span>
                          </p>
                          <p className="font-medium truncate">{manager?.name || '未設定'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>📅</span>
                            <span>開始日</span>
                          </p>
                          <p className="font-medium">{project.startDate.toLocaleDateString('ja-JP')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>🔧</span>
                            <span>工程数</span>
                          </p>
                          <p className="font-medium">{phases.length}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>⏰</span>
                            <span>総工数</span>
                          </p>
                          <p className="font-medium">{totalHours.toFixed(1)}h</p>
                        </div>
                      </div>

                      {/* アクションボタン - メンバー権限では工程管理ボタンを非表示 */}
                      {canEdit && (
                        <div className="pt-4 border-t border-gray-100">
                          <Link
                            href={`/projects/${project.id}/phases`}
                            className="btn-success w-full flex items-center justify-center space-x-2"
                          >
                            <span className="text-lg">🔧</span>
                            <span>工程管理</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
