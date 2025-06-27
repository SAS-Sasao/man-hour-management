const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PHASES = [
  { name: '要件定義', description: 'プロジェクトの要件を定義する工程' },
  { name: '基本設計', description: 'システムの基本設計を行う工程' },
  { name: '詳細設計', description: 'システムの詳細設計を行う工程' },
  { name: '実装', description: 'システムの実装を行う工程' },
  { name: 'テスト', description: 'システムのテストを行う工程' },
  { name: 'リリース', description: 'システムのリリースを行う工程' }
];

const DEFAULT_TASKS = [
  { name: '調査・分析', description: '現状調査と分析を行う' },
  { name: '設計・開発', description: '設計と開発を行う' },
  { name: 'レビュー', description: 'レビューを行う' },
  { name: 'テスト', description: 'テストを行う' },
  { name: 'ドキュメント作成', description: 'ドキュメントを作成する' }
];

async function main() {
  console.log('🏢 組織マスタとユーザーデータの作成を開始します...');

  // 1. 会社作成
  const sasCompany = await prisma.company.upsert({
    where: { code: '00001' },
    update: {},
    create: {
      code: '00001',
      name: 'SAS株式会社',
      description: 'システム開発・クラウドサービス会社'
    }
  });
  console.log(`✅ 会社作成: ${sasCompany.name} (${sasCompany.code})`);

  // 2. SI事業部作成
  const siDivision = await prisma.division.upsert({
    where: { 
      companyId_code: {
        companyId: sasCompany.id,
        code: 'SI'
      }
    },
    update: {},
    create: {
      companyId: sasCompany.id,
      code: 'SI',
      name: 'SI事業部',
      description: 'システムインテグレーション事業'
    }
  });

  // 3. クラウド事業部作成
  const cloudDivision = await prisma.division.upsert({
    where: { 
      companyId_code: {
        companyId: sasCompany.id,
        code: 'CLOUD'
      }
    },
    update: {},
    create: {
      companyId: sasCompany.id,
      code: 'CLOUD',
      name: 'クラウド事業部',
      description: 'クラウドサービス事業'
    }
  });

  console.log(`✅ 事業部作成: ${siDivision.name}, ${cloudDivision.name}`);

  // 4. SI事業部の部署作成
  const distDepartment = await prisma.department.upsert({
    where: {
      divisionId_code: {
        divisionId: siDivision.id,
        code: 'DIST'
      }
    },
    update: {},
    create: {
      divisionId: siDivision.id,
      code: 'DIST',
      name: '流通サービス部',
      description: '流通・小売業向けシステム開発'
    }
  });

  const finDepartment = await prisma.department.upsert({
    where: {
      divisionId_code: {
        divisionId: siDivision.id,
        code: 'FIN'
      }
    },
    update: {},
    create: {
      divisionId: siDivision.id,
      code: 'FIN',
      name: '金融サービス部',
      description: '金融業向けシステム開発'
    }
  });

  const solDepartment = await prisma.department.upsert({
    where: {
      divisionId_code: {
        divisionId: siDivision.id,
        code: 'SOL'
      }
    },
    update: {},
    create: {
      divisionId: siDivision.id,
      code: 'SOL',
      name: 'ソリューション開発部',
      description: 'パッケージソリューション開発'
    }
  });

  // 5. クラウド事業部の部署作成
  const hrDepartment = await prisma.department.upsert({
    where: {
      divisionId_code: {
        divisionId: cloudDivision.id,
        code: 'HR'
      }
    },
    update: {},
    create: {
      divisionId: cloudDivision.id,
      code: 'HR',
      name: 'HRサービス部',
      description: '人事・労務管理サービス開発'
    }
  });

  console.log(`✅ 部署作成: 流通サービス部, 金融サービス部, ソリューション開発部, HRサービス部`);

  // 6. 通販サービスGr作成
  const ecGroup = await prisma.group.upsert({
    where: {
      departmentId_code: {
        departmentId: distDepartment.id,
        code: 'EC'
      }
    },
    update: {},
    create: {
      departmentId: distDepartment.id,
      code: 'EC',
      name: '通販サービスGr',
      description: 'ECサイト・通販システム開発'
    }
  });

  console.log(`✅ グループ作成: ${ecGroup.name}`);

  // 7. 既存ユーザーの更新または作成
  const hashedPassword = await bcrypt.hash('ts05140952', 10);
  
  const sasaoUser = await prisma.user.upsert({
    where: { 
      companyId_email: {
        companyId: sasCompany.id,
        email: 'sasao@sas-com.com'
      }
    },
    update: {
      companyId: sasCompany.id,
      divisionId: siDivision.id,
      departmentId: distDepartment.id,
      groupId: ecGroup.id
    },
    create: {
      name: '笹尾 豊樹',
      email: 'sasao@sas-com.com',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: sasCompany.id,
      divisionId: siDivision.id,
      departmentId: distDepartment.id,
      groupId: ecGroup.id
    }
  });

  console.log(`✅ ユーザー作成/更新: ${sasaoUser.name}`);
  console.log(`📋 ログイン情報:`);
  console.log(`   会社コード: ${sasCompany.code}`);
  console.log(`   メールアドレス: ${sasaoUser.email}`);
  console.log(`   パスワード: ts05140952`);
  console.log(`   所属: ${sasCompany.name} > ${siDivision.name} > ${distDepartment.name} > ${ecGroup.name}`);

  // 8. サンプルプロジェクトを作成（存在しない場合のみ）
  const existingProject = await prisma.project.findFirst({
    where: { name: 'サンプルプロジェクト' }
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        name: 'サンプルプロジェクト',
        description: 'デフォルトの工程とタスクを含むサンプルプロジェクト',
        startDate: new Date(),
        managerId: sasaoUser.id,
        status: 'ACTIVE'
      }
    });

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

    console.log('✅ サンプルプロジェクトとデフォルトの工程・タスクが作成されました');
  } else {
    console.log('ℹ️ サンプルプロジェクトは既に存在します');
  }

  console.log('🎉 組織マスタとユーザーデータの作成が完了しました！');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
