import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getCurrentUser, canEditCompany } from '../../../../../utils/auth';

// 会社更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 開発環境では認証をバイパス
    const user = await getCurrentUser(request);
    const companyId = params.id;

    // 認証がある場合のみ権限チェック
    if (user && !canEditCompany(user, companyId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: この会社を編集する権限がありません' },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    // バリデーション
    if (!name) {
      return NextResponse.json(
        { success: false, error: '会社名は必須です' },
        { status: 400 }
      );
    }

    // 会社の存在確認
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: '会社が見つかりません' },
        { status: 404 }
      );
    }

    // 会社更新（コードは変更不可）
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        description
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      message: '会社情報が更新されました'
    });
  } catch (error) {
    console.error('会社更新エラー:', error);
    return NextResponse.json(
      { success: false, error: '会社の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 会社削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 開発環境では認証をバイパス
    const user = await getCurrentUser(request);

    // 認証がある場合のみ権限チェック（管理者のみ削除可能）
    if (user && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: 会社を削除する権限がありません' },
        { status: 403 }
      );
    }

    const companyId = params.id;

    // 会社の存在確認
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        divisions: {
          include: {
            departments: {
              include: {
                groups: true
              }
            }
          }
        }
      }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: '会社が見つかりません' },
        { status: 404 }
      );
    }

    // 関連ユーザーの確認
    const relatedUsers = await prisma.user.count({
      where: { companyId: companyId }
    });

    if (relatedUsers > 0) {
      return NextResponse.json(
        { success: false, error: 'この会社にはユーザーが所属しているため削除できません' },
        { status: 400 }
      );
    }

    // トランザクションで関連データを削除
    await prisma.$transaction(async (tx) => {
      // グループを削除
      for (const division of existingCompany.divisions) {
        for (const department of division.departments) {
          await tx.group.deleteMany({
            where: { departmentId: department.id }
          });
        }
        // 部署を削除
        await tx.department.deleteMany({
          where: { divisionId: division.id }
        });
      }
      
      // 事業部を削除
      await tx.division.deleteMany({
        where: { companyId: companyId }
      });
      
      // 会社を削除
      await tx.company.delete({
        where: { id: companyId }
      });
    });

    return NextResponse.json({
      success: true,
      message: '会社が削除されました'
    });
  } catch (error) {
    console.error('会社削除エラー:', error);
    return NextResponse.json(
      { success: false, error: '会社の削除に失敗しました' },
      { status: 500 }
    );
  }
}

// 会社詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 開発環境では認証をバイパス
    const user = await getCurrentUser(request);
    const companyId = params.id;

    // 認証がある場合のみアクセス権限チェック
    if (user && user.role !== 'ADMIN' && user.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: この会社にアクセスする権限がありません' },
        { status: 403 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        divisions: {
          include: {
            departments: {
              include: {
                groups: true
              }
            }
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: '会社が見つかりません' },
        { status: 404 }
      );
    }

    // ユーザー数をカウント
    const userCount = await prisma.user.count({
      where: { companyId: companyId }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        _count: { users: userCount }
      }
    });
  } catch (error) {
    console.error('会社詳細取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '会社詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}
