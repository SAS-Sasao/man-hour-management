import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = id;
    
    console.log('タスク取得要求:', taskId);

    // タスクの取得
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    if (!task) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      );
    }

    console.log('タスク取得完了:', taskId);
    return NextResponse.json(task);
    
  } catch (error) {
    console.error('タスク取得エラー:', error);
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = id;
    
    console.log('タスク削除要求:', taskId);

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      );
    }

    // 関連する時間入力データがある場合は警告
    if (task._count.timeEntries > 0) {
      console.log(`タスク「${task.name}」には${task._count.timeEntries}件の時間入力データがあります`);
    }

    // タスクを削除（Cascadeにより関連する時間入力データも自動削除される）
    await prisma.task.delete({
      where: { id: taskId },
    });

    console.log('タスク削除完了:', taskId);
    return NextResponse.json({ message: 'タスクが削除されました' });
    
  } catch (error) {
    console.error('タスク削除エラー:', error);
    return NextResponse.json(
      { error: 'タスクの削除に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = id;
    const body = await request.json();
    
    console.log('タスク更新データ受信:', { taskId, ...body });
    
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

    // タスクの存在確認
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });
    if (!existingTask) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
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

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        phaseId,
        projectId,
        name,
        description: description || '',
        estimatedHours: parsedEstimatedHours,
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

    console.log('更新されたタスク:', updatedTask);
    return NextResponse.json(updatedTask);
    
  } catch (error) {
    console.error('タスク更新エラー:', error);
    return NextResponse.json(
      { error: 'タスクの更新に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
