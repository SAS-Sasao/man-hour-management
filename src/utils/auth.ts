import { NextRequest } from 'next/server';
import { prisma } from '../../lib/prisma';
import { User } from '../types';

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    // セッションからユーザーIDを取得（実際の実装に合わせて調整）
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return null;
    }

    // セッションからユーザー情報を取得
    // 実際の実装では、セッションストアからユーザーIDを取得する
    // ここでは簡単な実装として、cookieから直接ユーザーIDを取得
    const sessionData = JSON.parse(sessionCookie.value);
    const userId = sessionData.userId;

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        division: true,
        department: true,
        group: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as 'ADMIN' | 'MANAGER' | 'MEMBER',
      companyId: user.companyId || undefined,
      divisionId: user.divisionId || undefined,
      departmentId: user.departmentId || undefined,
      groupId: user.groupId || undefined,
      company: user.company ? {
        id: user.company.id,
        code: user.company.code,
        name: user.company.name,
        description: user.company.description || undefined,
        createdAt: user.company.createdAt,
        updatedAt: user.company.updatedAt
      } : undefined,
      division: user.division ? {
        id: user.division.id,
        companyId: user.division.companyId,
        code: user.division.code,
        name: user.division.name,
        description: user.division.description || undefined,
        createdAt: user.division.createdAt,
        updatedAt: user.division.updatedAt
      } : undefined,
      department: user.department ? {
        id: user.department.id,
        divisionId: user.department.divisionId,
        code: user.department.code,
        name: user.department.name,
        description: user.department.description || undefined,
        createdAt: user.department.createdAt,
        updatedAt: user.department.updatedAt
      } : undefined,
      group: user.group ? {
        id: user.group.id,
        departmentId: user.group.departmentId,
        code: user.group.code,
        name: user.group.name,
        description: user.group.description || undefined,
        createdAt: user.group.createdAt,
        updatedAt: user.group.updatedAt
      } : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('ユーザー認証エラー:', error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return handler(request, user);
  };
}

export function requireRole(roles: ('ADMIN' | 'MANAGER' | 'MEMBER')[]) {
  return (handler: (request: NextRequest, user: User) => Promise<Response>) => {
    return async (request: NextRequest) => {
      const user = await getCurrentUser(request);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (!roles.includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return handler(request, user);
    };
  };
}

export function canAccessCompany(user: User, companyId: string): boolean {
  if (user.role === 'ADMIN') {
    return true; // 管理者は全会社にアクセス可能
  }
  
  if (user.role === 'MANAGER' && user.companyId === companyId) {
    return true; // マネージャーは自分の所属会社にアクセス可能
  }
  
  return false;
}

export function canEditCompany(user: User, companyId: string): boolean {
  if (user.role === 'ADMIN') {
    return true; // 管理者は全会社を編集可能
  }
  
  if (user.role === 'MANAGER' && user.companyId === companyId) {
    return true; // マネージャーは自分の所属会社を編集可能
  }
  
  return false;
}

export function canCreateCompany(user: User): boolean {
  return user.role === 'ADMIN'; // 管理者のみ会社作成可能
}
