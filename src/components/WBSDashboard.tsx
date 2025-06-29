'use client';

import React, { useState, useEffect } from 'react';
import { WBSProgressReport, AssigneeWorkloadReport, WBSEntry } from '@/types';

interface WBSDashboardProps {
  projectId?: string;
}

const WBSDashboard: React.FC<WBSDashboardProps> = ({ projectId }) => {
  const [progressData, setProgressData] = useState<WBSProgressReport[]>([]);
  const [workloadData, setWorkloadData] = useState<AssigneeWorkloadReport[]>([]);
  const [wbsEntries, setWbsEntries] = useState<WBSEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  // データを取得
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 進捗データを取得
      const progressParams = new URLSearchParams({ type: 'progress' });
      if (projectId) progressParams.append('projectId', projectId);
      
      const progressResponse = await fetch(`/api/wbs?${progressParams}`);
      if (progressResponse.ok) {
        const progressResult = await progressResponse.json();
        setProgressData(Array.isArray(progressResult) ? progressResult : [progressResult]);
      }

      // 作業負荷データを取得
      const now = new Date();
      let startDate: Date, endDate: Date;
      
      switch (selectedPeriod) {
        case 'current_week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'current_quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const workloadParams = new URLSearchParams({
        type: 'workload',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const workloadResponse = await fetch(`/api/wbs?${workloadParams}`);
      if (workloadResponse.ok) {
        const workloadResult = await workloadResponse.json();
        setWorkloadData(workloadResult);
      }

      // WBSエントリデータを取得
      const entriesParams = new URLSearchParams({ type: 'entries' });
      if (projectId) entriesParams.append('projectId', projectId);
      
      const entriesResponse = await fetch(`/api/wbs?${entriesParams}`);
      if (entriesResponse.ok) {
        const entriesResult = await entriesResponse.json();
        setWbsEntries(entriesResult);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [projectId, selectedPeriod]);

  // 進捗率に応じた色を取得
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // 作業負荷レベルに応じた色を取得
  const getWorkloadColor = (level: string): string => {
    switch (level) {
      case 'LOW': return 'bg-gray-500';
      case 'NORMAL': return 'bg-green-500';
      case 'HIGH': return 'bg-yellow-500';
      case 'OVERLOAD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // 作業負荷レベルの日本語表示
  const getWorkloadLabel = (level: string): string => {
    switch (level) {
      case 'LOW': return '低';
      case 'NORMAL': return '通常';
      case 'HIGH': return '高';
      case 'OVERLOAD': return '過負荷';
      default: return '不明';
    }
  };

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
    
    return { status: 'on-track', days: Math.abs(diffDays) }; // 余裕日数
  };

  // プロジェクト別の遅延合計を計算
  const calculateProjectDelayStats = () => {
    const projectStats: Record<string, {
      projectName: string;
      totalDelayDays: number;
      delayStatus: 'on-time' | 'ahead' | 'delayed';
    }> = {};

    wbsEntries.forEach(entry => {
      const projectKey = entry.projectId || 'no-project';
      const projectName = entry.project?.name || '未分類';
      
      if (!projectStats[projectKey]) {
        projectStats[projectKey] = {
          projectName,
          totalDelayDays: 0,
          delayStatus: 'on-time'
        };
      }
      
      const delayInfo = getDelayStatus(entry);
      if (delayInfo.status === 'delayed' || delayInfo.status === 'overdue') {
        projectStats[projectKey].totalDelayDays += delayInfo.days;
      } else if (delayInfo.status === 'on-time' && delayInfo.days > 0 && entry.status === 'COMPLETED') {
        // 完了済みで前倒しの場合はマイナス
        projectStats[projectKey].totalDelayDays -= delayInfo.days;
      }
    });

    // 遅延ステータスを設定
    Object.keys(projectStats).forEach(key => {
      const totalDelayDays = projectStats[key].totalDelayDays;
      projectStats[key].delayStatus = totalDelayDays > 0 ? 'delayed' : 
                                      totalDelayDays < 0 ? 'ahead' : 'on-time';
    });

    return projectStats;
  };

  // 全体統計を計算
  const calculateOverallStats = () => {
    const totalTasks = progressData.reduce((sum, project) => sum + project.totalTasks, 0);
    const completedTasks = progressData.reduce((sum, project) => sum + project.completedTasks, 0);
    const inProgressTasks = progressData.reduce((sum, project) => sum + project.inProgressTasks, 0);
    const overdueTasks = progressData.reduce((sum, project) => sum + project.overdueTasks, 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      overallProgress
    };
  };

  const overallStats = calculateOverallStats();
  const projectDelayStats = calculateProjectDelayStats();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">WBSダッシュボード</h2>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current_week">今週</option>
            <option value="current_month">今月</option>
            <option value="current_quarter">今四半期</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            更新
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* 全体統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総タスク数</p>
                  <p className="text-3xl font-bold text-gray-900">{overallStats.totalTasks}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">完了タスク</p>
                  <p className="text-3xl font-bold text-green-600">{overallStats.completedTasks}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">進行中タスク</p>
                  <p className="text-3xl font-bold text-blue-600">{overallStats.inProgressTasks}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">遅延タスク</p>
                  <p className="text-3xl font-bold text-red-600">{overallStats.overdueTasks}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* プロジェクト進捗 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">プロジェクト進捗</h3>
            <div className="space-y-4">
              {progressData.map((project) => (
                <div key={project.projectId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{project.projectName}</h4>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {project.progressPercentage}% 完了
                      </span>
                      {projectDelayStats[project.projectId] && (
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          projectDelayStats[project.projectId].delayStatus === 'delayed' ? 'bg-red-100 text-red-700' :
                          projectDelayStats[project.projectId].delayStatus === 'ahead' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {projectDelayStats[project.projectId].delayStatus === 'delayed' ? 
                            `${projectDelayStats[project.projectId].totalDelayDays}日遅延` :
                           projectDelayStats[project.projectId].delayStatus === 'ahead' ? 
                            `${Math.abs(projectDelayStats[project.projectId].totalDelayDays)}日前倒し` :
                           '予定通り'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(project.progressPercentage)}`}
                      style={{ width: `${project.progressPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">総タスク</p>
                      <p className="font-semibold">{project.totalTasks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">完了</p>
                      <p className="font-semibold text-green-600">{project.completedTasks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">進行中</p>
                      <p className="font-semibold text-blue-600">{project.inProgressTasks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">遅延</p>
                      <p className="font-semibold text-red-600">{project.overdueTasks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 担当者別作業負荷 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">担当者別作業負荷</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      担当者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作業負荷
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクティブタスク
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      完了タスク
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      遅延タスク
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      効率性
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workloadData.map((assignee) => (
                    <tr key={assignee.assigneeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignee.assigneeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getWorkloadColor(assignee.currentWorkload)}`}>
                          {getWorkloadLabel(assignee.currentWorkload)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignee.activeTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignee.completedTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignee.overdueTasksCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={`mr-2 ${assignee.efficiency > 1 ? 'text-red-600' : assignee.efficiency > 0.8 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {(assignee.efficiency * 100).toFixed(0)}%
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${assignee.efficiency > 1 ? 'bg-red-500' : assignee.efficiency > 0.8 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(assignee.efficiency * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 全体進捗チャート */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">全体進捗概要</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${overallStats.overallProgress * 2.51} 251`}
                    className="text-blue-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {overallStats.overallProgress}%
                    </div>
                    <div className="text-sm text-gray-600">完了</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WBSDashboard;
