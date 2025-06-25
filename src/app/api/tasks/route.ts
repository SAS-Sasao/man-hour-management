import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
      orderBy: [
        { projectId: 'asc' },
        { phaseId: 'asc' },
        { order: 'asc' },
      ],
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('タスク取得エラー:', error);
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('タスク作成データ受信:', body);
    
    const { phaseId, projectId, name, description, estimatedHours } = body;

    // バリデーション
    if (!phaseId || !projectId || !name) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています', details: { phaseId, projectId, name } },
        { status: 400 }
      );
    }

    // 数値バリデーション
    const parsedEstimatedHours = parseFloat(estimatedHours) || 0;
    if (parsedEstimatedHours < 0) {
      return NextResponse.json(
        { error: '見積工数は0以上である必要があります' },
        { status: 400 }
      );
    }

    // プロジェクト存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      return NextResponse.json(
        { error: '指定されたプロジェクトが見つかりません', projectId },
        { status: 400 }
      );
    }

    // フェーズ存在確認とプロジェクトとの関連確認
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId }
    });
    if (!phase) {
      return NextResponse.json(
        { error: '指定されたフェーズが見つかりません', phaseId },
        { status: 400 }
      );
    }
    if (phase.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたフェーズは選択されたプロジェクトに属していません', phaseId, projectId },
        { status: 400 }
      );
    }

    // 同じフェーズ内での順序を決定
    const existingTasks = await prisma.task.findMany({
      where: { phaseId },
      orderBy: { order: 'desc' },
      take: 1
    });
    const nextOrder = existingTasks.length > 0 ? existingTasks[0].order + 1 : 1;

    const task = await prisma.task.create({
      data: {
        phaseId,
        projectId,
        name,
        description: description || '',
        estimatedHours: parsedEstimatedHours,
        order: nextOrder,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });

    console.log('作成されたタスク:', task);
    return NextResponse.json(task);
  } catch (error) {
    console.error('タスク作成エラー:', error);
    return NextResponse.json(
      { error: 'タスクの作成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
