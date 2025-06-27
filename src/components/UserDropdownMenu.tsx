'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../contexts/AppContext';
import ProfileEditModal from './ProfileEditModal';

export default function UserDropdownMenu() {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // クライアントサイドでのマウント確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // ドロップダウンの位置を計算
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESCキーでドロップダウンを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      // セッション削除APIを呼び出し
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      
      // ローカルストレージもクリア
      localStorage.removeItem('manhour-current-user');
      
      // ログアウト後はログインページにリダイレクト
      window.location.href = '/login';
      
      console.log('ログアウトしました');
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました:', error);
      // エラーが発生してもローカル状態はクリア
      localStorage.removeItem('manhour-current-user');
      window.location.href = '/login';
    }
  };

  const handleProfileEdit = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '管理者';
      case 'MANAGER':
        return 'マネージャー';
      case 'MEMBER':
        return 'メンバー';
      default:
        return 'ユーザー';
    }
  };

  const getOrganizationInfo = () => {
    const user = state.currentUser;
    if (!user) return '';

    const parts = [];
    if (user.company?.name) parts.push(user.company.name);
    if (user.division?.name) parts.push(user.division.name);
    if (user.department?.name) parts.push(user.department.name);
    if (user.group?.name) parts.push(user.group.name);

    return parts.join(' / ');
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* ユーザーアイコンボタン */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="ユーザーメニュー"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {state.currentUser?.name?.charAt(0) || '?'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">
              {state.currentUser?.name || 'ユーザー'}
            </div>
            <div className="text-xs text-gray-500">
              {getRoleDisplayName(state.currentUser?.role || '')}
            </div>
          </div>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

      </div>

      {/* ドロップダウンメニュー（ポータル使用） */}
      {mounted && isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-80 bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[99999] overflow-hidden"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right,
          }}
        >
          {/* ユーザー情報ヘッダー */}
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {state.currentUser?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-gray-900 truncate">
                  {state.currentUser?.name || 'ユーザー'}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {state.currentUser?.email || ''}
                </div>
                <div className="text-xs text-gray-500">
                  {getRoleDisplayName(state.currentUser?.role || '')}
                </div>
                {getOrganizationInfo() && (
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {getOrganizationInfo()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="py-2">
            <button
              onClick={handleProfileEdit}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-all duration-200 flex items-center space-x-3 text-gray-700 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">プロフィール編集</span>
            </button>

            <div className="border-t border-gray-200/50 my-2"></div>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-all duration-200 flex items-center space-x-3 text-red-600 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* プロフィール編集モーダル */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
