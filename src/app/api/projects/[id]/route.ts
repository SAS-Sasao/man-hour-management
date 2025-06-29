import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { parseJSTDate, createJSTTimestamp } from '@/utils/timezone';

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
        },
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
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
    const { name, description, startDate, endDate, status, managerId, managerIds, memberIds } = body;

    // バリデーション
    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'プロジェクト名と開始日は必須です' },
        { status: 400 }
      );
    }

    // 日付の妥当性チェック
    const start = parseJSTDate(startDate);
    const end = endDate ? parseJSTDate(endDate) : null;

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

    // マネージャーの存在確認（後方互換性のため）
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

    // 複数マネージャーの存在確認
    if (managerIds && managerIds.length > 0) {
      const managers = await prisma.user.findMany({
        where: { id: { in: managerIds } }
      });

      if (managers.length !== managerIds.length) {
        return NextResponse.json(
          { error: '指定されたマネージャーの一部が見つかりません' },
          { status: 400 }
        );
      }

      // マネージャー権限チェック
      const invalidManagers = managers.filter((m: any) => m.role !== 'ADMIN' && m.role !== 'MANAGER');
      if (invalidManagers.length > 0) {
        return NextResponse.json(
          { error: 'マネージャーには管理者またはマネージャー権限が必要です' },
          { status: 400 }
        );
      }
    }

    // 複数メンバーの存在確認
    if (memberIds && memberIds.length > 0) {
      const members = await prisma.user.findMany({
        where: { id: { in: memberIds } }
      });

      if (members.length !== memberIds.length) {
        return NextResponse.json(
          { error: '指定されたメンバーの一部が見つかりません' },
          { status: 400 }
        );
      }
    }

    // プロジェクト更新を段階的に実行
    const updatedProject = await prisma.$transaction(async (tx: any) => {
      // 既存のプロジェクトを取得
      const existingProject = await tx.project.findUnique({
        where: { id }
      });

      if (!existingProject) {
        throw new Error('プロジェクトが見つかりません');
      }

      // 1. プロジェクト基本情報を更新
      await tx.project.update({
        where: { id },
        data: {
          name,
          description,
          startDate: start,
          endDate: end,
          status,
          managerId: managerId || null,
          updatedAt: createJSTTimestamp(),
        }
      });

      // 2. 既存のマネージャー・メンバー関係を削除
      await tx.projectManager.deleteMany({
        where: { projectId: id }
      });

      await tx.projectMember.deleteMany({
        where: { projectId: id }
      });

      // 3. 新しいマネージャー関係を作成
      if (managerIds && managerIds.length > 0) {
        for (let i = 0; i < managerIds.length; i++) {
          await tx.projectManager.create({
            data: {
              projectId: id,
              userId: managerIds[i],
              role: i === 0 ? 'PRIMARY' : 'SECONDARY'
            }
          });
        }
      }

      // 4. 新しいメンバー関係を作成
      if (memberIds && memberIds.length > 0) {
        for (const userId of memberIds) {
          await tx.projectMember.create({
            data: {
              projectId: id,
              userId,
              role: 'MEMBER'
            }
          });
        }
      }

      // 5. 更新されたプロジェクトを関連データと共に取得
      return await tx.project.findUnique({
        where: { id },
        include: {
          managers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          phases: {
            include: {
              tasks: true
            }
          }
        }
      });
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
    await prisma.$transaction(async (tx: any) => {
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

      // プロジェクトマネージャー・メンバー関係を削除
      await tx.projectManager.deleteMany({
        where: { projectId: id }
      });

      await tx.projectMember.deleteMany({
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
