'use client';

import { useApp } from '../contexts/AppContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserDropdownMenu from './UserDropdownMenu';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // セッション削除APIを呼び出し
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      
      // ローカルストレージもクリア
      localStorage.removeItem('manhour-current-user');
      
      // 状態をクリア
      dispatch({ type: 'SET_CURRENT_USER', payload: null });
      
      // ログアウト後はログインページにリダイレクト
      window.location.href = '/login';
      
      console.log('ログアウトしました');
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました:', error);
      // エラーが発生してもローカル状態はクリア
      localStorage.removeItem('manhour-current-user');
      dispatch({ type: 'SET_CURRENT_USER', payload: null });
      window.location.href = '/login';
    }
  };

  // モバイルメニューを閉じる
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ナビゲーションリンククリック時にモバイルメニューを閉じる
  const handleNavClick = () => {
    closeMobileMenu();
  };

  // ESCキーでモバイルメニューを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: '📊' },
    { name: 'プロジェクト', href: '/projects', icon: '📋' },
    { name: '工数入力', href: '/time-entry', icon: '⏰' },
    { name: 'レポート', href: '/reports', icon: '📈' },
    ...(state.currentUser?.role === 'ADMIN' ? [
      { name: '組織管理', href: '/organizations', icon: '🏢' },
      { name: 'ユーザー管理', href: '/users', icon: '👥' }
    ] : []),
  ];

  // セッションチェックが完了していない場合はローディング表示
  if (!state.isSessionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="text-gray-600">セッションを確認中...</p>
        </div>
      </div>
    );
  }

  // ログインページの場合は認証チェックをスキップ
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 認証が必要なページで未認証の場合
  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⏱️</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                工数管理システム
              </h1>
              <p className="text-gray-600 mt-2">効率的なプロジェクト管理を実現</p>
            </div>
            <div className="space-y-4">
              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 text-center block transition-all duration-200 shadow-lg font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 text-center block transition-all duration-200 shadow-lg font-medium"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {/* ハンバーガーメニューボタン（モバイルのみ） */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden mr-3 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
                  aria-label="メニューを開く"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">⏱️</div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    工数管理
                  </h1>
                </div>
              </div>
              
              {/* デスクトップナビゲーション */}
              <div className="hidden md:ml-8 md:flex md:space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    } rounded-xl px-4 py-2 font-medium text-sm inline-flex items-center space-x-2 transition-all duration-200`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center">
              <UserDropdownMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* モバイルサイドバーオーバーレイ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 背景オーバーレイ */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMobileMenu}
          />
          
          {/* サイドバー */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* サイドバーヘッダー */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">⏱️</div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    工数管理
                  </h2>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
                  aria-label="メニューを閉じる"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ユーザー情報 */}
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {state.currentUser?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-base font-medium text-gray-900">{state.currentUser?.name || 'ユーザー'}</div>
                    <div className="text-sm text-gray-500">
                      {state.currentUser?.role === 'ADMIN' ? '管理者' :
                       state.currentUser?.role === 'MANAGER' ? 'マネージャー' : 'メンバー'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ナビゲーションメニュー */}
              <div className="flex-1 py-6">
                <nav className="space-y-2 px-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`${
                        pathname === item.href
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100/50 hover:text-gray-900'
                      } group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200`}
                    >
                      <span className="text-xl mr-4">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* ログアウトボタン */}
              <div className="p-6 border-t border-gray-200/50">
                <button
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl text-base font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
