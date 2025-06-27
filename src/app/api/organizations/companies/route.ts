import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// 会社一覧取得
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { code: 'asc' },
      include: {
        divisions: {
          include: {
            departments: {
              include: {
                groups: true
              }
            }
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('会社一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '会社一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 会社作成
export async function POST(request: NextRequest) {
  try {
    const { code, name, description } = await request.json();

    // バリデーション
    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: '会社コードと会社名は必須です' },
        { status: 400 }
      );
    }

    // 会社コード重複チェック
    const existingCompany = await prisma.company.findUnique({
      where: { code }
    });

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: 'この会社コードは既に使用されています' },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        code,
        name,
        description
      }
    });

    return NextResponse.json({
      success: true,
      data: company,
      message: '会社が作成されました'
    });
  } catch (error) {
    console.error('会社作成エラー:', error);
    return NextResponse.json(
      { success: false, error: '会社の作成に失敗しました' },
      { status: 500 }
    );
  }
}
