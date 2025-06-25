'use client';

import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useApp } from '../../contexts/AppContext';
import { Project } from '../../types';

export default function ProjectsPage() {
  const { state, dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active' as Project['status'],
    managerId: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'active',
      managerId: ''
    });
    setEditingProject(null);
    setShowCreateForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      name: formData.name,
      description: formData.description,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      status: formData.status,
      managerId: formData.managerId || state.currentUser?.id || ''
    };

    if (editingProject) {
      const updatedProject: Project = {
        ...editingProject,
        ...projectData,
        updatedAt: new Date()
      };
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
    } else {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
    }

    resetForm();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
      status: project.status,
      managerId: project.managerId
    });
    setShowCreateForm(true);
  };

  const handleDelete = (projectId: string) => {
    if (confirm('このプロジェクトを削除しますか？関連する工程、作業、工数データもすべて削除されます。')) {
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
    }
  };

  const managers = state.users.filter(user => user.role === 'admin' || user.role === 'manager');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">プロジェクト</h1>
            <p className="mt-2 text-sm text-gray-500">
              プロジェクトの作成、編集、管理を行います
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            新規プロジェクト
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingProject ? 'プロジェクト編集' : '新規プロジェクト作成'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    プロジェクト名 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
                    プロジェクトマネージャー
                  </label>
                  <select
                    id="managerId"
                    value={formData.managerId}
                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択してください</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    開始日 *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    終了日（予定）
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    ステータス
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Project['status']})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">進行中</option>
                    <option value="on-hold">保留</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProject ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {state.projects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">プロジェクトがありません</p>
              ) : (
                state.projects.map((project) => {
                  const manager = state.users.find(u => u.id === project.managerId);
                  const phases = state.phases.filter(p => p.projectId === project.id);
                  const timeEntries = state.timeEntries.filter(e => e.projectId === project.id);
                  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

                  return (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.status === 'active' ? 'bg-green-100 text-green-800' :
                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status === 'active' ? '進行中' :
                             project.status === 'completed' ? '完了' : '保留'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/projects/${project.id}/phases`}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            工程管理
                          </Link>
                          <button
                            onClick={() => handleEdit(project)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{project.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">マネージャー:</span>
                          <p className="font-medium">{manager?.name || '未設定'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">開始日:</span>
                          <p className="font-medium">{project.startDate.toLocaleDateString('ja-JP')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">工程数:</span>
                          <p className="font-medium">{phases.length}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">総工数:</span>
                          <p className="font-medium">{totalHours.toFixed(1)}h</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}