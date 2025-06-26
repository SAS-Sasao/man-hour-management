'use client';

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useApp();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 直接データベースからユーザーを検索
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        setError(responseData.error || 'ログインに失敗しました');
        return;
      }
      
      if (!responseData.success) {
        setError(responseData.error || 'ログインに失敗しました');
        return;
      }
      
      const user = responseData.data;
      const userWithDates = {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      };
      
      // ローカルストレージをクリアしてから新しいユーザーを設定
      localStorage.clear();
      
      // データベースから取得したユーザー情報をそのまま使用
      console.log('ログイン成功 - ユーザー情報:', userWithDates);
      dispatch({ type: 'SET_CURRENT_USER', payload: userWithDates });
      
      // セッションチェック完了をマーク
      dispatch({ type: 'SET_SESSION_CHECKED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // 状態更新を確実に反映させるため少し待機してから遷移
      setTimeout(() => {
        console.log('ダッシュボードに遷移します');
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('ログイン処理中にエラーが発生しました:', error);
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="glass-heavy rounded-3xl p-8 shadow-2xl animate-scaleIn">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-4xl">⏱️</span>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">ログイン</h1>
            <p className="text-gray-600">工数管理システムへようこそ</p>
          </div>
          
          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl animate-slideIn">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <p className="text-red-700 font-medium">エラー</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="form-label flex items-center space-x-2">
                <span className="text-lg">📧</span>
                <span>メールアドレス</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-6"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs">👤</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="form-label flex items-center space-x-2">
                <span className="text-lg">🔒</span>
                <span>パスワード</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-6"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs">🔑</span>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-lg font-semibold hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner w-5 h-5 border-2 border-white border-l-transparent"></div>
                  <span>ログイン中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">🚀</span>
                  <span>ログイン</span>
                </div>
              )}
            </button>
          </form>


          {/* フッター */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-4">
              効率的なプロジェクト管理を始めましょう
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <span>📊</span>
                <span>ダッシュボード</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>📋</span>
                <span>プロジェクト管理</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>⏰</span>
                <span>工数入力</span>
              </span>
            </div>
          </div>
        </div>

        {/* 追加の装飾要素 */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute -top-2 -right-6 w-6 h-6 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-2 -left-6 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.5s'}}></div>
      </div>
    </div>
  );
}
