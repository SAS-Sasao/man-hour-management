'use client';

import { useState } from 'react';
import { Phase, Task } from '../types';

interface PhaseTemplate {
  name: string;
  description: string;
  tasks: TaskTemplate[];
}

interface TaskTemplate {
  name: string;
  description: string;
  estimatedHours: number;
}

interface BulkPhaseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

const DEFAULT_PHASE_TEMPLATES: PhaseTemplate[] = [
  {
    name: '要件定義',
    description: 'システム要件の定義と分析',
    tasks: [
      { name: '会議', description: '要件定義に関する会議・打ち合わせ', estimatedHours: 8 },
      { name: '仕様書作成', description: '要件仕様書の作成・更新', estimatedHours: 16 },
      { name: '調査・分析', description: '現状調査と要件分析作業', estimatedHours: 12 },
      { name: 'レビュー', description: '要件仕様書のレビュー作業', estimatedHours: 4 }
    ]
  },
  {
    name: '基本設計',
    description: 'システム全体の基本設計',
    tasks: [
      { name: '設計書作成', description: '基本設計書の作成・更新', estimatedHours: 20 },
      { name: 'アーキテクチャ作成', description: 'システムアーキテクチャ設計', estimatedHours: 16 },
      { name: 'テーブル設計', description: 'データベーステーブル設計', estimatedHours: 12 },
      { name: '画面設計', description: 'UI/UX設計・画面設計', estimatedHours: 14 },
      { name: 'レビュー', description: '基本設計書のレビュー作業', estimatedHours: 6 }
    ]
  },
  {
    name: '開発',
    description: 'プログラム開発・実装',
    tasks: [
      { name: 'コーディング', description: 'プログラムコーディング', estimatedHours: 40 },
      { name: 'テーブル作成', description: 'データベーステーブル作成', estimatedHours: 8 },
      { name: '単体テスト', description: '単体テスト実施', estimatedHours: 16 },
      { name: 'プロンプト作成', description: 'AI用プロンプト作成', estimatedHours: 6 },
      { name: 'ドキュメント作成', description: '開発ドキュメントの作成', estimatedHours: 8 }
    ]
  },
  {
    name: 'テスト',
    description: 'システムテスト・品質確認',
    tasks: [
      { name: '結合テスト', description: '結合テスト実施', estimatedHours: 20 },
      { name: 'システムテスト', description: 'システムテスト実施', estimatedHours: 16 },
      { name: 'ユーザーテスト', description: 'ユーザー受入テスト支援', estimatedHours: 12 },
      { name: 'バグ修正', description: 'テストで発見されたバグの修正', estimatedHours: 10 },
      { name: 'テスト報告書作成', description: 'テスト結果報告書の作成', estimatedHours: 4 }
    ]
  },
  {
    name: 'インフラ関連',
    description: 'インフラ構築・設定',
    tasks: [
      { name: '環境構築', description: '開発・テスト環境構築', estimatedHours: 12 },
      { name: 'CI/CD構築', description: 'CI/CDパイプライン構築', estimatedHours: 16 },
      { name: 'デプロイ作業', description: '本番環境へのデプロイ作業', estimatedHours: 8 },
      { name: 'セキュリティ設定', description: 'セキュリティ関連設定', estimatedHours: 6 },
      { name: '監視設定', description: 'システム監視・ログ設定', estimatedHours: 4 }
    ]
  },
  {
    name: '管理',
    description: 'プロジェクト管理・進行管理',
    tasks: [
      { name: '会議', description: 'プロジェクト管理会議', estimatedHours: 8 },
      { name: '進捗管理', description: 'プロジェクト進捗管理・報告', estimatedHours: 6 },
      { name: '課題管理', description: '課題・リスク管理', estimatedHours: 4 },
      { name: '品質管理', description: '品質管理・レビュー調整', estimatedHours: 4 },
      { name: 'ドキュメント管理', description: 'プロジェクト文書管理', estimatedHours: 2 }
    ]
  },
  {
    name: 'その他',
    description: 'その他の作業',
    tasks: [
      { name: '学習・調査', description: '技術調査・学習', estimatedHours: 8 },
      { name: '保守・運用', description: 'システム保守・運用作業', estimatedHours: 4 },
      { name: 'その他', description: 'その他の作業', estimatedHours: 2 }
    ]
  }
];

