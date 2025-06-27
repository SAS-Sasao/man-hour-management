import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// グループ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: '部署IDは必須です' },
        { status: 400 }
      );
    }

    const groups = await prisma.group.findMany({
      where: { departmentId },
      orderBy: { code: 'asc' },
      include: {
        department: {
          include: {
            division: {
              include: {
                company: true
              }
            }
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('グループ一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'グループ一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// グループ作成
export async function POST(request: NextRequest) {
  try {
    const { departmentId, code, name, description } = await request.json();

    // バリデーション
    if (!departmentId || !code || !name) {
      return NextResponse.json(
        { success: false, error: '部署ID、グループコード、グループ名は必須です' },
        { status: 400 }
      );
    }

    // 部署内でのグループコード重複チェック
    const existingGroup = await prisma.group.findUnique({
      where: { 
        departmentId_code: {
          departmentId,
          code
        }
      }
    });

    if (existingGroup) {
      return NextResponse.json(
        { success: false, error: 'このグループコードは既に使用されています' },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
      data: {
        departmentId,
        code,
        name,
        description
      },
      include: {
        department: {
          include: {
            division: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: group,
      message: 'グループが作成されました'
    });
  } catch (error) {
    console.error('グループ作成エラー:', error);
    return NextResponse.json(
      { success: false, error: 'グループの作成に失敗しました' },
      { status: 500 }
    );
  }
}
