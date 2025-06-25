const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugDatabase() {
  console.log('=== データベース接続デバッグ開始 ===');
  
  try {
    console.log('1. 環境変数確認:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '設定済み' : '未設定');
    
    console.log('\n2. Prisma接続テスト...');
    await prisma.$connect();
    console.log('✓ Prisma接続成功');
    
    console.log('\n3. データベース状態確認...');
    
    // ユーザーテーブル確認
    try {
      const userCount = await prisma.user.count();
      console.log(`✓ ユーザーテーブル: ${userCount}件`);
      
      if (userCount > 0) {
        const users = await prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true }
        });
        console.log('ユーザー一覧:', users);
      }
    } catch (error) {
      console.error('✗ ユーザーテーブルエラー:', error.message);
    }
    
    // プロジェクトテーブル確認
    try {
      const projectCount = await prisma.project.count();
      console.log(`✓ プロジェクトテーブル: ${projectCount}件`);
      
      if (projectCount > 0) {
        const projects = await prisma.project.findMany({
          select: { id: true, name: true, status: true }
        });
        console.log('プロジェクト一覧:', projects);
      }
    } catch (error) {
      console.error('✗ プロジェクトテーブルエラー:', error.message);
    }
    
    // 時間入力テーブル確認
    try {
      const timeEntryCount = await prisma.timeEntry.count();
      console.log(`✓ 時間入力テーブル: ${timeEntryCount}件`);
      
      if (timeEntryCount > 0) {
        const timeEntries = await prisma.timeEntry.findMany({
          take: 5,
          select: { id: true, date: true, hours: true, description: true }
        });
        console.log('時間入力サンプル:', timeEntries);
      }
    } catch (error) {
      console.error('✗ 時間入力テーブルエラー:', error.message);
    }
    
    console.log('\n4. テストデータ作成試行...');
    try {
      // テストユーザー作成
      const testUser = await prisma.user.create({
        data: {
          name: 'テストユーザー',
          email: `test-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'MEMBER'
        }
      });
      console.log('✓ テストユーザー作成成功:', testUser.id);
      
      // テストプロジェクト作成
      const testProject = await prisma.project.create({
        data: {
          name: 'テストプロジェクト',
          description: 'データベーステスト用プロジェクト',
          startDate: new Date(),
          status: 'ACTIVE'
        }
      });
      console.log('✓ テストプロジェクト作成成功:', testProject.id);
      
      // 作成したテストデータを削除
      await prisma.project.delete({ where: { id: testProject.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('✓ テストデータ削除完了');
      
    } catch (error) {
      console.error('✗ テストデータ作成エラー:', error.message);
      console.error('詳細:', error);
    }
    
  } catch (error) {
    console.error('✗ データベース接続エラー:', error.message);
    console.error('詳細:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== デバッグ完了 ===');
  }
}

debugDatabase();
