import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// プロジェクト取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: true,
        phases: {
          include: {
            tasks: true
          }
        },
        timeEntries: {
          include: {
            user: true,
            phase: true,
            task: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクト更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, startDate, endDate, status, managerId } = body;

    // バリデーション
    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'プロジェクト名と開始日は必須です' },
        { status: 400 }
      );
    }

    // 日付の妥当性チェック
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: '開始日の形式が正しくありません' },
        { status: 400 }
      );
    }

    if (end && isNaN(end.getTime())) {
      return NextResponse.json(
        { error: '終了日の形式が正しくありません' },
        { status: 400 }
      );
    }

    if (end && end <= start) {
      return NextResponse.json(
        { error: '終了日は開始日より後の日付を設定してください' },
        { status: 400 }
      );
    }

    // マネージャーの存在確認
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager) {
        return NextResponse.json(
          { error: '指定されたマネージャーが見つかりません' },
          { status: 400 }
        );
      }

      if (manager.role !== 'ADMIN' && manager.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'マネージャーには管理者またはマネージャー権限が必要です' },
          { status: 400 }
        );
      }
    }

    // プロジェクト更新
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        startDate: start,
        endDate: end,
        status,
        managerId: managerId || null
      },
      include: {
        manager: true,
        phases: {
          include: {
            tasks: true
          }
        }
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクト削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // プロジェクトの存在確認
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        phases: {
          include: {
            tasks: true
          }
        },
        timeEntries: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    // 関連データを含めて削除（トランザクション使用）
    await prisma.$transaction(async (tx) => {
      // 時間入力を削除
      await tx.timeEntry.deleteMany({
        where: { projectId: id }
      });

      // タスクを削除
      for (const phase of project.phases) {
        await tx.task.deleteMany({
          where: { phaseId: phase.id }
        });
      }

      // 工程を削除
      await tx.phase.deleteMany({
        where: { projectId: id }
      });

      // プロジェクトを削除
      await tx.project.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      message: 'プロジェクトが正常に削除されました',
      deletedProject: {
        id: project.id,
        name: project.name
      }
    });
  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    );
  }
}
