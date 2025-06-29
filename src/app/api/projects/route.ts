import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
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
            tasks: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, startDate, endDate, managerId, managerIds, memberIds, status, currentUserId } = body;

    // 権限チェック：メンバー権限のユーザーはプロジェクトを作成できない
    if (currentUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId }
      });

      if (currentUser && currentUser.role === 'MEMBER') {
        return NextResponse.json(
          { success: false, error: 'メンバー権限ではプロジェクトを作成できません' },
          { status: 403 }
        );
      }
    }

    // バリデーション
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'プロジェクト名は必須です' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { success: false, error: '開始日は必須です' },
        { status: 400 }
      );
    }

    if (!managerId) {
      return NextResponse.json(
        { success: false, error: 'プロジェクトマネージャーは必須です' },
        { status: 400 }
      );
    }

    // 日付バリデーション
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { success: false, error: '開始日の形式が正しくありません' },
        { status: 400 }
      );
    }

    if (end && isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: '終了日の形式が正しくありません' },
        { status: 400 }
      );
    }

    if (end && start > end) {
      return NextResponse.json(
        { success: false, error: '終了日は開始日より後の日付を指定してください' },
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
          { success: false, error: '指定されたマネージャーが見つかりません' },
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
          { success: false, error: '指定されたマネージャーの一部が見つかりません' },
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
          { success: false, error: '指定されたメンバーの一部が見つかりません' },
          { status: 400 }
        );
      }
    }

    // 同名プロジェクトの重複チェック
    const existingProject = await prisma.project.findFirst({
      where: { name: name.trim() }
    });

    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'このプロジェクト名は既に使用されています' },
        { status: 400 }
      );
    }

    // トランザクションでプロジェクトとリレーションを作成
    const result = await prisma.$transaction(async (tx: any) => {
      // プロジェクトを作成
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          startDate: start,
          endDate: end,
          managerId, // 後方互換性のため残す
          status: status || 'ACTIVE',
        },
      });

      // プロジェクトマネージャーを追加
      if (managerIds && managerIds.length > 0) {
        await tx.projectManager.createMany({
          data: managerIds.map((userId: string) => ({
            projectId: project.id,
            userId: userId,
          })),
        });
      }

      // プロジェクトメンバーを追加
      if (memberIds && memberIds.length > 0) {
        await tx.projectMember.createMany({
          data: memberIds.map((userId: string) => ({
            projectId: project.id,
            userId: userId,
          })),
        });
      }

      // 作成されたプロジェクトを関連データと一緒に取得
      const projectWithRelations = await tx.project.findUnique({
        where: { id: project.id },
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
        },
      });

      return projectWithRelations;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'プロジェクトが作成されました'
    });
  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
    return NextResponse.json(
      { success: false, error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    );
  }
}
