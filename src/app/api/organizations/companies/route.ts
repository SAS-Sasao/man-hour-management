import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUser, canAccessCompany, canCreateCompany } from '../../../../utils/auth';
import { createJSTTimestamp } from '@/utils/timezone';

// 会社一覧取得
export async function GET(request: NextRequest) {
  try {
    // 開発環境では認証をバイパス
    const user = await getCurrentUser(request);
    
    // 権限に応じてデータを分離（認証がない場合は全データを返す）
    let whereClause = {};
    if (user) {
      if (user.role === 'ADMIN') {
        // 管理者は全会社を取得
        whereClause = {};
      } else if (user.role === 'MANAGER' && user.companyId) {
        // マネージャーは自分の所属会社のみ取得
        whereClause = { id: user.companyId };
      } else if (user.role === 'MEMBER') {
        // メンバーは閲覧のみ可能
        whereClause = {};
      }
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
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
        }
      }
    });

    // 各組織の人数を手動でカウント
    const companiesWithCounts = await Promise.all(
      companies.map(async (company: any) => {
        const companyUserCount = await prisma.user.count({
          where: { companyId: company.id }
        });

        const divisionsWithCounts = await Promise.all(
          company.divisions.map(async (division: any) => {
            const divisionUserCount = await prisma.user.count({
              where: { divisionId: division.id }
            });

            const departmentsWithCounts = await Promise.all(
              division.departments.map(async (department: any) => {
                const departmentUserCount = await prisma.user.count({
                  where: { departmentId: department.id }
                });

                const groupsWithCounts = await Promise.all(
                  department.groups.map(async (group: any) => {
                    const groupUserCount = await prisma.user.count({
                      where: { groupId: group.id }
                    });

                    return {
                      ...group,
                      _count: { users: groupUserCount }
                    };
                  })
                );

                return {
                  ...department,
                  groups: groupsWithCounts,
                  _count: { users: departmentUserCount }
                };
              })
            );

            return {
              ...division,
              departments: departmentsWithCounts,
              _count: { users: divisionUserCount }
            };
          })
        );

        return {
          ...company,
          divisions: divisionsWithCounts,
          _count: { users: companyUserCount }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: companiesWithCounts
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
    // 開発環境では認証をバイパス
    const user = await getCurrentUser(request);
    
    // 認証がある場合のみ権限チェック
    if (user && !canCreateCompany(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: 会社を作成する権限がありません' },
        { status: 403 }
      );
    }

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
        description,
        createdAt: createJSTTimestamp(),
        updatedAt: createJSTTimestamp(),
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
