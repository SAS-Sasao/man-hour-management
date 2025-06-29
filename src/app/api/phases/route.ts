import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createJSTTimestamp } from '@/utils/timezone';

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
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'プロジェクトIDは必須です' },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: '工程名は必須です' },
        { status: 400 }
      );
    }

    // プロジェクト存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      return NextResponse.json(
        { success: false, error: '指定されたプロジェクトが見つかりません' },
        { status: 400 }
      );
    }

    // 同じプロジェクト内で同じ名前の工程が存在しないかチェック
    const duplicatePhase = await prisma.phase.findFirst({
      where: {
        projectId,
        name: name.trim()
      }
    });

    if (duplicatePhase) {
      return NextResponse.json(
        { success: false, error: 'この工程名は既に使用されています' },
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
        name: name.trim(),
        description: description?.trim() || '',
        order: nextOrder,
        createdAt: createJSTTimestamp(),
        updatedAt: createJSTTimestamp(),
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
    return NextResponse.json({
      success: true,
      data: phase,
      message: '工程が作成されました'
    });
  } catch (error) {
    console.error('フェーズ作成エラー:', error);
    return NextResponse.json(
      { success: false, error: '工程の作成に失敗しました' },
      { status: 500 }
    );
  }
}
