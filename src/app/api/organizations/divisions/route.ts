import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// 事業部一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: '会社IDは必須です' },
        { status: 400 }
      );
    }

    const divisions = await prisma.division.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
      include: {
        company: true,
        departments: {
          include: {
            groups: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: divisions
    });
  } catch (error) {
    console.error('事業部一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '事業部一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 事業部作成
export async function POST(request: NextRequest) {
  try {
    const { companyId, code, name, description } = await request.json();

    // バリデーション
    if (!companyId || !code || !name) {
      return NextResponse.json(
        { success: false, error: '会社ID、事業部コード、事業部名は必須です' },
        { status: 400 }
      );
    }

    // 会社内での事業部コード重複チェック
    const existingDivision = await prisma.division.findUnique({
      where: { 
        companyId_code: {
          companyId,
          code
        }
      }
    });

    if (existingDivision) {
      return NextResponse.json(
        { success: false, error: 'この事業部コードは既に使用されています' },
        { status: 400 }
      );
    }

    const division = await prisma.division.create({
      data: {
        companyId,
        code,
        name,
        description
      },
      include: {
        company: true
      }
    });

    return NextResponse.json({
      success: true,
      data: division,
      message: '事業部が作成されました'
    });
  } catch (error) {
    console.error('事業部作成エラー:', error);
    return NextResponse.json(
      { success: false, error: '事業部の作成に失敗しました' },
      { status: 500 }
    );
  }
}
