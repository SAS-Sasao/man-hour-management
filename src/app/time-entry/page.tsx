'use client';

import { useState } from 'react';
import Layout from '../../components/Layout';
import Calendar from '../../components/Calendar';
import BulkTimeEntryModal from '../../components/BulkTimeEntryModal';
import { useApp } from '../../contexts/AppContext';
import { TimeEntry } from '../../types';
import { 
  formatPersonDays, 
  formatPersonMonths, 
  formatHoursAndPersonMonths,
  getExpectedHoursForMonth,
  calculateMonthlyProgress,
  formatBusinessDaysAndPersonMonths
} from '../../utils/calculations';
import { getBusinessDaysInMonth } from '../../utils/holidays';

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
    // 本日の日付を基準にした今週の統計
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
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

  const monthlyStats = (() => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const monthEntries = state.timeEntries.filter(entry =>
      entry.userId === state.currentUser?.id &&
      entry.date >= startOfMonth &&
      entry.date <= endOfMonth
    );

    const totalHours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const businessDays = getBusinessDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    const expectedHours = getExpectedHoursForMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    const progress = calculateMonthlyProgress(totalHours, selectedDate.getFullYear(), selectedDate.getMonth() + 1);

    return {
      totalHours,
      daysWorked: new Set(monthEntries.map(entry => entry.date.toDateString())).size,
      projectCount: new Set(monthEntries.map(entry => entry.projectId)).size,
      businessDays,
      expectedHours,
      progress
    };
  })();

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* ヘッダーセクション */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 opacity-10 rounded-3xl"></div>
          <div className="relative glass-heavy rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text-success">工数入力</h1>
                    <p className="text-gray-600 mt-1">カレンダーから日付を選択して効率的に工数を管理</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6 text-center min-w-[200px]">
                <div className="text-3xl font-bold gradient-text mb-1">{weeklyStats.totalHours.toFixed(1)}h</div>
                <div className="text-lg font-semibold text-teal-600 mb-1">
                  {formatPersonDays(weeklyStats.totalHours)}
                </div>
                <div className="text-sm text-gray-500">今週の作業時間</div>
                <div className="text-xs text-gray-400">{weeklyStats.daysWorked}日間作業</div>
              </div>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover-lift animate-slideIn">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今週の作業時間</p>
                  <p className="text-2xl font-bold gradient-text-success">{weeklyStats.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-500">{formatPersonDays(weeklyStats.totalHours)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.1s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今月の作業時間</p>
                  <p className="text-2xl font-bold gradient-text">{monthlyStats.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-500">{formatPersonDays(monthlyStats.totalHours)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.2s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">参加プロジェクト</p>
                  <p className="text-2xl font-bold gradient-text-secondary">{monthlyStats.projectCount}</p>
                  <p className="text-xs text-gray-500">今月</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {state.projects.length === 0 ? (
          <div className="card text-center py-16 animate-scaleIn">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-3xl font-bold gradient-text mb-4">プロジェクトがありません</h2>
            <p className="text-gray-500 mb-8 text-lg">まずプロジェクトと工程・作業を設定してください</p>
            <button
              onClick={() => window.location.href = '/projects'}
              className="btn-primary px-8 py-4 text-lg hover-lift"
            >
              <span className="flex items-center space-x-2">
                <span className="text-xl">✨</span>
                <span>プロジェクトを作成</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* カレンダー */}
            <div className="xl:col-span-3">
              <div className="card animate-scaleIn">
                <div className="card-header">
                  <h2 className="text-2xl font-bold gradient-text flex items-center space-x-3">
                    <span className="text-3xl">📅</span>
                    <span>カレンダー</span>
                  </h2>
                  <p className="text-gray-600 mt-1">日付をクリックして工数を入力してください</p>
                </div>
                <div className="card-body">
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    onTimeEntryClick={handleTimeEntryClick}
                  />
                </div>
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 選択日の詳細 */}
              <div className="card hover-lift animate-slideIn">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-10"></div>
                  <div className="relative p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <span className="text-xl text-white">📅</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg gradient-text-success">
                          {selectedDate.toLocaleDateString('ja-JP', { 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {todayEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}時間 作業済み
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPersonDays(todayEntries.reduce((sum, entry) => sum + entry.hours, 0))}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <button
                    onClick={() => {
                      setEditingEntry(null);
                      setShowModal(true);
                    }}
                    className="btn-success w-full mb-6 flex items-center justify-center space-x-2 py-3"
                  >
                    <span className="text-xl">➕</span>
                    <span>工数を追加</span>
                  </button>

                  <div className="space-y-3">
                    {todayEntries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-3">⏰</div>
                        <p className="text-sm">この日の工数入力はありません</p>
                        <p className="text-xs text-gray-400 mt-1">上のボタンから追加してください</p>
                      </div>
                    ) : (
                      todayEntries.map((entry, index) => {
                        const project = state.projects.find(p => p.id === entry.projectId);
                        const phase = state.phases.find(p => p.id === entry.phaseId);
                        const task = state.tasks.find(t => t.id === entry.taskId);

                        return (
                          <div 
                            key={entry.id} 
                            className="glass rounded-xl p-4 hover-lift animate-fadeIn"
                            style={{animationDelay: `${index * 0.1}s`}}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                                  {project?.name || '不明なプロジェクト'}
                                </div>
                                <div className="text-xs text-gray-600 mb-1 line-clamp-1">
                                  🔧 {phase?.name || '不明な工程'}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-1">
                                  📋 {task?.name || '不明な作業'}
                                </div>
                                {entry.description && (
                                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg line-clamp-2">
                                    💬 {entry.description}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 text-right">
                                <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                  {entry.hours}h
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => handleTimeEntryClick(entry)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                              >
                                <span>✏️</span>
                                <span>編集</span>
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
                              >
                                <span>🗑️</span>
                                <span>削除</span>
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
              <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.1s'}}>
                <div className="card-header">
                  <h3 className="font-bold text-lg gradient-text flex items-center space-x-2">
                    <span className="text-xl">📊</span>
                    <span>今週の統計</span>
                  </h3>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>⏰</span>
                      <span>総作業時間</span>
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{weeklyStats.totalHours.toFixed(1)}h</div>
                      <div className="text-xs text-gray-500">{formatPersonDays(weeklyStats.totalHours)}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>📅</span>
                      <span>作業日数</span>
                    </span>
                    <span className="font-bold text-gray-900">{weeklyStats.daysWorked}日</span>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>📈</span>
                      <span>1日平均</span>
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {weeklyStats.daysWorked > 0 ? (weeklyStats.totalHours / weeklyStats.daysWorked).toFixed(1) : '0.0'}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {weeklyStats.daysWorked > 0 ? formatPersonDays(weeklyStats.totalHours / weeklyStats.daysWorked) : '0.00人日'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 今月の統計 */}
              <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.2s'}}>
                <div className="card-header">
                  <h3 className="font-bold text-lg gradient-text-secondary flex items-center space-x-2">
                    <span className="text-xl">📊</span>
                    <span>今月の統計</span>
                  </h3>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>⏰</span>
                      <span>総作業時間</span>
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{monthlyStats.totalHours.toFixed(1)}h</div>
                      <div className="text-xs text-gray-500">{formatPersonDays(monthlyStats.totalHours)}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>📅</span>
                      <span>作業日数</span>
                    </span>
                    <span className="font-bold text-gray-900">{monthlyStats.daysWorked}日</span>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>🎯</span>
                      <span>プロジェクト数</span>
                    </span>
                    <span className="font-bold text-gray-900">{monthlyStats.projectCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>🏢</span>
                      <span>営業日数</span>
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{monthlyStats.businessDays}日</div>
                      <div className="text-xs text-gray-500">{formatPersonMonths(monthlyStats.expectedHours / 7.5 / 20)}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>📈</span>
                      <span>進捗率</span>
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{monthlyStats.progress.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">
                        {monthlyStats.totalHours.toFixed(1)}h / {monthlyStats.expectedHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <span>👤</span>
                      <span>人月換算</span>
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatHoursAndPersonMonths(monthlyStats.totalHours)}</div>
                      <div className="text-xs text-gray-500">
                        想定: {formatPersonMonths(monthlyStats.expectedHours / 7.5 / 20)}
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
