import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';

const DEFAULT_PHASES = [
  { name: '要件定義', description: 'システムの要件を定義する工程' },
  { name: '基本設計', description: 'システムの基本的な設計を行う工程' },
  { name: '詳細設計', description: 'システムの詳細な設計を行う工程' },
  { name: '実装', description: 'システムの実装を行う工程' },
  { name: 'テスト', description: 'システムのテストを行う工程' },
  { name: '運用・保守', description: 'システムの運用・保守を行う工程' }
];

const DEFAULT_TASKS = [
  { name: '調査・分析', description: '現状調査と分析作業' },
  { name: '設計書作成', description: '設計書の作成作業' },
  { name: 'レビュー', description: '成果物のレビュー作業' },
  { name: 'プログラミング', description: 'プログラムの実装作業' },
  { name: 'テスト実行', description: 'テストの実行作業' },
  { name: 'ドキュメント作成', description: 'ドキュメントの作成作業' },
  { name: '会議・打ち合わせ', description: '会議や打ち合わせ' },
  { name: 'その他', description: 'その他の作業' }
];

export async function POST() {
  try {
    // 組織データを作成
    let company = await prisma.company.findFirst({
      where: { name: 'SAS株式会社' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'SAS株式会社',
          code: 'SAS001'
        }
      });
      console.log('会社が作成されました:', company.name);
    }

    let division = await prisma.division.findFirst({
      where: { name: 'システム開発事業部', companyId: company.id }
    });

    if (!division) {
      division = await prisma.division.create({
        data: {
          name: 'システム開発事業部',
          code: 'SYS001',
          companyId: company.id
        }
      });
      console.log('事業部が作成されました:', division.name);
    }

    let department = await prisma.department.findFirst({
      where: { name: '開発部', divisionId: division.id }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name: '開発部',
          code: 'DEV001',
          divisionId: division.id
        }
      });
      console.log('部署が作成されました:', department.name);
    }

    let group = await prisma.group.findFirst({
      where: { name: 'Webアプリケーション開発グループ', departmentId: department.id }
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Webアプリケーション開発グループ',
          code: 'WEB001',
          departmentId: department.id
        }
      });
      console.log('グループが作成されました:', group.name);
    }

    // 既存のユーザーをチェック（companyIdとemailの組み合わせで）
    let user = await prisma.user.findFirst({
      where: { 
        companyId: company.id,
        email: 'sasao@sas-com.com'
      }
    });

    if (!user) {
      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash('ts05140952', 10);

      // 初期ユーザー（笹尾 豊樹、管理者）を作成
      user = await prisma.user.create({
        data: {
          name: '笹尾 豊樹',
          email: 'sasao@sas-com.com',
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id,
          divisionId: division.id,
          departmentId: department.id,
          groupId: group.id,
        },
      });

      console.log('初期ユーザーが作成されました:', user.name);
    }

    // サンプルプロジェクトを作成（存在しない場合のみ）
    let project = await prisma.project.findFirst({
      where: { name: 'サンプルプロジェクト' }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'サンプルプロジェクト',
          description: 'デフォルトの工程とタスクを含むサンプルプロジェクト',
          startDate: new Date(),
          managerId: user.id,
          status: 'ACTIVE'
        }
      });

      console.log('サンプルプロジェクトが作成されました:', project.name);

      // デフォルト工程を作成
      const phases = [];
      for (let i = 0; i < DEFAULT_PHASES.length; i++) {
        const phaseData = DEFAULT_PHASES[i];
        const phase = await prisma.phase.create({
          data: {
            projectId: project.id,
            name: phaseData.name,
            description: phaseData.description,
            order: i + 1
          }
        });
        phases.push(phase);
      }

      // 各工程にデフォルトタスクを作成
      for (const phase of phases) {
        for (let j = 0; j < DEFAULT_TASKS.length; j++) {
          const taskData = DEFAULT_TASKS[j];
          await prisma.task.create({
            data: {
              phaseId: phase.id,
              projectId: project.id,
              name: taskData.name,
              description: taskData.description,
              estimatedHours: 0,
              order: j + 1
            }
          });
        }
      }

      console.log('デフォルトの工程・タスクが作成されました');
    }

    return NextResponse.json({
      success: true,
      message: '初期データの作成が完了しました',
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        project: { id: project.id, name: project.name }
      }
    });

  } catch (error) {
    console.error('初期データ作成エラー:', error);
    return NextResponse.json(
      { error: '初期データの作成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
