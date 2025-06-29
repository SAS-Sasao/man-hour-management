'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { WBSEntry, Task, Project, User } from '../types';
import { isValidWorkDate } from '../utils/dateValidation';
import { isHoliday, getHolidayName, isBusinessDay } from '../utils/holidays';

interface WBSCalendarProps {
  projectId?: string;
  assigneeId?: string;
}

export default function WBSCalendar({ projectId, assigneeId }: WBSCalendarProps) {
  const { state } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [wbsEntries, setWbsEntries] = useState<WBSEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<WBSEntry | null>(null);
  const [showModal, setShowModal] = useState(false);

  // WBSエントリを取得
  useEffect(() => {
    const fetchWBSEntries = async () => {
      try {
        const response = await fetch('/api/wbs');
        if (response.ok) {
          const data = await response.json();
          setWbsEntries(data);
        }
      } catch (error) {
        console.error('WBSエントリの取得に失敗しました:', error);
      }
    };

    fetchWBSEntries();
  }, []);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 前月の末尾の日付を追加
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // 当月の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // 次月の最初の日付を追加（6週間表示のため）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  }, [currentMonth]);

  // 指定日のWBSエントリを取得
  const getWBSEntriesForDate = (date: Date) => {
    return wbsEntries.filter(entry => {
      // フィルタリング条件
      if (projectId) {
        const task = state.tasks.find(t => t.id === entry.taskId);
        if (!task || task.projectId !== projectId) return false;
      }
      
      if (assigneeId && entry.assigneeId !== assigneeId) return false;

      // 日付範囲チェック
      const entryStart = entry.plannedStartDate ? new Date(entry.plannedStartDate) : null;
      const entryEnd = entry.plannedEndDate ? new Date(entry.plannedEndDate) : null;
      
      if (!entryStart || !entryEnd) return false;
      
      const dateStr = date.toDateString();
      const startStr = entryStart.toDateString();
      const endStr = entryEnd.toDateString();
      
      return date >= entryStart && date <= entryEnd;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW_PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-green-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return '未対応';
      case 'IN_PROGRESS': return '対応中';
      case 'REVIEW_PENDING': return 'レビュー待ち';
      case 'REVIEWED': return 'レビュー済';
      case 'COMPLETED': return '完了';
      default: return '不明';
    }
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // WBSエントリ詳細モーダル
  const WBSEntryModal = () => {
    if (!selectedEntry) return null;

    const task = state.tasks.find(t => t.id === selectedEntry.taskId);
    const project = state.projects.find(p => p.id === task?.projectId);
    const assignee = state.users.find(u => u.id === selectedEntry.assigneeId);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">WBS作業詳細</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作業名</label>
              <p className="text-lg font-semibold">{task?.name || '不明な作業'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プロジェクト</label>
                <p className="text-gray-900">{project?.name || '不明なプロジェクト'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <p className="text-gray-900">{assignee?.name || '未割当'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEntry.status)}`}>
                {getStatusLabel(selectedEntry.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予定開始日</label>
                <p className="text-gray-900">
                  {selectedEntry.plannedStartDate 
                    ? new Date(selectedEntry.plannedStartDate).toLocaleDateString('ja-JP')
                    : '未設定'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予定終了日</label>
                <p className="text-gray-900">
                  {selectedEntry.plannedEndDate 
                    ? new Date(selectedEntry.plannedEndDate).toLocaleDateString('ja-JP')
                    : '未設定'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予定工数</label>
                <p className="text-gray-900">{selectedEntry.estimatedHours}時間</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">実績工数</label>
                <p className="text-gray-900">{selectedEntry.actualHours}時間</p>
              </div>
            </div>

            {/* 進捗バー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工数進捗</label>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${selectedEntry.estimatedHours > 0 
                      ? Math.min((selectedEntry.actualHours / selectedEntry.estimatedHours) * 100, 100)
                      : 0
                    }%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedEntry.estimatedHours > 0 
                  ? `${Math.round((selectedEntry.actualHours / selectedEntry.estimatedHours) * 100)}%`
                  : '0%'
                } 完了
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-bold">
            WBS カレンダー - {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div key={day} className={`p-4 text-center text-sm font-semibold ${
            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="grid grid-cols-7">
        {daysInMonth.map(({ date, isCurrentMonth }, index) => {
          const wbsEntriesForDate = getWBSEntriesForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const dayOfWeek = index % 7;
          const isHolidayDate = isHoliday(date);
          const holidayName = getHolidayName(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 transition-all duration-200 relative ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${isToday ? 'bg-yellow-50' : ''} ${
                isHolidayDate && isCurrentMonth ? 'bg-red-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-medium ${
                    !isCurrentMonth ? 'text-gray-400' : 
                    isHolidayDate ? 'text-red-600' :
                    dayOfWeek === 0 ? 'text-red-600' : 
                    dayOfWeek === 6 ? 'text-blue-600' : 
                    'text-gray-800'
                  } ${isToday ? 'bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}`}>
                    {date.getDate()}
                  </span>
                  {isHolidayDate && isCurrentMonth && (
                    <span className="text-xs text-red-600 font-medium mt-1 truncate max-w-[60px]" title={holidayName || ''}>
                      🎌 {holidayName}
                    </span>
                  )}
                </div>
                {wbsEntriesForDate.length > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                    {wbsEntriesForDate.length}件
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {wbsEntriesForDate.slice(0, 3).map((entry) => {
                  const task = state.tasks.find(t => t.id === entry.taskId);
                  const project = state.projects.find(p => p.id === task?.projectId);
                  
                  return (
                    <div
                      key={entry.id}
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowModal(true);
                      }}
                      className={`text-xs p-1 rounded hover:opacity-80 transition-opacity duration-150 cursor-pointer ${getStatusColor(entry.status)}`}
                    >
                      <div className="font-medium truncate">{task?.name || '不明な作業'}</div>
                      <div className="truncate">{project?.name || '不明なプロジェクト'}</div>
                      <div className="text-xs opacity-75">{entry.estimatedHours}h予定</div>
                    </div>
                  );
                })}
                {wbsEntriesForDate.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{wbsEntriesForDate.length - 3}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* モーダル */}
      {showModal && <WBSEntryModal />}
    </div>
  );
}
