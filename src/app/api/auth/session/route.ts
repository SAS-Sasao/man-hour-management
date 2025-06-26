import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

// セッション作成（ログイン時）
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // JWTトークンを作成（7日間有効）
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      role: user.role 
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
      data: user,
      message: 'セッションが作成されました'
    });
  } catch (error) {
    console.error('セッション作成エラー:', error);
    return NextResponse.json(
      { success: false, error: 'セッション作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// セッション確認（認証状態チェック）
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'セッションが見つかりません' },
        { status: 401 }
      );
    }

    // JWTトークンを検証
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      // ユーザーが存在しない場合はセッションを削除
      const cookieStore = await cookies();
      cookieStore.delete('session-token');
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'セッションが有効です'
    });
  } catch (error) {
    console.error('セッション確認エラー:', error);
    
    // トークンが無効な場合はセッションを削除
    const cookieStore = await cookies();
    cookieStore.delete('session-token');
    
    return NextResponse.json(
      { success: false, error: 'セッションが無効です' },
      { status: 401 }
    );
  }
}

// セッション削除（ログアウト時）
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session-token');

    return NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    });
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return NextResponse.json(
      { success: false, error: 'ログアウト中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
