'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { useApp } from '../../contexts/AppContext';

export default function Dashboard() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.currentUser) {
      router.push('/login');
    }
  }, [state.currentUser, router]);

  if (!state.currentUser) {
    return null;
  }

  // 現在の日時情報
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  // 自分の工数データのみフィルタリング（メンバーの場合）
  const userTimeEntries = state.currentUser?.role === 'MEMBER' 
    ? state.timeEntries.filter(entry => entry.userId === state.currentUser.id)
    : state.timeEntries;

  const stats = {
    totalProjects: state.projects.length,
    activeProjects: state.projects.filter(p => p.status === 'active').length,
    totalUsers: state.users.length,
    thisMonthHours: userTimeEntries
      .filter(entry => {
        return entry.date.getMonth() === thisMonth && 
               entry.date.getFullYear() === thisYear;
      })
      .reduce((sum, entry) => sum + entry.hours, 0),
    lastMonthHours: userTimeEntries
      .filter(entry => {
        return entry.date.getMonth() === lastMonth && 
               entry.date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, entry) => sum + entry.hours, 0),
    totalHours: userTimeEntries.reduce((sum, entry) => sum + entry.hours, 0),
    averageDailyHours: userTimeEntries.length > 0 
      ? userTimeEntries.reduce((sum, entry) => sum + entry.hours, 0) / 
        Math.max(1, [...new Set(userTimeEntries.map(entry => entry.date.toDateString()))].length)
      : 0
  };

  // プロジェクト別集計
  const projectStats = state.projects.map(project => {
    const projectEntries = userTimeEntries.filter(entry => entry.projectId === project.id);
    const totalHours = projectEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const thisMonthProjectHours = projectEntries
      .filter(entry => entry.date.getMonth() === thisMonth && entry.date.getFullYear() === thisYear)
      .reduce((sum, entry) => sum + entry.hours, 0);
    
    return {
      ...project,
      totalHours,
      thisMonthHours: thisMonthProjectHours,
      progressPercentage: project.endDate 
        ? Math.min(100, ((now.getTime() - project.startDate.getTime()) / 
                        (project.endDate.getTime() - project.startDate.getTime())) * 100)
        : 0
    };
  }).filter(project => project.totalHours > 0).sort((a, b) => b.totalHours - a.totalHours);

  // 工程別集計
  const phaseStats = state.phases.map(phase => {
    const phaseEntries = userTimeEntries.filter(entry => entry.phaseId === phase.id);
    const totalHours = phaseEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    return {
      ...phase,
      totalHours,
      project: state.projects.find(p => p.id === phase.projectId)
    };
  }).filter(phase => phase.totalHours > 0).sort((a, b) => b.totalHours - a.totalHours);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">ダッシュボード</h1>
              <p className="text-blue-100 mt-2">
                プロジェクトと工数の概要を確認できます
              </p>
            </div>
            <div className="text-6xl opacity-20">📊</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総プロジェクト数
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.totalProjects}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      活動中: {stats.activeProjects}件
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {state.currentUser?.role === 'MEMBER' ? '今月の作業時間' : '今月の総工数'}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.thisMonthHours.toFixed(1)}h
                    </dd>
                    <dd className="text-xs text-gray-500">
                      前月: {stats.lastMonthHours.toFixed(1)}h
                      {stats.lastMonthHours > 0 && (
                        <span className={`ml-1 ${stats.thisMonthHours > stats.lastMonthHours ? 'text-green-600' : 'text-red-600'}`}>
                          ({stats.thisMonthHours > stats.lastMonthHours ? '+' : ''}{((stats.thisMonthHours - stats.lastMonthHours) / Math.max(1, stats.lastMonthHours) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {state.currentUser?.role === 'MEMBER' ? '総作業時間' : '総工数'}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.totalHours.toFixed(1)}h
                    </dd>
                    <dd className="text-xs text-gray-500">
                      1日平均: {stats.averageDailyHours.toFixed(1)}h
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {state.currentUser?.role === 'MEMBER' ? '参加プロジェクト' : '総ユーザー数'}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {state.currentUser?.role === 'MEMBER' ? projectStats.length : stats.totalUsers}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {state.currentUser?.role === 'MEMBER' ? 'プロジェクト' : 'ユーザー'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* プロジェクト別統計とBI集計 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border border-white/20">
            <div className="px-6 py-6">
              <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📊</span>
                プロジェクト別集計
              </h3>
              <div className="space-y-3">
                {projectStats.slice(0, 5).map((project) => (
                  <div key={project.id} className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          今月: {project.thisMonthHours.toFixed(1)}h / 累計: {project.totalHours.toFixed(1)}h
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status === 'active' ? '進行中' :
                         project.status === 'completed' ? '完了' : '保留'}
                      </span>
                    </div>
                    {project.endDate && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, project.progressPercentage)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
                {projectStats.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-gray-500">作業データがありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border border-white/20">
            <div className="px-6 py-6">
              <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🔧</span>
                工程別集計
              </h3>
              <div className="space-y-3">
                {phaseStats.slice(0, 5).map((phase) => (
                  <div key={phase.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{phase.name}</p>
                      <p className="text-xs text-gray-500">
                        {phase.project?.name || '不明なプロジェクト'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {phase.totalHours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((phase.totalHours / Math.max(1, stats.totalHours)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
                {phaseStats.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔧</div>
                    <p className="text-gray-500">工程データがありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 最近の活動 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border border-white/20">
            <div className="px-6 py-6">
              <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                最近のプロジェクト
              </h3>
              <div className="space-y-3">
                {state.projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {project.status === 'active' ? '🚀 進行中' :
                         project.status === 'completed' ? '✅ 完了' : '⏸️ 保留'}
                      </span>
                    </div>
                  </div>
                ))}
                {state.projects.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-gray-500">プロジェクトがありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border border-white/20">
            <div className="px-6 py-6">
              <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">⏰</span>
                {state.currentUser?.role === 'MEMBER' ? '最近の作業履歴' : '最近の工数入力'}
              </h3>
              <div className="space-y-3">
                {userTimeEntries
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 5)
                  .map((entry) => {
                    const project = state.projects.find(p => p.id === entry.projectId);
                    const user = state.users.find(u => u.id === entry.userId);
                    const phase = state.phases.find(p => p.id === entry.phaseId);
                    const task = state.tasks.find(t => t.id === entry.taskId);
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {project?.name || '不明なプロジェクト'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {state.currentUser?.role !== 'MEMBER' && (user?.name || '不明なユーザー') + ' • '}
                            {phase?.name || '不明な工程'} • {entry.date.toLocaleDateString('ja-JP')}
                          </p>
                          {entry.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{entry.description}</p>
                          )}
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {entry.hours}h
                        </div>
                      </div>
                    );
                  })}
                {userTimeEntries.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⏰</div>
                    <p className="text-gray-500">工数入力がありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}