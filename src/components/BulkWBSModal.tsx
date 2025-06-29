'use client';

import React, { useState, useEffect } from 'react';
import { TaskStatus } from '@/types';

interface BulkWBSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entries: any[]) => void;
  projectId?: string;
}

interface WBSEntryForm {
  name: string;
  description: string;
  projectId: string;
  taskId: string;
  phaseId: string;
  assigneeId: string;
  plannedStartDate: string;
  plannedEndDate: string;
  estimatedHours: number;
  status: TaskStatus;
}

const BulkWBSModal: React.FC<BulkWBSModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectId
}) => {
  const [entries, setEntries] = useState<WBSEntryForm[]>([
    {
      name: '',
      description: '',
      projectId: projectId || '',
      taskId: '',
      phaseId: '',
      assigneeId: '',
      plannedStartDate: '',
      plannedEndDate: '',
      estimatedHours: 0,
      status: 'NOT_STARTED'
    }
  ]);

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // データを取得
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // プロジェクト一覧を取得
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // タスク一覧を取得
      const tasksResponse = await fetch('/api/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      // フェーズ一覧を取得
      const phasesResponse = await fetch('/api/phases');
      if (phasesResponse.ok) {
        const phasesData = await phasesResponse.json();
        setPhases(phasesData);
      }

      // ユーザー一覧を取得
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    }
  };

  // エントリを追加
  const addEntry = () => {
    setEntries([
      ...entries,
      {
        name: '',
        description: '',
        projectId: projectId || '',
        taskId: '',
        phaseId: '',
        assigneeId: '',
        plannedStartDate: '',
        plannedEndDate: '',
        estimatedHours: 0,
        status: 'NOT_STARTED'
      }
    ]);
  };

  // エントリを削除
  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  // エントリを更新
  const updateEntry = (index: number, field: keyof WBSEntryForm, value: any) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value
    };
    setEntries(updatedEntries);
  };

  // 全エントリに共通値を設定
  const applyToAll = (field: keyof WBSEntryForm, value: any) => {
    const updatedEntries = entries.map(entry => ({
      ...entry,
      [field]: value
    }));
    setEntries(updatedEntries);
  };

  // 保存処理
  const handleSave = async () => {
    // バリデーション
    const validEntries = entries.filter(entry => entry.name.trim() !== '');
    
    if (validEntries.length === 0) {
      alert('少なくとも1つの作業名を入力してください');
      return;
    }

    // 必須項目チェック
    const invalidEntries = validEntries.filter(entry => 
      !entry.name.trim() || !entry.projectId
    );

    if (invalidEntries.length > 0) {
      alert('作業名とプロジェクトは必須です');
      return;
    }

    setLoading(true);
    try {
      await onSave(validEntries);
      onClose();
      // フォームをリセット
      setEntries([{
        name: '',
        description: '',
        projectId: projectId || '',
        taskId: '',
        phaseId: '',
        assigneeId: '',
        plannedStartDate: '',
        plannedEndDate: '',
        estimatedHours: 0,
        status: 'NOT_STARTED'
      }]);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // プロジェクトに関連するフェーズをフィルタリング
  const getPhasesForProject = (projectId: string) => {
    return phases.filter(phase => phase.projectId === projectId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">WBS作業一括登録</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 共通設定 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium mb-3">全作業に適用</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト
              </label>
              <select
                onChange={(e) => applyToAll('projectId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                担当者
              </label>
              <select
                onChange={(e) => applyToAll('assigneeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                onChange={(e) => applyToAll('status', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                予定工数（時間）
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                onChange={(e) => applyToAll('estimatedHours', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 個別エントリ */}
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium">作業 {index + 1}</h5>
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作業名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => updateEntry(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="作業名を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクト <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={entry.projectId}
                    onChange={(e) => updateEntry(index, 'projectId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工程（フェーズ）
                  </label>
                  <select
                    value={entry.phaseId}
                    onChange={(e) => updateEntry(index, 'phaseId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {getPhasesForProject(entry.projectId).map((phase: any) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    担当者
                  </label>
                  <select
                    value={entry.assigneeId}
                    onChange={(e) => updateEntry(index, 'assigneeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予定開始日
                  </label>
                  <input
                    type="date"
                    value={entry.plannedStartDate}
                    onChange={(e) => updateEntry(index, 'plannedStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予定終了日
                  </label>
                  <input
                    type="date"
                    value={entry.plannedEndDate}
                    onChange={(e) => updateEntry(index, 'plannedEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予定工数（時間）
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={entry.estimatedHours}
                    onChange={(e) => updateEntry(index, 'estimatedHours', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={entry.status}
                    onChange={(e) => updateEntry(index, 'status', e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NOT_STARTED">未対応</option>
                    <option value="IN_PROGRESS">対応中</option>
                    <option value="REVIEW_PENDING">レビュー待ち</option>
                    <option value="REVIEWED">レビュー済</option>
                    <option value="COMPLETED">完了</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={entry.description}
                    onChange={(e) => updateEntry(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="作業の詳細説明"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 作業追加ボタン */}
        <div className="mt-4">
          <button
            onClick={addEntry}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            作業を追加
          </button>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '保存中...' : `${entries.filter(e => e.name.trim()).length}件の作業を登録`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkWBSModal;
