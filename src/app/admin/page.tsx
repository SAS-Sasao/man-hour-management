'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_PHASES, DEFAULT_TASKS } from '@/utils/defaultData';

interface PhaseData {
  name: string;
  description: string;
}

interface TaskData {
  name: string;
  description: string;
}

export default function AdminPage() {
  const [phases, setPhases] = useState<PhaseData[]>(DEFAULT_PHASES);
  const [tasks, setTasks] = useState<TaskData[]>(DEFAULT_TASKS);
  const [activeTab, setActiveTab] = useState<'phases' | 'tasks'>('phases');

  const addPhase = () => {
    setPhases([...phases, { name: '', description: '' }]);
  };

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: keyof PhaseData, value: string) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  const addTask = () => {
    setTasks([...tasks, { name: '', description: '' }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof TaskData, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const saveData = async () => {
    try {
      const response = await fetch('/api/admin/default-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phases, tasks }),
      });

      if (response.ok) {
        alert('データが保存されました');
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  const resetToDefault = () => {
    setPhases([...DEFAULT_PHASES]);
    setTasks([...DEFAULT_TASKS]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">管理者設定</h1>
      
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-4 py-2 rounded ${
              activeTab === 'phases'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            工程管理
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded ${
              activeTab === 'tasks'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            タスク管理
          </button>
        </div>
      </div>

      {activeTab === 'phases' && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">デフォルト工程設定</h2>
          
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="工程名"
                    value={phase.name}
                    onChange={(e) => updatePhase(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="text"
                    placeholder="説明"
                    value={phase.description}
                    onChange={(e) => updatePhase(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button
                  onClick={() => removePhase(index)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addPhase}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            工程を追加
          </button>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">デフォルトタスク設定</h2>
          
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="タスク名"
                    value={task.name}
                    onChange={(e) => updateTask(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="text"
                    placeholder="説明"
                    value={task.description}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button
                  onClick={() => removeTask(index)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addTask}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            タスクを追加
          </button>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={saveData}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          設定を保存
        </button>
        <button
          onClick={resetToDefault}
          className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  );
}