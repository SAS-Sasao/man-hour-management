import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: true,
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
      orderBy: [
        { projectId: 'asc' },
        { order: 'asc' },
      ],
    });
    
    return NextResponse.json(phases);
  } catch (error) {
    console.error('フェーズ取得エラー:', error);
    return NextResponse.json(
      { error: 'フェーズの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('フェーズ作成データ受信:', body);
    
    const { projectId, name, description } = body;

    // バリデーション
    if (!projectId || !name) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています', details: { projectId, name } },
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

    // 同じプロジェクト内での順序を決定
    const existingPhases = await prisma.phase.findMany({
      where: { projectId },
      orderBy: { order: 'desc' },
      take: 1
    });
    const nextOrder = existingPhases.length > 0 ? existingPhases[0].order + 1 : 1;

    const phase = await prisma.phase.create({
      data: {
        projectId,
        name,
        description: description || '',
        order: nextOrder,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: true,
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });

    console.log('作成されたフェーズ:', phase);
    return NextResponse.json(phase);
  } catch (error) {
    console.error('フェーズ作成エラー:', error);
    return NextResponse.json(
      { error: 'フェーズの作成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
