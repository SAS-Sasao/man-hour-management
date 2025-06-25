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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {editingEntry ? '工数編集' : '工数入力'}
              </h2>
              <p className="text-blue-100 mt-1">
                {selectedDate.toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {entries.map((entry, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    工数入力 {index + 1}
                  </h3>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(index)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      プロジェクト *
                    </label>
                    <select
                      value={entry.projectId}
                      onChange={(e) => updateEntry(index, 'projectId', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">選択してください</option>
                      {state.projects.filter(p => p.status === 'ACTIVE').map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工程 *
                    </label>
                    <select
                      value={entry.phaseId}
                      onChange={(e) => updateEntry(index, 'phaseId', e.target.value)}
                      disabled={!entry.projectId}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors duration-200"
                    >
                      <option value="">選択してください</option>
                      {getAvailablePhases(entry.projectId).map(phase => (
                        <option key={phase.id} value={phase.id}>
                          {phase.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      作業 *
                    </label>
                    <select
                      value={entry.taskId}
                      onChange={(e) => updateEntry(index, 'taskId', e.target.value)}
                      disabled={!entry.phaseId}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors duration-200"
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      作業時間（時間） *
                    </label>
                    <input
                      type="number"
                      value={entry.hours}
                      onChange={(e) => updateEntry(index, 'hours', e.target.value)}
                      step="0.25"
                      min="0.25"
                      max="24"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      作業内容
                    </label>
                    <input
                      type="text"
                      value={entry.description}
                      onChange={(e) => updateEntry(index, 'description', e.target.value)}
                      placeholder="作業の詳細を入力してください"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>
            ))}

            {!editingEntry && (
              <button
                onClick={addNewEntry}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>工数入力を追加</span>
              </button>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            {editingEntry ? '更新' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
}
