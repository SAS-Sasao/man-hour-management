import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const { companyCode, email, password } = await request.json();

    // バリデーション
    if (!companyCode || !email || !password) {
      return NextResponse.json(
        { success: false, error: '会社コード、メールアドレス、パスワードは必須です' },
        { status: 400 }
      );
    }

    // 会社コードから会社を検索
    const company = await prisma.company.findUnique({
      where: { code: companyCode }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: '会社コードが正しくありません' },
        { status: 401 }
      );
    }

    // 会社内でユーザーを検索（組織情報も含めて取得）
    const user = await prisma.user.findUnique({
      where: { 
        companyId_email: {
          companyId: company.id,
          email: email
        }
      },
      include: {
        company: true,
        division: true,
        department: true,
        group: true
      }
    });

    console.log('データベースから取得したユーザー情報:', user);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワードを検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワードを除外してユーザー情報を準備
    const { password: _, ...userWithoutPassword } = user;

    // JWTトークンを作成（7日間有効）- 会社情報も含める
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyCode: company.code
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // HTTPOnlyクッキーとしてセット
    const cookieStore = await cookies();
    cookieStore.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7日間
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: `${company.name}にログインしました`
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { success: false, error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
