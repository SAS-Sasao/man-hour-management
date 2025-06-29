'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WBSEntry, TaskStatus } from '@/types';

interface WBSGanttTableProps {
  projectId?: string;
  assigneeId?: string;
}

export default function WBSGanttTable({ projectId, assigneeId }: WBSGanttTableProps) {
  const [wbsEntries, setWbsEntries] = useState<WBSEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<WBSEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<'plannedStartDate' | 'name' | 'status' | 'delay'>('plannedStartDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // WBSエントリを取得
  useEffect(() => {
    const fetchWBSEntries = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('type', 'entries');
        if (projectId) params.append('projectId', projectId);
        if (assigneeId) params.append('assigneeId', assigneeId);

        const response = await fetch(`/api/wbs?${params}`);
        if (response.ok) {
          const data = await response.json();
          setWbsEntries(data);
        }
      } catch (error) {
        console.error('WBSエントリの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWBSEntries();
  }, [projectId, assigneeId]);

  // 表示する日付範囲を計算（現在月の1日から月末まで）
  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [currentDate]);

  // 遅延状況を判定（遅延日数も含む）
  const getDelayStatus = (entry: WBSEntry) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!entry.plannedEndDate) return { status: 'unknown', days: 0 };
    
    const plannedEnd = new Date(entry.plannedEndDate);
    plannedEnd.setHours(0, 0, 0, 0);
    
    // 完了済みの場合は実際の終了日と予定終了日を比較
    if (entry.status === 'COMPLETED') {
      if (entry.actualEndDate) {
        const actualEnd = new Date(entry.actualEndDate);
        actualEnd.setHours(0, 0, 0, 0);
        const diffTime = actualEnd.getTime() - plannedEnd.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          return { status: 'delayed', days: diffDays }; // 遅延日数
        } else if (diffDays < 0) {
          return { status: 'on-time', days: Math.abs(diffDays) }; // 前倒し日数
        } else {
          return { status: 'on-time', days: 0 }; // 予定通り
        }
      }
      // 実際の終了日が設定されていない場合は予定通りとみなす
      return { status: 'on-time', days: 0 };
    }
    
    // 未完了の場合は今日の日付と予定終了日を比較
    const diffTime = today.getTime() - plannedEnd.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return { status: 'overdue', days: diffDays }; // 期限超過日数
    }
    
    // 予定終了日まで3日以内の場合は注意
    if (diffDays >= -3) {
      return { status: 'warning', days: Math.abs(diffDays) }; // 残り日数
    }
    
    return { status: 'on-track', days: Math.abs(diffDays) }; // 余裕日数
  };

  // ソート機能
  const sortEntries = (entries: WBSEntry[]) => {
    return [...entries].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'plannedStartDate':
          aValue = a.plannedStartDate ? new Date(a.plannedStartDate).getTime() : 0;
          bValue = b.plannedStartDate ? new Date(b.plannedStartDate).getTime() : 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'delay':
          aValue = getDelayStatus(a);
          bValue = getDelayStatus(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // プロジェクト・フェーズ別にWBSエントリをグループ化
  const groupedEntries = useMemo(() => {
    const groups: Record<string, { 
      projectName: string; 
      phases: Record<string, {
        phaseName: string;
        entries: WBSEntry[];
        totalDelayDays: number;
        delayStatus: 'on-time' | 'ahead' | 'delayed';
      }>;
      totalDelayDays: number;
      delayStatus: 'on-time' | 'ahead' | 'delayed';
    }> = {};
    
    wbsEntries.forEach(entry => {
      const projectKey = entry.projectId || 'no-project';
      const projectName = entry.project?.name || '未分類';
      
      // フェーズ情報の取得を改善
      let phaseKey = 'no-phase';
      let phaseName = 'フェーズ未設定';
      
      // デバッグ用ログ
      console.log('WBS Entry:', {
        id: entry.id,
        name: entry.name,
        phase: entry.phase,
        task: entry.task,
        taskPhase: entry.task?.phase,
        taskPhaseId: entry.task?.phaseId
      });
      
      // 直接のフェーズ情報を優先、次にタスクのフェーズ情報を使用
      if (entry.phase?.id) {
        phaseKey = entry.phase.id;
        phaseName = entry.phase.name || 'フェーズ名未設定';
      } else if (entry.task?.phase?.id) {
        phaseKey = entry.task.phase.id;
        phaseName = entry.task.phase.name || 'フェーズ名未設定';
      } else if (entry.task?.phaseId) {
        phaseKey = entry.task.phaseId;
        phaseName = 'フェーズ情報取得中';
      } else if (entry.phase?.name) {
        phaseKey = entry.phase.name;
        phaseName = entry.phase.name;
      } else if (entry.task?.phase?.name) {
        phaseKey = entry.task.phase.name;
        phaseName = entry.task.phase.name;
      }
      
      if (!groups[projectKey]) {
        groups[projectKey] = {
          projectName,
          phases: {},
          totalDelayDays: 0,
          delayStatus: 'on-time'
        };
      }
      
      if (!groups[projectKey].phases[phaseKey]) {
        groups[projectKey].phases[phaseKey] = {
          phaseName,
          entries: [],
          totalDelayDays: 0,
          delayStatus: 'on-time'
        };
      }
      
      groups[projectKey].phases[phaseKey].entries.push(entry);
    });
    
    // 各フェーズとプロジェクトのエントリをソートし、遅延合計を計算
    Object.keys(groups).forEach(projectKey => {
      let projectTotalDelayDays = 0;
      
      Object.keys(groups[projectKey].phases).forEach(phaseKey => {
        const phase = groups[projectKey].phases[phaseKey];
        phase.entries = sortEntries(phase.entries);
        
        // フェーズの遅延合計を計算
        let phaseDelayDays = 0;
        phase.entries.forEach(entry => {
          const delayInfo = getDelayStatus(entry);
          if (delayInfo.status === 'delayed' || delayInfo.status === 'overdue') {
            phaseDelayDays += delayInfo.days;
          } else if (delayInfo.status === 'on-time' && delayInfo.days > 0 && entry.status === 'COMPLETED') {
            // 完了済みで前倒しの場合はマイナス
            phaseDelayDays -= delayInfo.days;
          }
        });
        
        phase.totalDelayDays = phaseDelayDays;
        phase.delayStatus = phaseDelayDays > 0 ? 'delayed' : 
                           phaseDelayDays < 0 ? 'ahead' : 'on-time';
        
        projectTotalDelayDays += phaseDelayDays;
      });
      
      groups[projectKey].totalDelayDays = projectTotalDelayDays;
      groups[projectKey].delayStatus = projectTotalDelayDays > 0 ? 'delayed' : 
                                      projectTotalDelayDays < 0 ? 'ahead' : 'on-time';
    });
    
    return groups;
  }, [wbsEntries, sortBy, sortOrder]);

  // 指定日にタスクが実行されているかチェック
  const isTaskActiveOnDate = (entry: WBSEntry, date: Date): boolean => {
    if (!entry.plannedStartDate || !entry.plannedEndDate) return false;
    
    const startDate = new Date(entry.plannedStartDate);
    const endDate = new Date(entry.plannedEndDate);
    
    return date >= startDate && date <= endDate;
  };

  // ステータスに応じた色を取得
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-300';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'REVIEW_PENDING': return 'bg-yellow-500';
      case 'REVIEWED': return 'bg-green-400';
      case 'COMPLETED': return 'bg-green-600';
      default: return 'bg-gray-300';
    }
  };

  // ステータスラベルを取得
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED': return '未着';
      case 'IN_PROGRESS': return '進行';
      case 'REVIEW_PENDING': return 'レビュー待ち';
      case 'REVIEWED': return 'レビュー済';
      case 'COMPLETED': return '完了';
      default: return '不明';
    }
  };

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // ソート処理
  const handleSort = (field: 'plannedStartDate' | 'name' | 'status' | 'delay') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // 削除処理
  const handleDelete = async (entryId: string) => {
    if (!confirm('この作業を削除しますか？')) return;

    try {
      const response = await fetch(`/api/wbs/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // データを再取得
        const params = new URLSearchParams();
        params.append('type', 'entries');
        if (projectId) params.append('projectId', projectId);
        if (assigneeId) params.append('assigneeId', assigneeId);

        const refreshResponse = await fetch(`/api/wbs?${params}`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setWbsEntries(data);
        }
        
        alert('WBS作業を削除しました');
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除中にエラーが発生しました');
    }
  };

  // 遅延状況の色を取得
  const getDelayStatusColor = (status: string): string => {
    switch (status) {
      case 'on-time': return 'text-green-600';
      case 'delayed': return 'text-red-600';
      case 'overdue': return 'text-red-800 font-bold';
      case 'warning': return 'text-orange-600';
      case 'on-track': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  // 遅延状況のラベルを取得
  const getDelayStatusLabel = (status: string): string => {
    switch (status) {
      case 'on-time': return '予定通り';
      case 'delayed': return '遅延';
      case 'overdue': return '期限超過';
      case 'warning': return '期限間近';
      case 'on-track': return '順調';
      default: return '不明';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">WBS ガントチャート</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 rounded hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </span>
            <button
              onClick={() => changeMonth('next')}
              className="p-2 rounded hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ソートコントロール */}
      <div className="bg-gray-100 px-4 py-3 border-b">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">並び替え:</span>
          <button
            onClick={() => handleSort('plannedStartDate')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'plannedStartDate' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            予定開始日 {sortBy === 'plannedStartDate' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'name' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            作業名 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('status')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'status' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ステータス {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('delay')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'delay' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            遅延状況 {sortBy === 'delay' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 #f7fafc' }}>
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse" style={{ minWidth: `${Math.max(800, 200 + 100 + 80 + dateRange.length * 40)}px` }}>
            {/* テーブルヘッダー */}
            <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 min-w-[200px]">
                タスク名
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 min-w-[100px]">
                担当者
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[80px]">
                状況
              </th>
              {dateRange.map(date => (
                <th
                  key={date.toISOString()}
                  className="border border-gray-300 px-2 py-3 text-center font-semibold text-gray-700 min-w-[40px]"
                >
                  <div className="text-xs">
                    {date.getMonth() + 1}/{date.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* テーブルボディ */}
          <tbody>
            {Object.entries(groupedEntries).map(([projectKey, group]) => (
              <React.Fragment key={projectKey}>
                {/* プロジェクトヘッダー */}
                <tr className="bg-blue-50">
                  <td
                    colSpan={3 + dateRange.length}
                    className="border border-gray-300 px-4 py-2 font-bold text-blue-800"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        group.delayStatus === 'delayed' ? 'bg-red-100 text-red-700' :
                        group.delayStatus === 'ahead' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {group.delayStatus === 'delayed' ? `${group.totalDelayDays}日遅延` :
                         group.delayStatus === 'ahead' ? `${Math.abs(group.totalDelayDays)}日前倒し` :
                         '予定通り'}
                      </span>
                      <span>プロジェクト: {group.projectName}</span>
                    </div>
                  </td>
                </tr>
                
                {/* フェーズごとのエントリ */}
                {Object.entries(group.phases).map(([phaseKey, phase]) => (
                  <React.Fragment key={phaseKey}>
                    {/* フェーズヘッダー */}
                    <tr className="bg-green-50">
                      <td
                        colSpan={3 + dateRange.length}
                        className="border border-gray-300 px-6 py-2 font-semibold text-green-800"
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            phase.delayStatus === 'delayed' ? 'bg-red-100 text-red-700' :
                            phase.delayStatus === 'ahead' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {phase.delayStatus === 'delayed' ? `${phase.totalDelayDays}日遅延` :
                             phase.delayStatus === 'ahead' ? `${Math.abs(phase.totalDelayDays)}日前倒し` :
                             '予定通り'}
                          </span>
                          <span>└ フェーズ: {phase.phaseName}</span>
                          <span className="text-xs text-gray-600">({phase.entries.length}件の作業)</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* フェーズ内のWBSエントリ */}
                    {phase.entries.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-2">
                      <div className="flex items-center justify-between min-h-[40px]">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" title={entry.name}>
                            {entry.name}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            {entry.task?.name && (
                              <span className="truncate" title={`関連タスク: ${entry.task.name}`}>
                                関連: {entry.task.name}
                              </span>
                            )}
                            {(() => {
                              const delayInfo = getDelayStatus(entry);
                              return (
                                <span className={`${getDelayStatusColor(delayInfo.status)} whitespace-nowrap`}>
                                  {getDelayStatusLabel(delayInfo.status)}
                                  {delayInfo.days > 0 && (
                                    delayInfo.status === 'delayed' ? ` (${delayInfo.days}日遅延)` :
                                    delayInfo.status === 'overdue' ? ` (${delayInfo.days}日超過)` :
                                    delayInfo.status === 'on-time' && delayInfo.days > 0 ? ` (${delayInfo.days}日前倒し)` : ''
                                  )}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              setShowEditModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="編集"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="削除"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <div className="text-sm truncate" title={entry.assignee?.name || '未割当'}>
                        {entry.assignee?.name || '未割当'}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="text-xs font-medium whitespace-nowrap">
                        {getStatusLabel(entry.status)}
                      </span>
                    </td>
                    {dateRange.map(date => (
                      <td
                        key={date.toISOString()}
                        className="border border-gray-300 px-1 py-3 text-center relative"
                      >
                        {isTaskActiveOnDate(entry, date) && (
                          <div
                            className={`h-4 w-full rounded-sm ${getStatusColor(entry.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                            title={`${entry.name} - ${getStatusLabel(entry.status)}`}
                            onClick={() => {
                              setEditingEntry(entry);
                              setShowEditModal(true);
                            }}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          </table>
        </div>

        {/* データがない場合 */}
        {Object.keys(groupedEntries).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium mb-2">WBS作業が登録されていません</div>
            <div className="text-sm">「作業追加」ボタンから新しい作業を登録してください</div>
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex flex-wrap items-center space-x-6 text-sm">
          <span className="font-medium text-gray-700">状況:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>未着</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>進行</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>レビュー待ち</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span>レビュー済</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>完了</span>
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && editingEntry && (
        <WBSEditModal
          entry={editingEntry}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          onSave={async (updatedEntry) => {
            try {
              const response = await fetch(`/api/wbs/${updatedEntry.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEntry),
              });

              if (response.ok) {
                // データを再取得
                const params = new URLSearchParams();
                params.append('type', 'entries');
                if (projectId) params.append('projectId', projectId);
                if (assigneeId) params.append('assigneeId', assigneeId);

                const refreshResponse = await fetch(`/api/wbs?${params}`);
                if (refreshResponse.ok) {
                  const data = await refreshResponse.json();
                  setWbsEntries(data);
                }
                
                setShowEditModal(false);
                setEditingEntry(null);
                alert('WBS作業を更新しました');
              } else {
                alert('更新に失敗しました');
              }
            } catch (error) {
              console.error('更新エラー:', error);
              alert('更新中にエラーが発生しました');
            }
          }}
        />
      )}
    </div>
  );
}

// WBS編集モーダルコンポーネント
interface WBSEditModalProps {
  entry: WBSEntry;
  onClose: () => void;
  onSave: (entry: WBSEntry) => void;
}

const WBSEditModal: React.FC<WBSEditModalProps> = ({ entry, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: entry.name,
    description: entry.description || '',
    status: entry.status as TaskStatus,
    taskId: entry.taskId || '',
    projectId: entry.projectId || '',
    phaseId: entry.phaseId || entry.task?.phaseId || '',
    assigneeId: entry.assigneeId || '',
    plannedStartDate: entry.plannedStartDate ? new Date(entry.plannedStartDate).toISOString().split('T')[0] : '',
    plannedEndDate: entry.plannedEndDate ? new Date(entry.plannedEndDate).toISOString().split('T')[0] : '',
    actualStartDate: entry.actualStartDate ? new Date(entry.actualStartDate).toISOString().split('T')[0] : '',
    actualEndDate: entry.actualEndDate ? new Date(entry.actualEndDate).toISOString().split('T')[0] : '',
    estimatedHours: entry.estimatedHours,
    actualHours: entry.actualHours,
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // プロジェクト、フェーズ、タスク、ユーザーデータを取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // プロジェクト取得
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }

        // ユーザー取得
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }

        // 選択されたプロジェクトのフェーズを取得
        if (formData.projectId) {
          const phasesResponse = await fetch(`/api/phases?projectId=${formData.projectId}`);
          if (phasesResponse.ok) {
            const phasesData = await phasesResponse.json();
            setPhases(phasesData);
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // プロジェクト変更時にフェーズとタスクを再取得
  useEffect(() => {
    const fetchPhases = async () => {
      if (formData.projectId) {
        try {
          const response = await fetch(`/api/phases?projectId=${formData.projectId}`);
          if (response.ok) {
            const data = await response.json();
            setPhases(data);
          }
        } catch (error) {
          console.error('フェーズ取得エラー:', error);
        }
      } else {
        setPhases([]);
        setTasks([]);
      }
    };

    fetchPhases();
  }, [formData.projectId]);

  // フェーズ変更時にタスクを再取得
  useEffect(() => {
    const fetchTasks = async () => {
      if (formData.phaseId) {
        try {
          const response = await fetch(`/api/tasks?phaseId=${formData.phaseId}`);
          if (response.ok) {
            const data = await response.json();
            setTasks(data);
          }
        } catch (error) {
          console.error('タスク取得エラー:', error);
        }
      } else {
        setTasks([]);
      }
    };

    fetchTasks();
  }, [formData.phaseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedEntry: WBSEntry = {
      ...entry,
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status as TaskStatus,
      projectId: formData.projectId || undefined,
      phaseId: formData.phaseId || undefined,
      taskId: formData.taskId || undefined,
      assigneeId: formData.assigneeId || undefined,
      plannedStartDate: formData.plannedStartDate ? new Date(formData.plannedStartDate) : undefined,
      plannedEndDate: formData.plannedEndDate ? new Date(formData.plannedEndDate) : undefined,
      actualStartDate: formData.actualStartDate ? new Date(formData.actualStartDate) : undefined,
      actualEndDate: formData.actualEndDate ? new Date(formData.actualEndDate) : undefined,
      estimatedHours: formData.estimatedHours,
      actualHours: formData.actualHours,
    };

    onSave(updatedEntry);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">WBS作業編集</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value, phaseId: '', taskId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">プロジェクトを選択</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フェーズ（任意）
              </label>
              <select
                value={formData.phaseId}
                onChange={(e) => setFormData({ ...formData, phaseId: e.target.value, taskId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.projectId}
              >
                <option value="">フェーズを選択（任意）</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                関連タスク（任意）
              </label>
              <select
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.phaseId}
              >
                <option value="">タスクを選択（任意）</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                担当者
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">担当者を選択</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NOT_STARTED">未対応</option>
                <option value="IN_PROGRESS">対応中</option>
                <option value="REVIEW_PENDING">レビュー待ち</option>
                <option value="REVIEWED">レビュー済</option>
                <option value="COMPLETED">完了</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予定開始日
              </label>
              <input
                type="date"
                value={formData.plannedStartDate}
                onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予定終了日
              </label>
              <input
                type="date"
                value={formData.plannedEndDate}
                onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実際の開始日
              </label>
              <input
                type="date"
                value={formData.actualStartDate}
                onChange={(e) => setFormData({ ...formData, actualStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実際の終了日
              </label>
              <input
                type="date"
                value={formData.actualEndDate}
                onChange={(e) => setFormData({ ...formData, actualEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予定工数（時間）
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実績工数（時間）
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
