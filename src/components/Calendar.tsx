'use client';

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TimeEntry } from '../types';
import { isValidWorkDate } from '../utils/dateValidation';
import { isHoliday, getHolidayName, isBusinessDay } from '../utils/holidays';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTimeEntryClick: (entry: TimeEntry) => void;
  showTeamView?: boolean;
  projectId?: string;
}

export default function Calendar({ selectedDate, onDateSelect, onTimeEntryClick, showTeamView = false, projectId }: CalendarProps) {
  const { state } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth()));

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

  // プロジェクトマネージャーかどうかを判定
  const isProjectManager = useMemo(() => {
    if (!state.currentUser || !projectId) return false;
    const project = state.projects.find(p => p.id === projectId);
    return project?.managers?.some(m => m.userId === state.currentUser?.id) || false;
  }, [state.currentUser, state.projects, projectId]);

  // プロジェクトメンバーを取得
  const projectMembers = useMemo(() => {
    if (!projectId) return [];
    const project = state.projects.find(p => p.id === projectId);
    return project?.members?.map(m => m.userId) || [];
  }, [state.projects, projectId]);

  const getTimeEntriesForDate = (date: Date) => {
    if (showTeamView && projectId) {
      // チーム表示モード：選択されたプロジェクトのメンバー全員の工数を取得
      return state.timeEntries.filter(entry => 
        entry.projectId === projectId &&
        entry.date.toDateString() === date.toDateString()
      );
    } else {
      // 個人表示モード：自分の工数のみ
      return state.timeEntries.filter(entry => 
        entry.userId === state.currentUser?.id &&
        entry.date.toDateString() === date.toDateString()
      );
    }
  };

  const getTotalHoursForDate = (date: Date) => {
    return getTimeEntriesForDate(date).reduce((sum, entry) => sum + entry.hours, 0);
  };

  // ユーザー別の色を生成
  const getUserColor = (userId: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-gray-100 text-gray-800'
    ];
    
    // プロジェクトメンバーリストからインデックスを取得、見つからない場合は文字列ハッシュを使用
    let index = projectMembers.indexOf(userId);
    if (index === -1) {
      // ユーザーIDの文字列ハッシュを使って色を決定
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit整数に変換
      }
      index = Math.abs(hash) % colors.length;
    }
    
    return colors[index];
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

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

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
            {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
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
          const timeEntries = getTimeEntriesForDate(date);
          const totalHours = getTotalHoursForDate(date);
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const isToday = new Date().toDateString() === date.toDateString();
          const dayOfWeek = index % 7;
          const isHolidayDate = isHoliday(date);
          const holidayName = getHolidayName(date);
          const isBusinessDayDate = isBusinessDay(date);
          
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 transition-all duration-200 relative ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''} ${
                isToday ? 'bg-yellow-50' : ''
              } ${
                isHolidayDate && isCurrentMonth ? 'bg-red-50' : ''
              } ${
                isValidWorkDate(date) && isCurrentMonth 
                  ? 'cursor-pointer hover:bg-blue-50' 
                  : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => {
                if (isValidWorkDate(date) && isCurrentMonth) {
                  onDateSelect(date);
                } else if (!isValidWorkDate(date)) {
                  alert('未来の日付は選択できません');
                } else if (isHolidayDate) {
                  alert(`${holidayName}は祝日です`);
                }
              }}
              title={holidayName || undefined}
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
                  {!isBusinessDayDate && !isHolidayDate && isCurrentMonth && (dayOfWeek === 0 || dayOfWeek === 6) && (
                    <span className="text-xs text-gray-500 font-medium mt-1">
                      {dayOfWeek === 0 ? '🌅 日曜' : '🌆 土曜'}
                    </span>
                  )}
                </div>
                {totalHours > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    {totalHours}h
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {timeEntries.slice(0, 3).map((entry) => {
                  const project = state.projects.find(p => p.id === entry.projectId);
                  const task = state.tasks.find(t => t.id === entry.taskId);
                  const user = state.users.find(u => u.id === entry.userId);
                  
                  return (
                    <div
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimeEntryClick(entry);
                      }}
                      className={`text-xs p-1 rounded hover:opacity-80 transition-all duration-150 cursor-pointer ${
                        showTeamView && projectId
                          ? getUserColor(entry.userId)
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      <div className="font-medium truncate">
                        {showTeamView && isProjectManager ? (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-current mr-1"></span>
                            {user?.name || '不明'} - {project?.name || '不明'}
                          </>
                        ) : (
                          project?.name || '不明'
                        )}
                      </div>
                      <div className="truncate opacity-75">
                        {task?.name || '不明'} - {entry.hours}h
                        {showTeamView && isProjectManager && (
                          <span className="ml-1 text-xs opacity-60">
                            ({new Date(entry.createdAt || entry.date).toLocaleTimeString('ja-JP', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}入力)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {timeEntries.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{timeEntries.length - 3}件
                    {showTeamView && isProjectManager && (
                      <div className="text-xs mt-1">
                        {Array.from(new Set(timeEntries.map(e => e.userId))).length}人が入力
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
