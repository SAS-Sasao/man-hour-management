import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { DEFAULT_PHASES, DEFAULT_TASKS } from '../../../../../utils/defaultData';
import { Phase, Task } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // プロジェクトの存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    // 既存の工程・作業をチェック
    const existingPhases = await prisma.phase.findMany({
      where: { projectId }
    });

    const existingTasks = await prisma.task.findMany({
      where: { projectId }
    });

    if (existingPhases.length > 0 || existingTasks.length > 0) {
      return NextResponse.json(
        { error: 'このプロジェクトには既に工程または作業が登録されています。一括登録は空のプロジェクトでのみ実行できます。' },
        { status: 400 }
      );
    }

    // トランザクションで一括作成
    const result = await prisma.$transaction(async (tx) => {
      const createdPhases: Phase[] = [];
      const createdTasks: Task[] = [];

      // デフォルト工程を作成
      for (let i = 0; i < DEFAULT_PHASES.length; i++) {
        const phaseData = DEFAULT_PHASES[i];
        const phase = await tx.phase.create({
          data: {
            projectId,
            name: phaseData.name,
            description: phaseData.description,
            order: i + 1
          }
        });
        createdPhases.push(phase);
      }

      // 各工程にデフォルト作業を作成
      for (const phase of createdPhases) {
        for (let j = 0; j < DEFAULT_TASKS.length; j++) {
          const taskData = DEFAULT_TASKS[j];
          const task = await tx.task.create({
            data: {
              phaseId: phase.id,
              projectId: projectId,
              name: taskData.name,
              description: taskData.description,
              estimatedHours: 0.0,
              order: j + 1
            }
          });
          createdTasks.push(task);
        }
      }

      return { phases: createdPhases, tasks: createdTasks };
    });

    return NextResponse.json({
      success: true,
      message: `${result.phases.length}個の工程と${result.tasks.length}個の作業を一括登録しました`,
      data: {
        phasesCount: result.phases.length,
        tasksCount: result.tasks.length,
        phases: result.phases,
        tasks: result.tasks
      }
    });

  } catch (error) {
    console.error('一括登録エラー:', error);
    return NextResponse.json(
      { 
        error: 'デフォルト工程・作業の一括登録に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
