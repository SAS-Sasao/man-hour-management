import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { GanttTask, WBSProgressReport, AssigneeWorkloadReport, WBSEntry } from '@/types';
import { parseJSTDate, createJSTTimestamp } from '@/utils/timezone';

// WBSデータの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'gantt';
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const assigneeId = searchParams.get('assigneeId');

    switch (type) {
      case 'gantt':
        return await getGanttTasks(projectId, startDate, endDate, assigneeId);
      case 'progress':
        return await getProgressReport(projectId);
      case 'workload':
        return await getWorkloadReport(startDate, endDate);
      case 'entries':
        return await getWBSEntries(projectId, assigneeId);
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('WBS API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ガントチャート表示用のタスクデータを取得（TaskとWBSEntryを統合）
async function getGanttTasks(
  projectId?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  assigneeId?: string | null
) {
  const whereClause: any = {};
  const dateFilter: any = {};
  
  if (projectId) {
    whereClause.projectId = projectId;
  }
  
  if (assigneeId) {
    whereClause.assigneeId = assigneeId;
  }
  
  // 日付範囲でのフィルタリング
  if (startDate && endDate) {
    const start = parseJSTDate(startDate);
    const end = parseJSTDate(endDate);
    
    dateFilter.OR = [
      {
        plannedStartDate: {
          gte: start,
          lte: end
        }
      },
      {
        plannedEndDate: {
          gte: start,
          lte: end
        }
      },
      {
        actualStartDate: {
          gte: start,
          lte: end
        }
      },
      {
        actualEndDate: {
          gte: start,
          lte: end
        }
      }
    ];
  }

  // Taskからデータを取得
  const tasks = await prisma.task.findMany({
    where: {
      ...whereClause,
      ...dateFilter
    },
    include: {
      project: {
        select: { name: true }
      },
      phase: {
        select: { name: true }
      },
      assignee: {
        select: { name: true }
      },
      timeEntries: {
        select: { hours: true }
      }
    },
    orderBy: [
      { plannedStartDate: 'asc' },
      { order: 'asc' }
    ]
  });

  // WBSEntryからデータを取得
  const wbsEntries = await prisma.wBSEntry.findMany({
    where: {
      ...whereClause,
      ...dateFilter
    },
    include: {
      project: {
        select: { name: true }
      },
      task: {
        include: {
          phase: {
            select: { name: true }
          }
        }
      },
      assignee: {
        select: { name: true }
      }
    },
    orderBy: [
      { plannedStartDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  // TaskをGanttTask形式に変換
  const ganttTasks: GanttTask[] = tasks.map((task: any) => {
    const actualHours = task.timeEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0);
    const progress = task.estimatedHours > 0 ? Math.min((actualHours / task.estimatedHours) * 100, 100) : 0;
    
    return {
      id: task.id,
      name: task.name,
      type: 'task' as const,
      projectName: task.project.name,
      phaseName: task.phase.name,
      assigneeName: task.assignee?.name,
      status: task.status,
      plannedStartDate: task.plannedStartDate,
      plannedEndDate: task.plannedEndDate,
      actualStartDate: task.actualStartDate,
      actualEndDate: task.actualEndDate,
      estimatedHours: task.estimatedHours,
      actualHours,
      progress: Math.round(progress)
    };
  });

  // WBSEntryをGanttTask形式に変換
  const ganttWBSEntries: GanttTask[] = wbsEntries.map((entry: any) => {
    const progress = entry.estimatedHours > 0 ? Math.min((entry.actualHours / entry.estimatedHours) * 100, 100) : 0;
    
    return {
      id: entry.id,
      name: entry.name,
      type: 'wbs' as const,
      projectName: entry.project?.name,
      phaseName: entry.phase?.name || entry.task?.phase?.name,
      assigneeName: entry.assignee?.name,
      status: entry.status,
      plannedStartDate: entry.plannedStartDate,
      plannedEndDate: entry.plannedEndDate,
      actualStartDate: entry.actualStartDate,
      actualEndDate: entry.actualEndDate,
      estimatedHours: entry.estimatedHours,
      actualHours: entry.actualHours,
      progress: Math.round(progress)
    };
  });

  // TaskとWBSEntryを統合してソート
  const allGanttTasks = [...ganttTasks, ...ganttWBSEntries].sort((a, b) => {
    if (a.plannedStartDate && b.plannedStartDate) {
      return new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime();
    }
    if (a.plannedStartDate) return -1;
    if (b.plannedStartDate) return 1;
    return 0;
  });

  return NextResponse.json(allGanttTasks);
}

// WBSエントリのみを取得
async function getWBSEntries(projectId?: string | null, assigneeId?: string | null) {
  const whereClause: any = {};
  
  if (projectId) {
    whereClause.projectId = projectId;
  }
  
  if (assigneeId) {
    whereClause.assigneeId = assigneeId;
  }

  const entries = await prisma.wBSEntry.findMany({
    where: whereClause,
    include: {
      project: {
        select: { id: true, name: true }
      },
      task: {
        select: {
          id: true,
          name: true,
          phaseId: true,
          phase: {
            select: { 
              id: true,
              name: true 
            }
          }
        }
      },
      phase: {
        select: {
          id: true,
          name: true
        }
      },
      assignee: {
        select: { id: true, name: true }
      }
    },
    orderBy: [
      { plannedStartDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  return NextResponse.json(entries);
}

// プロジェクト進捗レポートを取得（WBSEntryのみ）
async function getProgressReport(projectId?: string | null) {
  const whereClause = projectId ? { projectId } : {};
  
  // WBSEntryのみから進捗を集計
  const wbsEntries = await prisma.wBSEntry.findMany({
    where: whereClause,
    include: {
      project: {
        select: { name: true }
      }
    }
  });

  // プロジェクト別に集計
  const projectGroups: Record<string, any> = {};

  // WBSEntryを集計
  wbsEntries.forEach((entry: any) => {
    if (entry.projectId) {
      const key = entry.projectId;
      if (!projectGroups[key]) {
        projectGroups[key] = {
          projectId: entry.projectId,
          projectName: entry.project.name,
          items: []
        };
      }
      projectGroups[key].items.push(entry);
    }
  });

  const progressReports: WBSProgressReport[] = Object.values(projectGroups).map((group: any) => {
    const totalItems = group.items.length;
    const completedItems = group.items.filter((item: any) => item.status === 'COMPLETED').length;
    const inProgressItems = group.items.filter((item: any) => item.status === 'IN_PROGRESS').length;
    const notStartedItems = group.items.filter((item: any) => item.status === 'NOT_STARTED').length;
    // 遅延タスクの計算（一つでも遅延があればカウント）
    const overdueItems = group.items.filter((item: any) => {
      if (!item.plannedEndDate) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const plannedEnd = new Date(item.plannedEndDate);
      plannedEnd.setHours(0, 0, 0, 0);
      
      // 完了済みの場合は実際の終了日と予定終了日を比較
      if (item.status === 'COMPLETED') {
        if (item.actualEndDate) {
          const actualEnd = new Date(item.actualEndDate);
          actualEnd.setHours(0, 0, 0, 0);
          return actualEnd > plannedEnd; // 実際の終了日が予定より遅い場合は遅延
        }
        return false; // 実際の終了日がない場合は遅延なし
      }
      
      // 未完了の場合は今日の日付と予定終了日を比較
      return today > plannedEnd; // 今日が予定終了日を過ぎている場合は遅延
    }).length;

    return {
      projectId: group.projectId,
      projectName: group.projectName,
      totalTasks: totalItems,
      completedTasks: completedItems,
      inProgressTasks: inProgressItems,
      notStartedTasks: notStartedItems,
      overdueTasks: overdueItems,
      progressPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      estimatedCompletion: undefined,
      actualCompletion: undefined
    };
  });

  return NextResponse.json(projectId ? progressReports[0] : progressReports);
}

// 担当者別作業負荷レポートを取得
async function getWorkloadReport(startDate?: string | null, endDate?: string | null) {
  const dateFilter: any = {};
  
  if (startDate && endDate) {
    dateFilter.OR = [
      {
        plannedStartDate: {
          gte: parseJSTDate(startDate),
          lte: parseJSTDate(endDate)
        }
      },
      {
        plannedEndDate: {
          gte: parseJSTDate(startDate),
          lte: parseJSTDate(endDate)
        }
      }
    ];
  }

  // TaskとWBSEntryの両方から作業負荷を集計
  const tasks = await prisma.task.findMany({
    where: {
      ...dateFilter,
      assigneeId: { not: null }
    },
    include: {
      assignee: {
        select: { id: true, name: true }
      },
      timeEntries: {
        select: { hours: true }
      }
    }
  });

  const wbsEntries = await prisma.wBSEntry.findMany({
    where: {
      ...dateFilter,
      assigneeId: { not: null }
    },
    include: {
      assignee: {
        select: { id: true, name: true }
      }
    }
  });

  // 担当者別に集計
  const assigneeGroups: Record<string, any> = {};

  // Taskを集計
  tasks.forEach((task: any) => {
    const key = task.assigneeId!;
    if (!assigneeGroups[key]) {
      assigneeGroups[key] = {
        assigneeId: key,
        assigneeName: task.assignee!.name,
        items: []
      };
    }
    assigneeGroups[key].items.push({
      ...task,
      type: 'task',
      actualHours: task.timeEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0)
    });
  });

  // WBSEntryを集計
  wbsEntries.forEach((entry: any) => {
    const key = entry.assigneeId!;
    if (!assigneeGroups[key]) {
      assigneeGroups[key] = {
        assigneeId: key,
        assigneeName: entry.assignee!.name,
        items: []
      };
    }
    assigneeGroups[key].items.push({
      ...entry,
      type: 'wbs'
    });
  });

  const workloadReports: AssigneeWorkloadReport[] = Object.values(assigneeGroups).map((group: any) => {
    const activeItems = group.items.filter((item: any) => 
      item.status === 'IN_PROGRESS' || item.status === 'REVIEW_PENDING' || item.status === 'REVIEWED'
    ).length;
    const completedItems = group.items.filter((item: any) => item.status === 'COMPLETED').length;
    // 遅延タスクの計算（一つでも遅延があればカウント）
    const overdueItemsCount = group.items.filter((item: any) => {
      if (!item.plannedEndDate) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const plannedEnd = new Date(item.plannedEndDate);
      plannedEnd.setHours(0, 0, 0, 0);
      
      // 完了済みの場合は実際の終了日と予定終了日を比較
      if (item.status === 'COMPLETED') {
        if (item.actualEndDate) {
          const actualEnd = new Date(item.actualEndDate);
          actualEnd.setHours(0, 0, 0, 0);
          return actualEnd > plannedEnd; // 実際の終了日が予定より遅い場合は遅延
        }
        return false; // 実際の終了日がない場合は遅延なし
      }
      
      // 未完了の場合は今日の日付と予定終了日を比較
      return today > plannedEnd; // 今日が予定終了日を過ぎている場合は遅延
    }).length;
    const estimatedHours = group.items.reduce((sum: number, item: any) => sum + item.estimatedHours, 0);
    const actualHours = group.items.reduce((sum: number, item: any) => 
      sum + (item.type === 'task' ? item.actualHours : item.actualHours), 0
    );
    const efficiency = estimatedHours > 0 ? actualHours / estimatedHours : 0;

    // 作業負荷レベルの判定
    let currentWorkload: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOAD' = 'NORMAL';
    if (activeItems === 0) currentWorkload = 'LOW';
    else if (activeItems <= 3) currentWorkload = 'NORMAL';
    else if (activeItems <= 6) currentWorkload = 'HIGH';
    else currentWorkload = 'OVERLOAD';

    return {
      assigneeId: group.assigneeId,
      assigneeName: group.assigneeName,
      activeTasks: activeItems,
      completedTasks: completedItems,
      overdueTasksCount: overdueItemsCount,
      estimatedHours,
      actualHours,
      efficiency: Math.round(efficiency * 100) / 100,
      currentWorkload
    };
  });

  return NextResponse.json(workloadReports);
}

// WBSエントリの作成・更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'WBSエントリデータが必要です' }, { status: 400 });
    }

    const createdEntries = await Promise.all(
      entries.map(async (entry: any) => {
        const { 
          name, 
          description, 
          taskId, 
          projectId, 
          phaseId,
          assigneeId, 
          plannedStartDate, 
          plannedEndDate, 
          estimatedHours, 
          actualStartDate, 
          actualEndDate, 
          actualHours, 
          status 
        } = entry;

        if (!name) {
          throw new Error('作業名は必須です');
        }

        return await prisma.wBSEntry.create({
          data: {
            name,
            description: description || null,
            taskId: taskId || null,
            projectId: projectId || null,
            phaseId: phaseId || null,
            assigneeId: assigneeId || null,
            plannedStartDate: plannedStartDate ? parseJSTDate(plannedStartDate) : null,
            plannedEndDate: plannedEndDate ? parseJSTDate(plannedEndDate) : null,
            estimatedHours: estimatedHours || 0,
            actualStartDate: actualStartDate ? parseJSTDate(actualStartDate) : null,
            actualEndDate: actualEndDate ? parseJSTDate(actualEndDate) : null,
            actualHours: actualHours || 0,
            status: status || 'NOT_STARTED',
            createdAt: createJSTTimestamp(),
            updatedAt: createJSTTimestamp(),
          } as any,
          include: {
            project: { select: { name: true } },
            task: { 
              include: { 
                phase: { select: { name: true } } 
              } 
            },
            assignee: { select: { name: true } }
          }
        });
      })
    );

    return NextResponse.json({ 
      message: `${createdEntries.length}件のWBSエントリを作成しました`,
      entries: createdEntries 
    });
  } catch (error) {
    console.error('WBSエントリ作成エラー:', error);
    return NextResponse.json({ error: 'WBSエントリの作成に失敗しました' }, { status: 500 });
  }
}

// WBSエントリの更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    // 日付文字列をDateオブジェクトに変換
    const processedData = { ...updateData };
    ['plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate'].forEach(field => {
      if (processedData[field]) {
        processedData[field] = parseJSTDate(processedData[field]);
      }
    });

    // 空文字列をnullに変換
    ['projectId', 'taskId', 'assigneeId'].forEach(field => {
      if (processedData[field] === '') {
        processedData[field] = null;
      }
    });

    const updatedEntry = await prisma.wBSEntry.update({
      where: { id },
      data: {
        ...processedData,
        updatedAt: createJSTTimestamp(),
      },
      include: {
        project: { select: { name: true } },
        task: { 
          include: { 
            phase: { select: { name: true } } 
          } 
        },
        assignee: { select: { name: true } }
      }
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('WBSエントリ更新エラー:', error);
    return NextResponse.json({ error: 'WBSエントリの更新に失敗しました' }, { status: 500 });
  }
}

// WBSエントリの削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    await prisma.wBSEntry.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'WBSエントリを削除しました' });
  } catch (error) {
    console.error('WBSエントリ削除エラー:', error);
    return NextResponse.json({ error: 'WBSエントリの削除に失敗しました' }, { status: 500 });
  }
}