export default function BulkPhaseTaskModal({ isOpen, onClose, onSuccess, projectId }: BulkPhaseTaskModalProps) {
  const [phases, setPhases] = useState<PhaseTemplate[]>(DEFAULT_PHASE_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhases, setSelectedPhases] = useState<boolean[]>(
    new Array(DEFAULT_PHASE_TEMPLATES.length).fill(true)
  );

  const handlePhaseChange = (phaseIndex: number, field: keyof Omit<PhaseTemplate, 'tasks'>, value: string) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex] = {
      ...updatedPhases[phaseIndex],
      [field]: value
    };
    setPhases(updatedPhases);
  };

  const handleTaskChange = (phaseIndex: number, taskIndex: number, field: keyof TaskTemplate, value: string | number) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex].tasks[taskIndex] = {
      ...updatedPhases[phaseIndex].tasks[taskIndex],
      [field]: value
    };
    setPhases(updatedPhases);
  };

  const handleSelectPhase = (index: number, selected: boolean) => {
    const updatedSelection = [...selectedPhases];
    updatedSelection[index] = selected;
    setSelectedPhases(updatedSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedPhases(new Array(phases.length).fill(selected));
  };

  const addNewPhase = () => {
    const newPhase: PhaseTemplate = {
      name: '',
      description: '',
      tasks: [
        { name: '', description: '', estimatedHours: 0 }
      ]
    };
    setPhases([...phases, newPhase]);
    setSelectedPhases([...selectedPhases, true]);
  };

  const removePhase = (index: number) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    const updatedSelection = selectedPhases.filter((_, i) => i !== index);
    setPhases(updatedPhases);
    setSelectedPhases(updatedSelection);
  };

  const addTaskToPhase = (phaseIndex: number) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex].tasks.push({
      name: '',
      description: '',
      estimatedHours: 0
    });
    setPhases(updatedPhases);
  };

  const removeTaskFromPhase = (phaseIndex: number, taskIndex: number) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex].tasks = updatedPhases[phaseIndex].tasks.filter((_, i) => i !== taskIndex);
    setPhases(updatedPhases);
  };

  const handleSubmit = async () => {
    const selectedPhasesData = phases.filter((_, index) => selectedPhases[index]);
    
    if (selectedPhasesData.length === 0) {
      alert('少なくとも1つの工程を選択してください');
      return;
    }

    // バリデーション
    for (let i = 0; i < selectedPhasesData.length; i++) {
      const phase = selectedPhasesData[i];
      if (!phase.name.trim()) {
        alert(`${i + 1}番目の工程名を入力してください`);
        return;
      }
      for (let j = 0; j < phase.tasks.length; j++) {
        const task = phase.tasks[j];
        if (!task.name.trim()) {
          alert(`${phase.name}の${j + 1}番目の作業名を入力してください`);
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const createdPhases = [];
      const createdTasks = [];

      for (const phaseData of selectedPhasesData) {
        // 工程を作成
        const phaseResponse = await fetch('/api/phases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            name: phaseData.name,
            description: phaseData.description,
          }),
        });

        if (phaseResponse.ok) {
          const result = await phaseResponse.json();
          const newPhase = result.data || result;
          createdPhases.push(newPhase);

          // 工程に関連する作業を作成
          for (const taskData of phaseData.tasks) {
            if (taskData.name.trim()) {
              const taskResponse = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  phaseId: newPhase.id,
                  projectId,
                  name: taskData.name,
                  description: taskData.description,
                  estimatedHours: taskData.estimatedHours,
                }),
              });

              if (taskResponse.ok) {
                const newTask = await taskResponse.json();
                createdTasks.push(newTask);
              } else {
                console.warn(`作業 "${taskData.name}" の作成に失敗しました`);
              }
            }
          }
        } else {
          const errorData = await phaseResponse.json();
          throw new Error(`工程 "${phaseData.name}" の作成に失敗: ${errorData.error || '不明なエラー'}`);
        }
      }

      alert(`${createdPhases.length}個の工程と${createdTasks.length}個の作業が正常に作成されました`);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('一括工程・作業作成エラー:', error);
      alert(error instanceof Error ? error.message : '工程・作業の一括作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setPhases(DEFAULT_PHASE_TEMPLATES);
    setSelectedPhases(new Array(DEFAULT_PHASE_TEMPLATES.length).fill(true));
  };

  if (!isOpen) return null;

  const selectedCount = selectedPhases.filter(Boolean).length;
  const totalTasks = phases.reduce((sum, phase, index) => 
    selectedPhases[index] ? sum + phase.tasks.length : sum, 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="card max-w-7xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-text flex items-center space-x-3">
              <span className="text-3xl">🔧</span>
              <span>工程・作業一括登録</span>
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            複数の工程と作業を一度に作成できます。内容は自由に編集可能です。
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
                onClick={addNewPhase}
                className="btn-success text-sm flex items-center space-x-1"
              >
                <span>➕</span>
                <span>工程追加</span>
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
              選択中: {selectedCount}工程 / {totalTasks}作業
            </div>
          </div>

          {/* 工程一覧 */}
          <div className="space-y-6">
            {phases.map((phase, phaseIndex) => (
              <div 
                key={phaseIndex} 
                className={`border-2 rounded-xl p-6 transition-all ${
                  selectedPhases[phaseIndex] 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* 選択チェックボックス */}
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={selectedPhases[phaseIndex]}
                      onChange={(e) => handleSelectPhase(phaseIndex, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* 工程情報 */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">
                        工程 {phaseIndex + 1}
                      </h3>
                      {phases.length > 1 && (
                        <button
                          onClick={() => removePhase(phaseIndex)}
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
                          <span className="text-lg">🔧</span>
                          <span>工程名 *</span>
                        </label>
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => handlePhaseChange(phaseIndex, 'name', e.target.value)}
                          className="form-input"
                          placeholder="工程名を入力..."
                          disabled={!selectedPhases[phaseIndex]}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="form-label flex items-center space-x-2">
                          <span className="text-lg">📄</span>
                          <span>工程説明</span>
                        </label>
                        <input
                          type="text"
                          value={phase.description}
                          onChange={(e) => handlePhaseChange(phaseIndex, 'description', e.target.value)}
                          className="form-input"
                          placeholder="工程の説明を入力..."
                          disabled={!selectedPhases[phaseIndex]}
                        />
                      </div>
                    </div>

                    {/* 作業一覧 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-700 flex items-center space-x-2">
                          <span className="text-lg">📝</span>
                          <span>作業一覧 ({phase.tasks.length}件)</span>
                        </h4>
                        <button
                          onClick={() => addTaskToPhase(phaseIndex)}
                          className="btn-success text-sm flex items-center space-x-1"
                          disabled={!selectedPhases[phaseIndex]}
                        >
                          <span>➕</span>
                          <span>作業追加</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {phase.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="flex items-start space-x-3">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-600">作業名 *</label>
                                  <input
                                    type="text"
                                    value={task.name}
                                    onChange={(e) => handleTaskChange(phaseIndex, taskIndex, 'name', e.target.value)}
                                    className="form-input text-sm"
                                    placeholder="作業名..."
                                    disabled={!selectedPhases[phaseIndex]}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-600">説明</label>
                                  <input
                                    type="text"
                                    value={task.description}
                                    onChange={(e) => handleTaskChange(phaseIndex, taskIndex, 'description', e.target.value)}
                                    className="form-input text-sm"
                                    placeholder="作業の説明..."
                                    disabled={!selectedPhases[phaseIndex]}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-600">見積工数(h)</label>
                                  <input
                                    type="number"
                                    value={task.estimatedHours}
                                    onChange={(e) => handleTaskChange(phaseIndex, taskIndex, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                    className="form-input text-sm"
                                    min="0"
                                    step="0.25"
                                    disabled={!selectedPhases[phaseIndex]}
                                  />
                                </div>
                              </div>
                              {phase.tasks.length > 1 && (
                                <button
                                  onClick={() => removeTaskFromPhase(phaseIndex, taskIndex)}
                                  className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors mt-5"
                                  title="作業削除"
                                  disabled={!selectedPhases[phaseIndex]}
                                >
                                  <span className="text-xs">🗑️</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
                  <span>{selectedCount}工程・{totalTasks}作業を作成</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
