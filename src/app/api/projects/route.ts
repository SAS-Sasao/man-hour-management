import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
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
    const { name, description, startDate, endDate, managerId, status } = body;

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

    // マネージャーの存在確認
    const manager = await prisma.user.findUnique({
      where: { id: managerId }
    });

    if (!manager) {
      return NextResponse.json(
        { success: false, error: '指定されたマネージャーが見つかりません' },
        { status: 400 }
      );
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

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        startDate: start,
        endDate: end,
        managerId,
        status: status || 'ACTIVE',
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
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
