import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, companyId, divisionId, departmentId, groupId } = body;

    // バリデーション
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: '無効な権限が指定されています' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUsers = await prisma.user.findMany({
      where: { 
        email,
        ...(companyId && { companyId })
      },
    });

    if (existingUsers.length > 0) {
      const errorMessage = companyId 
        ? 'この会社でこのメールアドレスは既に使用されています'
        : 'このメールアドレスは既に使用されています';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーデータの準備
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    // 組織情報が指定されている場合は追加
    if (companyId) userData.companyId = companyId;
    if (divisionId) userData.divisionId = divisionId;
    if (departmentId) userData.departmentId = departmentId;
    if (groupId) userData.groupId = groupId;

    const user = await prisma.user.create({
      data: userData,
    });

    // パスワードを除外してレスポンス
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
