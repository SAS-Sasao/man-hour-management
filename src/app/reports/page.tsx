'use client';

import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../contexts/AppContext';
import { MonthlyReport } from '../../types';
import { 
  hoursToPersonDays, 
  formatPersonDays, 
  hoursToPersonMonths, 
  formatPersonMonths
} from '../../utils/calculations';
import { getBusinessDaysInMonth } from '../../utils/holidays';

type ViewMode = 'monthly' | 'hourly' | 'person';

export default function ReportsPage() {
  const { state } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const generateReport = useMemo(() => {
    let filteredEntries = state.timeEntries;

    // メンバー権限の場合は自分のデータのみに制限
    if (state.currentUser?.role === 'MEMBER' && state.currentUser) {
      filteredEntries = filteredEntries.filter(entry => entry.userId === state.currentUser!.id);
    }

    if (viewMode === 'monthly') {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    if (selectedProject) {
      filteredEntries = filteredEntries.filter(entry => entry.projectId === selectedProject);
    }

    if (selectedUser) {
      filteredEntries = filteredEntries.filter(entry => entry.userId === selectedUser);
    }

    if (viewMode === 'person') {
      const userStats = new Map();
      filteredEntries.forEach(entry => {
        const userId = entry.userId;
        if (!userStats.has(userId)) {
          const user = state.users.find(u => u.id === userId);
          userStats.set(userId, {
            user,
            totalHours: 0,
            projects: new Map(),
            phases: new Map()
          });
        }
        
        const userStat = userStats.get(userId);
        userStat.totalHours += entry.hours;
        
        const project = state.projects.find(p => p.id === entry.projectId);
        const projectName = project?.name || '不明なプロジェクト';
        userStat.projects.set(entry.projectId, {
          name: projectName,
          hours: (userStat.projects.get(entry.projectId)?.hours || 0) + entry.hours
        });
        
        const phase = state.phases.find(p => p.id === entry.phaseId);
        const phaseName = phase?.name || '不明な工程';
        userStat.phases.set(entry.phaseId, {
          name: phaseName,
          hours: (userStat.phases.get(entry.phaseId)?.hours || 0) + entry.hours
        });
      });
      
      return Array.from(userStats.values()).sort((a, b) => b.totalHours - a.totalHours);
    }

    if (viewMode === 'hourly') {
      const hourlyStats: Record<string, { date: Date; totalHours: number; entries: any[] }> = {};
      filteredEntries.forEach(entry => {
        const dateKey = entry.date.toISOString().split('T')[0];
        if (!hourlyStats[dateKey]) {
          hourlyStats[dateKey] = {
            date: entry.date,
            totalHours: 0,
            entries: []
          };
        }
        hourlyStats[dateKey].totalHours += entry.hours;
        hourlyStats[dateKey].entries.push(entry);
      });
      
      return Object.values(hourlyStats).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    }

    // Monthly view
    const reportMap = new Map<string, MonthlyReport>();
    filteredEntries.forEach(entry => {
      const key = `${entry.userId}-${entry.projectId}`;
      
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          userId: entry.userId,
          projectId: entry.projectId,
          year: selectedYear,
          month: selectedMonth,
          totalHours: 0,
          phaseBreakdown: []
        });
      }

      const report = reportMap.get(key)!;
      report.totalHours += entry.hours;

      let phaseBreakdown = report.phaseBreakdown.find(p => p.phaseId === entry.phaseId);
      if (!phaseBreakdown) {
        const phase = state.phases.find(p => p.id === entry.phaseId);
        phaseBreakdown = {
          phaseId: entry.phaseId,
          phaseName: phase?.name || '不明な工程',
          hours: 0,
          taskBreakdown: []
        };
        report.phaseBreakdown.push(phaseBreakdown);
      }

      phaseBreakdown.hours += entry.hours;

      let taskBreakdown = phaseBreakdown.taskBreakdown.find(t => t.taskId === entry.taskId);
      if (!taskBreakdown) {
        const task = state.tasks.find(t => t.id === entry.taskId);
        taskBreakdown = {
          taskId: entry.taskId,
          taskName: task?.name || '不明な作業',
          hours: 0
        };
        phaseBreakdown.taskBreakdown.push(taskBreakdown);
      }

      taskBreakdown.hours += entry.hours;
    });

    return Array.from(reportMap.values()).sort((a, b) => {
      const userA = state.users.find(u => u.id === a.userId)?.name || '';
      const userB = state.users.find(u => u.id === b.userId)?.name || '';
      if (userA !== userB) return userA.localeCompare(userB);
      
      const projectA = state.projects.find(p => p.id === a.projectId)?.name || '';
      const projectB = state.projects.find(p => p.id === b.projectId)?.name || '';
      return projectA.localeCompare(projectB);
    });
  }, [state, viewMode, selectedYear, selectedMonth, selectedProject, selectedUser]);

  const totalHours = useMemo(() => {
    if (viewMode === 'person') {
      return generateReport.reduce((sum: number, userStat: any) => sum + userStat.totalHours, 0);
    }
    if (viewMode === 'hourly') {
      return generateReport.reduce((sum: number, dayStat: any) => sum + dayStat.totalHours, 0);
    }
    return generateReport.reduce((sum: number, report: any) => sum + report.totalHours, 0);
  }, [generateReport, viewMode]);

  const exportToCsv = () => {
    const csvData = [];
    const businessDays = getBusinessDaysInMonth(selectedYear, selectedMonth);
    const personMonthBase = businessDays * 7.5; // 1人月 = 営業日数 × 7.5h
    
    if (viewMode === 'person') {
      csvData.push(['ユーザー', 'プロジェクト', '時間', '人日', '人月']);
      
      let totalHours = 0;
      generateReport.forEach((userStat: any) => {
        let userTotal = 0;
        Array.from(userStat.projects.values()).forEach((project: any) => {
          csvData.push([
            userStat.user?.name || '不明', 
            project.name, 
            project.hours.toString(),
            hoursToPersonDays(project.hours).toFixed(2),
            hoursToPersonMonths(project.hours).toFixed(3)
          ]);
          userTotal += project.hours;
        });
        
        // ユーザー小計を追加
        csvData.push([
          `【${userStat.user?.name || '不明'} 小計】`,
          '',
          userTotal.toString(),
          hoursToPersonDays(userTotal).toFixed(2),
          hoursToPersonMonths(userTotal).toFixed(3)
        ]);
        csvData.push(['', '', '', '', '']); // 空行
        totalHours += userTotal;
      });
      
      // 全体合計を追加
      if (generateReport.length > 0) {
        csvData.push(['', '', '', '', '']); // 空行
        csvData.push([
          '【全体合計】',
          '',
          totalHours.toString(),
          hoursToPersonDays(totalHours).toFixed(2),
          hoursToPersonMonths(totalHours).toFixed(3)
        ]);
      }
    } else if (viewMode === 'hourly') {
      csvData.push(['日付', 'プロジェクト', '工程', '作業', 'ユーザー', '時間', '人日', '人月']);
      
      // プロジェクト→工程→作業→ユーザー順でソート
      const sortedEntries: any[] = [];
      generateReport.forEach((dayStat: any) => {
        dayStat.entries.forEach((entry: any) => {
          const project = state.projects.find(p => p.id === entry.projectId);
          const phase = state.phases.find(p => p.id === entry.phaseId);
          const task = state.tasks.find(t => t.id === entry.taskId);
          const user = state.users.find(u => u.id === entry.userId);
          
          sortedEntries.push({
            date: entry.date,
            projectName: project?.name || '不明',
            phaseName: phase?.name || '不明',
            taskName: task?.name || '不明',
            userName: user?.name || '不明',
            hours: entry.hours
          });
        });
      });
      
      sortedEntries.sort((a, b) => {
        if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
        if (a.phaseName !== b.phaseName) return a.phaseName.localeCompare(b.phaseName);
        if (a.taskName !== b.taskName) return a.taskName.localeCompare(b.taskName);
        return a.userName.localeCompare(b.userName);
      });
      
      // 工程単位での小計計算
      const phaseSubtotals = new Map<string, number>();
      sortedEntries.forEach((item) => {
        const phaseKey = `${item.projectName}-${item.phaseName}`;
        phaseSubtotals.set(phaseKey, (phaseSubtotals.get(phaseKey) || 0) + item.hours);
      });
      
      let totalHours = 0;
      
      sortedEntries.forEach((entry, index) => {
        csvData.push([
          entry.date.toLocaleDateString('ja-JP'),
          entry.projectName,
          entry.phaseName,
          entry.taskName,
          entry.userName,
          entry.hours.toString(),
          hoursToPersonDays(entry.hours).toFixed(2),
          hoursToPersonMonths(entry.hours).toFixed(3)
        ]);
        
        totalHours += entry.hours;
        
        // 工程が変わる場合、または最後の行の場合に小計を追加
        const nextEntry = sortedEntries[index + 1];
        const phaseKey = `${entry.projectName}-${entry.phaseName}`;
        
        if (!nextEntry || 
            nextEntry.projectName !== entry.projectName || 
            nextEntry.phaseName !== entry.phaseName) {
          
          const phaseTotal = phaseSubtotals.get(phaseKey) || 0;
          csvData.push([
            '',
            '',
            `【${entry.phaseName} 小計】`,
            '',
            '',
            phaseTotal.toString(),
            hoursToPersonDays(phaseTotal).toFixed(2),
            hoursToPersonMonths(phaseTotal).toFixed(3)
          ]);
          csvData.push(['', '', '', '', '', '', '', '']); // 空行
        }
      });
      
      // 全体合計を追加
      if (sortedEntries.length > 0) {
        csvData.push(['', '', '', '', '', '', '', '']); // 空行
        csvData.push([
          '',
          '【全体合計】',
          '',
          '',
          '',
          totalHours.toString(),
          hoursToPersonDays(totalHours).toFixed(2),
          hoursToPersonMonths(totalHours).toFixed(3)
        ]);
      }
    } else {
      // 月次レポート - プロジェクト→工程→作業→ユーザー順
      csvData.push(['プロジェクト', '工程', '作業', 'ユーザー', '時間', '人日', '人月']);
      
      // データを整理してソート
      const sortedData: any[] = [];
      generateReport.forEach((report: any) => {
        const user = state.users.find(u => u.id === report.userId);
        const project = state.projects.find(p => p.id === report.projectId);

        report.phaseBreakdown.forEach((phase: any) => {
          phase.taskBreakdown.forEach((task: any) => {
            sortedData.push({
              projectName: project?.name || '不明',
              phaseName: phase.phaseName,
              taskName: task.taskName,
              userName: user?.name || '不明',
              hours: task.hours
            });
          });
        });
      });
      
      // プロジェクト→工程→作業→ユーザー順でソート
      sortedData.sort((a, b) => {
        if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
        if (a.phaseName !== b.phaseName) return a.phaseName.localeCompare(b.phaseName);
        if (a.taskName !== b.taskName) return a.taskName.localeCompare(b.taskName);
        return a.userName.localeCompare(b.userName);
      });
      
      // 工程単位での小計計算
      const phaseSubtotals = new Map<string, number>();
      sortedData.forEach((item) => {
        const phaseKey = `${item.projectName}-${item.phaseName}`;
        phaseSubtotals.set(phaseKey, (phaseSubtotals.get(phaseKey) || 0) + item.hours);
      });
      
        const currentProject = '';
        const currentPhase = '';
      let totalHours = 0;
      
      sortedData.forEach((item, index) => {
        // データ行を追加
        csvData.push([
          item.projectName,
          item.phaseName,
          item.taskName,
          item.userName,
          item.hours.toString(),
          hoursToPersonDays(item.hours).toFixed(2),
          hoursToPersonMonths(item.hours).toFixed(3)
        ]);
        
        totalHours += item.hours;
        
        // 工程が変わる場合、または最後の行の場合に小計を追加
        const nextItem = sortedData[index + 1];
        const phaseKey = `${item.projectName}-${item.phaseName}`;
        
        if (!nextItem || 
            nextItem.projectName !== item.projectName || 
            nextItem.phaseName !== item.phaseName) {
          
          const phaseTotal = phaseSubtotals.get(phaseKey) || 0;
          csvData.push([
            '',
            `【${item.phaseName} 小計】`,
            '',
            '',
            phaseTotal.toString(),
            hoursToPersonDays(phaseTotal).toFixed(2),
            hoursToPersonMonths(phaseTotal).toFixed(3)
          ]);
          csvData.push(['', '', '', '', '', '', '']); // 空行
        }
      });
      
      // 全体合計を追加
      if (sortedData.length > 0) {
        csvData.push(['', '', '', '', '', '', '']); // 空行
        csvData.push([
          '【全体合計】',
          '',
          '',
          '',
          totalHours.toString(),
          hoursToPersonDays(totalHours).toFixed(2),
          hoursToPersonMonths(totalHours).toFixed(3)
        ]);
      }
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const modeText = viewMode === 'monthly' ? '月次' : viewMode === 'hourly' ? '日次' : '人別';
    link.setAttribute('download', `工数レポート_${modeText}_${selectedYear}年${selectedMonth}月.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const years = Array.from(new Set([
    ...state.timeEntries.map(entry => entry.date.getFullYear()),
    new Date().getFullYear()
  ])).sort((a, b) => b - a);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const viewModes = [
    { key: 'monthly', label: '月次集計', icon: '📅', color: 'blue' },
    { key: 'hourly', label: '日次工数', icon: '⏰', color: 'green' },
    { key: 'person', label: '人別統計', icon: '👥', color: 'purple' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">レポート & 分析</h1>
              <p className="text-indigo-100 mt-2">
                プロジェクトの工数データを多角的に分析
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalHours.toFixed(1)}h</div>
              <div className="text-xl font-semibold text-indigo-100">
                {formatPersonDays(totalHours)}
              </div>
              <div className="text-indigo-100 text-xs">
                {generateReport.length}項目のデータ
              </div>
            </div>
          </div>
        </div>

        {/* 表示モード選択 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">表示モード</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {viewModes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as ViewMode)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  viewMode === mode.key
                    ? `border-${mode.color}-500 bg-${mode.color}-50 text-${mode.color}-700`
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-2">{mode.icon}</div>
                <div className="font-semibold">{mode.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">フィルター設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {viewMode === 'monthly' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">月</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}月</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">プロジェクト</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">全て</option>
                {state.projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {state.currentUser?.role !== 'MEMBER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ユーザー</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">全て</option>
                  {state.users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 結果表示 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {viewMode === 'monthly' && `${selectedYear}年${selectedMonth}月 月次集計`}
                {viewMode === 'hourly' && '日次工数詳細'}
                {viewMode === 'person' && '人別工数統計'}
              </h2>
              <button
                onClick={exportToCsv}
                disabled={generateReport.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>CSV出力</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {generateReport.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">データがありません</h3>
                <p className="text-gray-500">該当する工数データが見つかりませんでした</p>
              </div>
            ) : (
              <div className="space-y-6">
                {viewMode === 'person' && (
                  <div className="grid gap-6">
                    {(generateReport as any[]).map((userStat, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-xl font-bold">{userStat.user?.name || '不明なユーザー'}</h3>
                              <p className="text-purple-100">{userStat.user?.email || ''}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{userStat.totalHours.toFixed(1)}h</div>
                              <div className="text-lg font-semibold text-purple-100">
                                {formatPersonDays(userStat.totalHours)}
                              </div>
                              <div className="text-purple-100 text-xs">総作業時間</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">プロジェクト別</h4>
                              <div className="space-y-2">
                                {Array.from(userStat.projects.values()).map((project: any, pIndex: number) => (
                                  <div key={pIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-800 font-medium">{project.name}</span>
                                    <div className="text-right">
                                      <div className="font-semibold text-purple-600">{project.hours.toFixed(1)}h</div>
                                      <div className="text-xs text-gray-500">{formatPersonDays(project.hours)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">工程別</h4>
                              <div className="space-y-2">
                                {Array.from(userStat.phases.values()).map((phase: any, phIndex: number) => (
                                  <div key={phIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-800 font-medium">{phase.name}</span>
                                    <div className="text-right">
                                      <div className="font-semibold text-pink-600">{phase.hours.toFixed(1)}h</div>
                                      <div className="text-xs text-gray-500">{formatPersonDays(phase.hours)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'hourly' && (
                  <div className="space-y-4">
                    {(generateReport as any[]).map((dayStat, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-bold">
                                {dayStat.date.toLocaleDateString('ja-JP', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  weekday: 'long'
                                })}
                              </h3>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">{dayStat.totalHours.toFixed(1)}h</div>
                              <div className="text-sm text-green-100">{formatPersonDays(dayStat.totalHours)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="space-y-2">
                            {dayStat.entries.map((entry: any, entryIndex: number) => {
                              const project = state.projects.find(p => p.id === entry.projectId);
                              const phase = state.phases.find(p => p.id === entry.phaseId);
                              const task = state.tasks.find(t => t.id === entry.taskId);
                              
                              return (
                                <div key={entryIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium text-gray-900">{project?.name || '不明なプロジェクト'}</div>
                                    <div className="text-sm text-gray-600">
                                      {phase?.name || '不明な工程'} {'>'} {task?.name || '不明な作業'}
                                    </div>
                                    {entry.description && (
                                      <div className="text-xs text-gray-500 mt-1">{entry.description}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">{entry.hours}h</div>
                                    <div className="text-xs text-gray-500">{formatPersonDays(entry.hours)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'monthly' && (
                  <div className="space-y-6">
                    {(generateReport as MonthlyReport[]).map((report, index) => {
                      const user = state.users.find(u => u.id === report.userId);
                      const project = state.projects.find(p => p.id === report.projectId);

                      return (
                        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-xl font-bold">{user?.name || '不明なユーザー'}</h3>
                                <p className="text-blue-100">{project?.name || '不明なプロジェクト'}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold">{report.totalHours.toFixed(1)}h</div>
                                <div className="text-lg font-semibold text-blue-100">
                                  {formatPersonDays(report.totalHours)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="space-y-4">
                              {report.phaseBreakdown.map((phase, phaseIndex) => (
                                <div key={phaseIndex} className="border border-gray-100 rounded-lg overflow-hidden">
                                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-100">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-semibold text-gray-800">{phase.phaseName}</h4>
                                      <div className="text-right">
                                        <div className="font-bold text-blue-600">{phase.hours.toFixed(1)}h</div>
                                        <div className="text-xs text-gray-500">{formatPersonDays(phase.hours)}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {phase.taskBreakdown.map((task, taskIndex) => (
                                        <div key={taskIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                          <span className="text-gray-700 font-medium">{task.taskName}</span>
                                          <div className="text-right">
                                            <div className="font-semibold text-cyan-600">{task.hours.toFixed(1)}h</div>
                                            <div className="text-xs text-gray-500">{formatPersonDays(task.hours)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
