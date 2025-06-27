import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// 部署一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const divisionId = searchParams.get('divisionId');

    if (!divisionId) {
      return NextResponse.json(
        { success: false, error: '事業部IDは必須です' },
        { status: 400 }
      );
    }

    const departments = await prisma.department.findMany({
      where: { divisionId },
      orderBy: { code: 'asc' },
      include: {
        division: {
          include: {
            company: true
          }
        },
        groups: true,
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('部署一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '部署一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 部署作成
export async function POST(request: NextRequest) {
  try {
    const { divisionId, code, name, description } = await request.json();

    // バリデーション
    if (!divisionId || !code || !name) {
      return NextResponse.json(
        { success: false, error: '事業部ID、部署コード、部署名は必須です' },
        { status: 400 }
      );
    }

    // 事業部内での部署コード重複チェック
    const existingDepartment = await prisma.department.findUnique({
      where: { 
        divisionId_code: {
          divisionId,
          code
        }
      }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'この部署コードは既に使用されています' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        divisionId,
        code,
        name,
        description
      },
      include: {
        division: {
          include: {
            company: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: department,
      message: '部署が作成されました'
    });
  } catch (error) {
    console.error('部署作成エラー:', error);
    return NextResponse.json(
      { success: false, error: '部署の作成に失敗しました' },
      { status: 500 }
    );
  }
}
