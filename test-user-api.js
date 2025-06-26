const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

async function testUserAPI() {
  console.log('🧪 ユーザーAPI テスト開始\n');

  try {
    // 1. ユーザー一覧取得テスト
    console.log('1. ユーザー一覧取得テスト');
    const getUsersResponse = await fetch(`${BASE_URL}/api/users`);
    const users = await getUsersResponse.json();
    console.log('✅ ユーザー一覧取得成功:', users.length, '件');
    console.log('現在のユーザー:', users.map(u => `${u.name} (${u.email})`).join(', '));
    console.log('');

    // 2. 新規ユーザー作成テスト
    console.log('2. 新規ユーザー作成テスト');
    const newUserData = {
      name: 'テスト太郎',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'MEMBER'
    };

    const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUserData),
    });

    if (createUserResponse.ok) {
      const newUser = await createUserResponse.json();
      console.log('✅ ユーザー作成成功:', newUser.name, newUser.email);
      
      // 3. ユーザー更新テスト
      console.log('3. ユーザー更新テスト');
      const updateData = {
        name: 'テスト太郎（更新済み）',
        email: 'test-updated@example.com',
        role: 'MANAGER'
      };

      const updateUserResponse = await fetch(`${BASE_URL}/api/users/${newUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (updateUserResponse.ok) {
        const updatedUser = await updateUserResponse.json();
        console.log('✅ ユーザー更新成功:', updatedUser.name, updatedUser.email, updatedUser.role);
      } else {
        const error = await updateUserResponse.json();
        console.log('❌ ユーザー更新失敗:', error.error);
      }

      // 4. 個別ユーザー取得テスト
      console.log('4. 個別ユーザー取得テスト');
      const getUserResponse = await fetch(`${BASE_URL}/api/users/${newUser.id}`);
      if (getUserResponse.ok) {
        const user = await getUserResponse.json();
        console.log('✅ 個別ユーザー取得成功:', user.name, user.email);
      } else {
        const error = await getUserResponse.json();
        console.log('❌ 個別ユーザー取得失敗:', error.error);
      }

      // 5. ユーザー削除テスト
      console.log('5. ユーザー削除テスト');
      const deleteUserResponse = await fetch(`${BASE_URL}/api/users/${newUser.id}`, {
        method: 'DELETE',
      });

      if (deleteUserResponse.ok) {
        const result = await deleteUserResponse.json();
        console.log('✅ ユーザー削除成功:', result.message);
      } else {
        const error = await deleteUserResponse.json();
        console.log('❌ ユーザー削除失敗:', error.error);
      }

    } else {
      const error = await createUserResponse.json();
      console.log('❌ ユーザー作成失敗:', error.error);
    }

    // 6. バリデーションテスト
    console.log('6. バリデーションテスト');
    
    // 短いパスワードでテスト
    const invalidUserData = {
      name: 'バリデーションテスト',
      email: 'validation@example.com',
      password: '123', // 短すぎるパスワード
      role: 'MEMBER'
    };

    const validationResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidUserData),
    });

    if (!validationResponse.ok) {
      const error = await validationResponse.json();
      console.log('✅ バリデーション正常動作:', error.error);
    } else {
      console.log('❌ バリデーションが機能していません');
    }

    // 7. 重複メールアドレステスト
    console.log('7. 重複メールアドレステスト');
    
    // 最初のユーザーを作成
    const firstUser = {
      name: '重複テスト1',
      email: 'duplicate@example.com',
      password: 'password123',
      role: 'MEMBER'
    };

    const firstUserResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firstUser),
    });

    if (firstUserResponse.ok) {
      const createdUser = await firstUserResponse.json();
      
      // 同じメールアドレスで2番目のユーザーを作成試行
      const duplicateUser = {
        name: '重複テスト2',
        email: 'duplicate@example.com', // 同じメールアドレス
        password: 'password123',
        role: 'MEMBER'
      };

      const duplicateResponse = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateUser),
      });

      if (!duplicateResponse.ok) {
        const error = await duplicateResponse.json();
        console.log('✅ 重複チェック正常動作:', error.error);
      } else {
        console.log('❌ 重複チェックが機能していません');
      }

      // クリーンアップ
      await fetch(`${BASE_URL}/api/users/${createdUser.id}`, {
        method: 'DELETE',
      });
    }

    console.log('\n🎉 ユーザーAPI テスト完了');

  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error.message);
  }
}

// テスト実行
testUserAPI();
