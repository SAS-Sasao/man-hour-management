import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { parseJSTDate, createJSTTimestamp } from '@/utils/timezone';

export async function GET() {
  try {
    const timeEntries = await prisma.timeEntry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('時間入力取得エラー:', error);
    return NextResponse.json(
      { error: '時間入力の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('受信したデータ:', body);
    
    const { userId, projectId, phaseId, taskId, date, hours, description } = body;

    // 基本バリデーション
    if (!userId || !projectId || !phaseId || !taskId || !date || !hours) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています', details: { userId, projectId, phaseId, taskId, date, hours } },
        { status: 400 }
      );
    }

    // 数値バリデーション
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      return NextResponse.json(
        { error: '作業時間は0より大きい数値である必要があります' },
        { status: 400 }
      );
    }

    // 外部キー存在確認
    console.log('外部キー存在確認開始...');
    
    // ユーザー存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return NextResponse.json(
        { error: '指定されたユーザーが見つかりません', userId },
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
        { error: '指定された工程が見つかりません', phaseId },
        { status: 400 }
      );
    }
    if (phase.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定された工程は選択されたプロジェクトに属していません', phaseId, projectId },
        { status: 400 }
      );
    }

    // タスク存在確認とフェーズとの関連確認
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    if (!task) {
      return NextResponse.json(
        { error: '指定された作業が見つかりません', taskId },
        { status: 400 }
      );
    }
    if (task.phaseId !== phaseId) {
      return NextResponse.json(
        { error: '指定された作業は選択された工程に属していません', taskId, phaseId },
        { status: 400 }
      );
    }
    if (task.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定された作業は選択されたプロジェクトに属していません', taskId, projectId },
        { status: 400 }
      );
    }

    console.log('外部キー存在確認完了 - すべて有効');

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        phaseId,
        taskId,
        date: parseJSTDate(date),
        hours: parsedHours,
        description: description || '',
        createdAt: createJSTTimestamp(),
        updatedAt: createJSTTimestamp(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('作成された時間入力:', timeEntry);
    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error('時間入力作成エラー:', error);
    
    // Prismaエラーの詳細処理
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'データの整合性エラー: 関連するデータが見つかりません', details: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: '時間入力の作成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
