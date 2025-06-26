'use client';

import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project } from '../types';

interface ProjectTemplate {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: Project['status'];
  managerId: string;
}

interface BulkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    name: 'Webアプリケーション開発',
    description: 'React/Next.jsを使用したWebアプリケーションの開発プロジェクト',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3ヶ月後
    status: 'ACTIVE' as Project['status'],
    managerId: ''
  },
  {
    name: 'モバイルアプリ開発',
    description: 'React NativeまたはFlutterを使用したモバイルアプリケーションの開発',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4ヶ月後
    status: 'ACTIVE' as Project['status'],
    managerId: ''
  },
  {
    name: 'システム保守・運用',
    description: '既存システムの保守・運用・改善プロジェクト',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1年後
    status: 'ACTIVE' as Project['status'],
    managerId: ''
  },
  {
    name: 'データ分析基盤構築',
    description: 'ビッグデータ分析のための基盤システム構築プロジェクト',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6ヶ月後
    status: 'ACTIVE' as Project['status'],
    managerId: ''
  },
  {
    name: 'AI・機械学習システム',
    description: 'AI・機械学習を活用したシステムの開発プロジェクト',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5ヶ月後
    status: 'ACTIVE' as Project['status'],
    managerId: ''
  }
];

export default function BulkProjectModal({ isOpen, onClose, onSuccess }: BulkProjectModalProps) {
  const { state, dispatch } = useApp();
  const [projects, setProjects] = useState<ProjectTemplate[]>(
    DEFAULT_PROJECT_TEMPLATES.map(template => ({
      ...template,
      managerId: state.currentUser?.id || ''
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<boolean[]>(
    new Array(DEFAULT_PROJECT_TEMPLATES.length).fill(true)
  );

  const managers = state.users.filter(user => user.role === 'ADMIN' || user.role === 'MANAGER');

  const handleProjectChange = (index: number, field: keyof ProjectTemplate, value: string) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value
    };
    setProjects(updatedProjects);
  };

  const handleSelectProject = (index: number, selected: boolean) => {
    const updatedSelection = [...selectedProjects];
    updatedSelection[index] = selected;
    setSelectedProjects(updatedSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedProjects(new Array(projects.length).fill(selected));
  };

  const addNewProject = () => {
    const newProject: ProjectTemplate = {
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      managerId: state.currentUser?.id || ''
    };
    setProjects([...projects, newProject]);
    setSelectedProjects([...selectedProjects, true]);
  };

  const removeProject = (index: number) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    const updatedSelection = selectedProjects.filter((_, i) => i !== index);
    setProjects(updatedProjects);
    setSelectedProjects(updatedSelection);
  };

  const handleSubmit = async () => {
    const selectedProjectsData = projects.filter((_, index) => selectedProjects[index]);
    
    if (selectedProjectsData.length === 0) {
      alert('少なくとも1つのプロジェクトを選択してください');
      return;
    }

    // バリデーション
    for (let i = 0; i < selectedProjectsData.length; i++) {
      const project = selectedProjectsData[i];
      if (!project.name.trim()) {
        alert(`${i + 1}番目のプロジェクト名を入力してください`);
        return;
      }
      if (!project.startDate) {
        alert(`${i + 1}番目のプロジェクトの開始日を入力してください`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const createdProjects = [];

      for (const projectData of selectedProjectsData) {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectData.name,
            description: projectData.description,
            startDate: projectData.startDate,
            endDate: projectData.endDate || null,
            status: projectData.status,
            managerId: projectData.managerId || state.currentUser?.id || ''
          }),
        });

        if (response.ok) {
          const responseData = await response.json();
          const newProject = responseData.data || responseData;
          const project: Project = {
            ...newProject,
            startDate: new Date(newProject.startDate),
            endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
            createdAt: new Date(newProject.createdAt),
            updatedAt: new Date(newProject.updatedAt),
          };
          
          dispatch({ type: 'ADD_PROJECT', payload: project });
          createdProjects.push(project);

          // デフォルトの工程・タスクを作成
          try {
            await fetch(`/api/projects/${project.id}/init-default`, {
              method: 'POST',
            });
          } catch (error) {
            console.warn(`プロジェクト ${project.name} のデフォルト工程・タスク作成に失敗:`, error);
          }
        } else {
          const errorData = await response.json();
          throw new Error(`プロジェクト "${projectData.name}" の作成に失敗: ${errorData.error || '不明なエラー'}`);
        }
      }

      alert(`${createdProjects.length}個のプロジェクトが正常に作成されました`);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('一括プロジェクト作成エラー:', error);
      alert(error instanceof Error ? error.message : 'プロジェクトの一括作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setProjects(DEFAULT_PROJECT_TEMPLATES.map(template => ({
      ...template,
      managerId: state.currentUser?.id || ''
    })));
    setSelectedProjects(new Array(DEFAULT_PROJECT_TEMPLATES.length).fill(true));
  };

  if (!isOpen) return null;

  const selectedCount = selectedProjects.filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="card max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-text flex items-center space-x-3">
              <span className="text-3xl">📋</span>
              <span>プロジェクト一括登録</span>
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            複数のプロジェクトを一度に作成できます。内容は自由に編集可能です。
          </p>
        </div>

        <div className="card-body space-y-6">
          {/* 操作ボタン */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleSelectAll(true)}
                className="btn-secondary text-sm"
              >
                全選択
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                className="btn-secondary text-sm"
              >
                全解除
              </button>
              <button
                onClick={addNewProject}
                className="btn-success text-sm flex items-center space-x-1"
              >
                <span>➕</span>
                <span>プロジェクト追加</span>
              </button>
              <button
                onClick={resetToDefaults}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <span>🔄</span>
                <span>デフォルトに戻す</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              選択中: {selectedCount} / {projects.length} プロジェクト
            </div>
          </div>

          {/* プロジェクト一覧 */}
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div 
                key={index} 
                className={`border-2 rounded-xl p-4 transition-all ${
                  selectedProjects[index] 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* 選択チェックボックス */}
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={selectedProjects[index]}
                      onChange={(e) => handleSelectProject(index, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* プロジェクト情報 */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">
                        プロジェクト {index + 1}
                      </h3>
                      {projects.length > 1 && (
                        <button
                          onClick={() => removeProject(index)}
                          className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                          title="削除"
                        >
                          <span className="text-sm">🗑️</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="form-label flex items-center space-x-2">
                          <span className="text-lg">📝</span>
                          <span>プロジェクト名 *</span>
                        </label>
                        <input
                          type="text"
                          value={project.name}
                          onChange={(e) => handleProjectChange(index, 'name', e.target.value)}
                          className="form-input"
                          placeholder="プロジェクト名を入力..."
                          disabled={!selectedProjects[index]}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label flex items-center space-x-2">
                          <span className="text-lg">👤</span>
                          <span>マネージャー</span>
                        </label>
                        <select
                          value={project.managerId}
                          onChange={(e) => handleProjectChange(index, 'managerId', e.target.value)}
                          className="form-select"
                          disabled={!selectedProjects[index]}
                        >
                          <option value="">選択してください</option>
                          {managers.map(manager => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="form-label flex items-center space-x-2">
                          <span className="text-lg">📅</span>
                          <span>開始日 *</span>
                        </label>
                        <input
                          type="date"
                          value={project.startDate}
                          onChange={(e) => handleProjectChange(index, 'startDate', e.target.value)}
                          className="form-input"
                          disabled={!selectedProjects[index]}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label flex items-center space-x-2">
                          <span className="text-lg">🏁</span>
                          <span>終了日（予定）</span>
                        </label>
                        <input
                          type="date"
                          value={project.endDate}
                          onChange={(e) => handleProjectChange(index, 'endDate', e.target.value)}
                          className="form-input"
                          disabled={!selectedProjects[index]}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label flex items-center space-x-2">
                          <span className="text-lg">🏷️</span>
                          <span>ステータス</span>
                        </label>
                        <select
                          value={project.status}
                          onChange={(e) => handleProjectChange(index, 'status', e.target.value as Project['status'])}
                          className="form-select"
                          disabled={!selectedProjects[index]}
                        >
                          <option value="ACTIVE">🚀 進行中</option>
                          <option value="ON_HOLD">⏸️ 保留</option>
                          <option value="COMPLETED">✅ 完了</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">📄</span>
                        <span>説明</span>
                      </label>
                      <textarea
                        value={project.description}
                        onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                        rows={3}
                        className="form-textarea"
                        placeholder="プロジェクトの詳細説明を入力..."
                        disabled={!selectedProjects[index]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 実行ボタン */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedCount === 0}
              className="btn-primary px-8 py-3 text-lg flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>作成中...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span>{selectedCount}個のプロジェクトを作成</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
