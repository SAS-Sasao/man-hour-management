'use client';

import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TimeEntry } from '../types';
import { isValidWorkDate } from '../utils/dateValidation';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTimeEntryClick: (entry: TimeEntry) => void;
}

export default function Calendar({ selectedDate, onDateSelect, onTimeEntryClick }: CalendarProps) {
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

  const getTimeEntriesForDate = (date: Date) => {
    return state.timeEntries.filter(entry => 
      entry.userId === state.currentUser?.id &&
      entry.date.toDateString() === date.toDateString()
    );
  };

  const getTotalHoursForDate = (date: Date) => {
    return getTimeEntriesForDate(date).reduce((sum, entry) => sum + entry.hours, 0);
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
          
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 transition-all duration-200 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''} ${
                isToday ? 'bg-yellow-50' : ''
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
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${
                  !isCurrentMonth ? 'text-gray-400' : 
                  dayOfWeek === 0 ? 'text-red-600' : 
                  dayOfWeek === 6 ? 'text-blue-600' : 
                  'text-gray-800'
                } ${isToday ? 'bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}`}>
                  {date.getDate()}
                </span>
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
                  
                  return (
                    <div
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimeEntryClick(entry);
                      }}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="font-medium truncate">{project?.name || '不明'}</div>
                      <div className="text-blue-600 truncate">{task?.name || '不明'} - {entry.hours}h</div>
                    </div>
                  );
                })}
                {timeEntries.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{timeEntries.length - 3}件
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