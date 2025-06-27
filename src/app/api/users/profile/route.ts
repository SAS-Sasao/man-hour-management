import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

// プロフィール更新API
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      currentPassword, 
      newPassword, 
      companyId, 
      divisionId, 
      departmentId, 
      groupId 
    } = body;

    // JWTトークンからユーザーIDを取得
    const token = request.cookies.get('session-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as string;
      
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'セッションが無効です' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'セッションが無効です' },
        { status: 401 }
      );
    }

    // 現在のユーザー情報を取得
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        division: true,
        department: true,
        group: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 現在のパスワード確認（パスワード変更時のみ）
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { success: false, error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }
    }

    // メールアドレスの重複チェック（同じ会社内で）
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          companyId: currentUser.companyId,
          email: email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 組織の妥当性チェック
    if (companyId && companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: '会社の変更は許可されていません' },
        { status: 400 }
      );
    }

    if (divisionId) {
      const division = await prisma.division.findUnique({
        where: { id: divisionId },
      });
      if (!division || division.companyId !== currentUser.companyId) {
        return NextResponse.json(
          { success: false, error: '無効な事業部が選択されています' },
          { status: 400 }
        );
      }
    }

    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { division: true },
      });
      if (!department || department.division.companyId !== currentUser.companyId) {
        return NextResponse.json(
          { success: false, error: '無効な部署が選択されています' },
          { status: 400 }
        );
      }
    }

    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { department: { include: { division: true } } },
      });
      if (!group || group.department.division.companyId !== currentUser.companyId) {
        return NextResponse.json(
          { success: false, error: '無効なグループが選択されています' },
          { status: 400 }
        );
      }
    }

    // 更新データの準備
    const updateData: any = {};
    
    if (email) updateData.email = email;
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    if (divisionId !== undefined) updateData.divisionId = divisionId || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (groupId !== undefined) updateData.groupId = groupId || null;

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        company: true,
        division: true,
        department: true,
        group: true,
      },
    });

    // パスワードを除外してレスポンス
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'プロフィールが更新されました',
    });

  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    );
  }
}
