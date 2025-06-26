import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Phase更新 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // バリデーション
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: '工程名は必須です' },
        { status: 400 }
      );
    }

    // 既存のPhaseを確認
    const existingPhase = await prisma.phase.findUnique({
      where: { id }
    });

    if (!existingPhase) {
      return NextResponse.json(
        { success: false, error: '指定された工程が見つかりません' },
        { status: 404 }
      );
    }

    // 同じプロジェクト内で同じ名前の工程が存在しないかチェック（自分以外）
    const duplicatePhase = await prisma.phase.findFirst({
      where: {
        projectId: existingPhase.projectId,
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicatePhase) {
      return NextResponse.json(
        { success: false, error: 'この工程名は既に使用されています' },
        { status: 400 }
      );
    }

    // Phase更新
    const updatedPhase = await prisma.phase.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPhase,
      message: '工程が更新されました'
    });

  } catch (error) {
    console.error('Phase更新エラー:', error);
    return NextResponse.json(
      { success: false, error: '工程の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// Phase削除 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 既存のPhaseを確認
    const existingPhase = await prisma.phase.findUnique({
      where: { id },
      include: {
        tasks: true,
        timeEntries: true
      }
    });

    if (!existingPhase) {
      return NextResponse.json(
        { success: false, error: '指定された工程が見つかりません' },
        { status: 404 }
      );
    }

    // 関連するタスクや工数入力がある場合の確認
    if (existingPhase.tasks.length > 0 || existingPhase.timeEntries.length > 0) {
      // Cascade削除で関連データも削除される
      console.log(`工程「${existingPhase.name}」に関連するデータも削除されます:`, {
        tasks: existingPhase.tasks.length,
        timeEntries: existingPhase.timeEntries.length
      });
    }

    // Phase削除（Cascade削除により関連するタスクと工数入力も削除される）
    await prisma.phase.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '工程が削除されました'
    });

  } catch (error) {
    console.error('Phase削除エラー:', error);
    return NextResponse.json(
      { success: false, error: '工程の削除に失敗しました' },
      { status: 500 }
    );
  }
}

// Phase取得 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const phase = await prisma.phase.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          orderBy: { order: 'asc' }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!phase) {
      return NextResponse.json(
        { success: false, error: '指定された工程が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: phase
    });

  } catch (error) {
    console.error('Phase取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '工程の取得に失敗しました' },
      { status: 500 }
    );
  }
}
