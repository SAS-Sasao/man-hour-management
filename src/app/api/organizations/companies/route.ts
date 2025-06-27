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
