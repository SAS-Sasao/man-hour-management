'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { TimeEntry } from '../types';
import { validateDateInput } from '../utils/dateValidation';

interface BulkTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  editingEntry?: TimeEntry | null;
}

interface TimeEntryForm {
  projectId: string;
  phaseId: string;
  taskId: string;
  hours: string;
  description: string;
}

export default function BulkTimeEntryModal({ isOpen, onClose, selectedDate, editingEntry }: BulkTimeEntryModalProps) {
  const { state, dispatch } = useApp();
  const [entries, setEntries] = useState<TimeEntryForm[]>([
    { projectId: '', phaseId: '', taskId: '', hours: '', description: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setEntries([{
        projectId: editingEntry.projectId,
        phaseId: editingEntry.phaseId,
        taskId: editingEntry.taskId,
        hours: editingEntry.hours.toString(),
        description: editingEntry.description
      }]);
    } else {
      setEntries([{ projectId: '', phaseId: '', taskId: '', hours: '', description: '' }]);
    }
  }, [editingEntry, isOpen]);

  const addNewEntry = () => {
    setEntries([...entries, { projectId: '', phaseId: '', taskId: '', hours: '', description: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof TimeEntryForm, value: string) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };

    // プロジェクト変更時に工程とタスクをリセット
    if (field === 'projectId') {
      updatedEntries[index].phaseId = '';
      updatedEntries[index].taskId = '';
    }

    // 工程変更時にタスクをリセット
    if (field === 'phaseId') {
      updatedEntries[index].taskId = '';
    }

    setEntries(updatedEntries);
  };

  const getAvailablePhases = (projectId: string) => {
    return state.phases.filter(phase => phase.projectId === projectId);
  };

  const getAvailableTasks = (phaseId: string) => {
    return state.tasks.filter(task => task.phaseId === phaseId);
  };

  const handleSubmit = async () => {
    // 日付バリデーション
    const dateValidation = validateDateInput(selectedDate.toISOString().split('T')[0]);
    if (!dateValidation.isValid) {
      alert(dateValidation.error);
      return;
    }

    const validEntries = entries.filter(entry => 
      entry.projectId && entry.phaseId && entry.taskId && entry.hours && parseFloat(entry.hours) > 0
    );

    if (validEntries.length === 0) {
      alert('少なくとも1つの有効な工数入力が必要です');
      return;
    }

    setIsLoading(true);

    try {
      if (editingEntry && validEntries.length === 1) {
        // 編集モード
        const entry = validEntries[0];
        const response = await fetch(`/api/time-entries/${editingEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: state.currentUser?.id,
            projectId: entry.projectId,
            phaseId: entry.phaseId,
            taskId: entry.taskId,
            date: selectedDate.toISOString(),
            hours: entry.hours,
            description: entry.description,
          }),
        });

        if (response.ok) {
          const updatedEntry = await response.json();
          const timeEntry: TimeEntry = {
            ...updatedEntry,
            date: new Date(updatedEntry.date),
            createdAt: new Date(updatedEntry.createdAt),
            updatedAt: new Date(updatedEntry.updatedAt),
          };
          dispatch({ type: 'UPDATE_TIME_ENTRY', payload: timeEntry });
        } else {
          const errorData = await response.json();
          console.error('更新エラー:', errorData);
          alert(`工数の更新に失敗しました: ${errorData.error || '不明なエラー'}`);
          return;
        }
      } else {
        // 新規作成モード
        for (const entry of validEntries) {
          const response = await fetch('/api/time-entries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: state.currentUser?.id,
              projectId: entry.projectId,
              phaseId: entry.phaseId,
              taskId: entry.taskId,
              date: selectedDate.toISOString(),
              hours: entry.hours,
              description: entry.description,
            }),
          });

          if (response.ok) {
            const newEntry = await response.json();
            const timeEntry: TimeEntry = {
              ...newEntry,
              date: new Date(newEntry.date),
              createdAt: new Date(newEntry.createdAt),
              updatedAt: new Date(newEntry.updatedAt),
            };
            dispatch({ type: 'ADD_TIME_ENTRY', payload: timeEntry });
          } else {
            const errorData = await response.json();
            console.error('登録エラー:', errorData);
            alert(`工数の登録に失敗しました: ${errorData.error || '不明なエラー'}`);
            return;
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('工数入力エラー:', error);
      alert('工数の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="glass-heavy rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden animate-scaleIn">
        {/* ヘッダー */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 opacity-90"></div>
          <div className="relative p-8 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">{editingEntry ? '✏️' : '⏰'}</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    {editingEntry ? '工数編集' : '工数入力'}
                  </h2>
                  <p className="text-green-100 mt-1 text-lg">
                    {selectedDate.toLocaleDateString('ja-JP', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl flex items-center justify-center transition-all duration-200 hover-lift"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-280px)]">
          <div className="space-y-8">
            {entries.map((entry, index) => (
              <div key={index} className="card hover-lift animate-fadeIn" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="card-body">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold gradient-text-success flex items-center space-x-3">
                      <span className="text-2xl">📝</span>
                      <span>工数入力 {index + 1}</span>
                    </h3>
                    {entries.length > 1 && (
                      <button
                        onClick={() => removeEntry(index)}
                        className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors duration-200 hover-lift"
                        title="削除"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">📋</span>
                        <span>プロジェクト *</span>
                      </label>
                      <select
                        value={entry.projectId}
                        onChange={(e) => updateEntry(index, 'projectId', e.target.value)}
                        className="form-select"
                      >
                        <option value="">選択してください</option>
                        {state.projects.filter(p => p.status === 'ACTIVE').map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">🔧</span>
                        <span>工程 *</span>
                      </label>
                      <select
                        value={entry.phaseId}
                        onChange={(e) => updateEntry(index, 'phaseId', e.target.value)}
                        disabled={!entry.projectId}
                        className="form-select disabled:opacity-50"
                      >
                        <option value="">選択してください</option>
                        {getAvailablePhases(entry.projectId).map(phase => (
                          <option key={phase.id} value={phase.id}>
                            {phase.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">📋</span>
                        <span>作業 *</span>
                      </label>
                      <select
                        value={entry.taskId}
                        onChange={(e) => updateEntry(index, 'taskId', e.target.value)}
                        disabled={!entry.phaseId}
                        className="form-select disabled:opacity-50"
                      >
                        <option value="">選択してください</option>
                        {getAvailableTasks(entry.phaseId).map(task => (
                          <option key={task.id} value={task.id}>
                            {task.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">⏰</span>
                        <span>作業時間（時間） *</span>
                      </label>
                      <input
                        type="number"
                        value={entry.hours}
                        onChange={(e) => updateEntry(index, 'hours', e.target.value)}
                        step="0.25"
                        min="0.25"
                        max="24"
                        className="form-input"
                        placeholder="8.0"
                      />
                    </div>

                    <div className="lg:col-span-3 space-y-2">
                      <label className="form-label flex items-center space-x-2">
                        <span className="text-lg">💬</span>
                        <span>作業内容</span>
                      </label>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) => updateEntry(index, 'description', e.target.value)}
                        placeholder="作業の詳細を入力してください"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!editingEntry && (
              <button
                onClick={addNewEntry}
                className="w-full card border-2 border-dashed border-gray-300 hover:border-green-500 transition-all duration-200 hover-lift"
              >
                <div className="card-body text-center py-8">
                  <div className="text-gray-400 hover:text-green-500 transition-colors duration-200">
                    <div className="text-4xl mb-3">➕</div>
                    <span className="text-lg font-medium">工数入力を追加</span>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="glass border-t border-gray-200 px-8 py-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-success px-8 py-3 text-lg font-semibold hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="spinner w-5 h-5 border-2 border-white border-l-transparent"></div>
                <span>{editingEntry ? '更新中...' : '登録中...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xl">{editingEntry ? '💾' : '✨'}</span>
                <span>{editingEntry ? '更新する' : '登録する'}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
