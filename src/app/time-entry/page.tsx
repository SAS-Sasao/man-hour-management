'use client';

import { useState } from 'react';
import Layout from '../../components/Layout';
import Calendar from '../../components/Calendar';
import BulkTimeEntryModal from '../../components/BulkTimeEntryModal';
import { useApp } from '../../contexts/AppContext';
import { TimeEntry } from '../../types';
import { formatPersonDays } from '../../utils/calculations';

export default function TimeEntryPage() {
  const { state, dispatch } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleTimeEntryClick = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedDate(entry.date);
    setShowModal(true);
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('この工数入力を削除しますか？')) {
      try {
        const response = await fetch(`/api/time-entries/${entryId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          dispatch({ type: 'DELETE_TIME_ENTRY', payload: entryId });
        } else {
          alert('削除に失敗しました');
        }
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  const todayEntries = state.timeEntries
    .filter(entry => 
      entry.userId === state.currentUser?.id &&
      entry.date.toDateString() === selectedDate.toDateString()
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const weeklyStats = (() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekEntries = state.timeEntries.filter(entry =>
      entry.userId === state.currentUser?.id &&
      entry.date >= startOfWeek &&
      entry.date <= endOfWeek
    );

    return {
      totalHours: weekEntries.reduce((sum, entry) => sum + entry.hours, 0),
      daysWorked: new Set(weekEntries.map(entry => entry.date.toDateString())).size
    };
  })();

  return (
    <Layout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">工数入力</h1>
              <p className="text-blue-100 mt-2">
                カレンダーから日付を選択して工数を入力してください
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{weeklyStats.totalHours.toFixed(1)}h</div>
              <div className="text-lg font-semibold text-blue-100">
                {formatPersonDays(weeklyStats.totalHours)}
              </div>
              <div className="text-blue-100 text-xs">{weeklyStats.daysWorked}日間作業</div>
            </div>
          </div>
        </div>

        {state.projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">プロジェクトがありません</h2>
            <p className="text-gray-500 mb-6">まずプロジェクトと工程・作業を設定してください</p>
            <button
              onClick={() => window.location.href = '/projects'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              プロジェクトを作成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* カレンダー */}
            <div className="lg:col-span-2">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onTimeEntryClick={handleTimeEntryClick}
              />
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 選択日の詳細 */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4">
                  <h3 className="font-bold text-lg">
                    {selectedDate.toLocaleDateString('ja-JP', { 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </h3>
                  <div className="text-green-100 text-sm">
                    {todayEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}時間 作業済み
                  </div>
                  <div className="text-green-200 text-xs">
                    {formatPersonDays(todayEntries.reduce((sum, entry) => sum + entry.hours, 0))}
                  </div>
                </div>

                <div className="p-4">
                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setShowModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mb-4 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>工数を追加</span>
                  </button>

                  <div className="space-y-3">
                    {todayEntries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">⏰</div>
                        <p className="text-sm">この日の工数入力はありません</p>
                      </div>
                    ) : (
                      todayEntries.map((entry) => {
                        const project = state.projects.find(p => p.id === entry.projectId);
                        const phase = state.phases.find(p => p.id === entry.phaseId);
                        const task = state.tasks.find(t => t.id === entry.taskId);

                        return (
                          <div key={entry.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {project?.name || '不明なプロジェクト'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {phase?.name || '不明な工程'} {'>'} {task?.name || '不明な作業'}
                                </div>
                                {entry.description && (
                                  <div className="text-xs text-gray-600 mt-1 truncate">
                                    {entry.description}
                                  </div>
                                )}
                              </div>
                              <div className="ml-2 text-right">
                                <div className="text-sm font-bold text-blue-600">{entry.hours}h</div>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleTimeEntryClick(entry)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 今週の統計 */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 mb-3">今週の統計</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">総作業時間</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{weeklyStats.totalHours.toFixed(1)}h</div>
                      <div className="text-xs text-gray-500">{formatPersonDays(weeklyStats.totalHours)}</div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">作業日数</span>
                    <span className="font-semibold text-gray-900">{weeklyStats.daysWorked}日</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">1日平均</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {weeklyStats.daysWorked > 0 ? (weeklyStats.totalHours / weeklyStats.daysWorked).toFixed(1) : '0.0'}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {weeklyStats.daysWorked > 0 ? formatPersonDays(weeklyStats.totalHours / weeklyStats.daysWorked) : '0.00人日'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* モーダル */}
        <BulkTimeEntryModal
          isOpen={showModal}
          onClose={closeModal}
          selectedDate={selectedDate}
          editingEntry={editingEntry}
        />
      </div>
    </Layout>
  );
}
