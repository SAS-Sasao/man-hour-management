'use client';

import { useState } from 'react';
import bcrypt from 'bcryptjs';
import Layout from '../../components/Layout';
import { useApp } from '../../contexts/AppContext';
import { User } from '../../types';

export default function UsersPage() {
  const { state, dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | User['role']>('ALL');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'MEMBER' as User['role'],
    password: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'MEMBER',
      password: ''
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.users.some(user => user.email === formData.email && (!editingUser || user.id !== editingUser.id))) {
      alert('このメールアドレスは既に使用されています');
      return;
    }

    if (!editingUser && !formData.password) {
      alert('パスワードを入力してください');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      alert('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      if (editingUser) {
        const updatedUser: User = {
          ...editingUser,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          updatedAt: new Date()
        };

        // パスワードが入力されている場合のみハッシュ化して更新
        if (formData.password) {
          const hashedPassword = await bcrypt.hash(formData.password, 10);
          updatedUser.password = hashedPassword;
        }

        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      } else {
        const hashedPassword = await bcrypt.hash(formData.password, 10);
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          password: hashedPassword,
          role: formData.role,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        dispatch({ type: 'ADD_USER', payload: newUser });
      }

      resetForm();
    } catch (error) {
      console.error('パスワードの処理中にエラーが発生しました:', error);
      alert('ユーザーの作成/更新中にエラーが発生しました');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // 編集時はパスワードを空にする
    });
    setShowCreateForm(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm('このユーザーを削除しますか？関連する工数データも削除されます。')) {
      dispatch({ type: 'DELETE_USER', payload: userId });
      
      const relatedTimeEntries = state.timeEntries.filter(entry => entry.userId === userId);
      relatedTimeEntries.forEach(entry => {
        dispatch({ type: 'DELETE_TIME_ENTRY', payload: entry.id });
      });
    }
  };

  const addPredefinedUser = async () => {
    const hashedPassword = await bcrypt.hash('ts05140952', 10);
    const predefinedUser: User = {
      id: `user-${Date.now()}`,
      name: '笹尾 豊樹',
      email: 'sasao@sas-com.com',
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (state.users.some(user => user.email === predefinedUser.email)) {
      alert('このユーザーは既に登録されています');
      return;
    }

    dispatch({ type: 'ADD_USER', payload: predefinedUser });
  };

  // フィルタリング
  const filteredUsers = state.users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // 統計情報
  const stats = {
    total: state.users.length,
    admin: state.users.filter(u => u.role === 'ADMIN').length,
    manager: state.users.filter(u => u.role === 'MANAGER').length,
    member: state.users.filter(u => u.role === 'MEMBER').length,
  };

  if (state.currentUser?.role !== 'ADMIN') {
    return (
      <Layout>
        <div className="card text-center py-16 animate-fadeIn">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold gradient-text mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 text-lg">ユーザー管理は管理者のみアクセス可能です</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* ヘッダーセクション */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 opacity-10 rounded-3xl"></div>
          <div className="relative glass-heavy rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text-secondary">ユーザー管理</h1>
                    <p className="text-gray-600 mt-1">システムユーザーの作成、編集、管理を効率的に行います</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addPredefinedUser}
                  className="btn-success hover-lift flex items-center space-x-2 px-6 py-3"
                >
                  <span className="text-xl">👤</span>
                  <span>笹尾さんを追加</span>
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary hover-lift flex items-center space-x-2 px-6 py-3"
                >
                  <span className="text-xl">✨</span>
                  <span>新規ユーザー</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="card hover-lift animate-slideIn">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総ユーザー</p>
                  <p className="text-3xl font-bold gradient-text">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.1s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">管理者</p>
                  <p className="text-3xl font-bold text-red-500">{stats.admin}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👑</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.2s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">マネージャー</p>
                  <p className="text-3xl font-bold text-yellow-500">{stats.manager}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.3s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">メンバー</p>
                  <p className="text-3xl font-bold gradient-text-success">{stats.member}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="card animate-scaleIn">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="ユーザー名やメールアドレスで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-12 w-full"
                  />
                </div>
              </div>
              <div className="lg:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="form-select w-full"
                >
                  <option value="ALL">すべての権限</option>
                  <option value="ADMIN">管理者</option>
                  <option value="MANAGER">マネージャー</option>
                  <option value="MEMBER">メンバー</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ユーザー作成・編集フォーム */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold gradient-text-secondary flex items-center space-x-3">
                    <span className="text-3xl">{editingUser ? '✏️' : '✨'}</span>
                    <span>{editingUser ? 'ユーザー編集' : '新規ユーザー作成'}</span>
                  </h2>
                  <button
                    onClick={resetForm}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="form-label flex items-center space-x-2">
                        <span className="text-lg">👤</span>
                        <span>氏名 *</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input"
                        placeholder="山田 太郎"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="form-label flex items-center space-x-2">
                        <span className="text-lg">📧</span>
                        <span>メールアドレス *</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="form-input"
                        placeholder="yamada@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="role" className="form-label flex items-center space-x-2">
                        <span className="text-lg">🏷️</span>
                        <span>権限 *</span>
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                        className="form-select"
                        required
                      >
                        <option value="MEMBER">👤 メンバー</option>
                        <option value="MANAGER">🎯 マネージャー</option>
                        <option value="ADMIN">👑 管理者</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="form-label flex items-center space-x-2">
                        <span className="text-lg">🔒</span>
                        <span>パスワード {!editingUser && '*'}</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="form-input"
                        required={!editingUser}
                        placeholder={editingUser ? '変更する場合のみ入力' : '8文字以上'}
                        minLength={editingUser ? 0 : 8}
                      />
                      {editingUser && (
                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                          <span>💡</span>
                          <span>パスワードを変更する場合のみ入力してください</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-8 py-3 text-lg"
                    >
                      {editingUser ? '更新する' : '作成する'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー一覧 */}
        <div className="space-y-6">
          {filteredUsers.length === 0 ? (
            <div className="card text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || roleFilter !== 'ALL' ? '該当するユーザーがいません' : 'ユーザーがいません'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || roleFilter !== 'ALL' ? '検索条件を変更してみてください' : '新しいユーザーを作成して始めましょう'}
              </p>
              {!searchTerm && roleFilter === 'ALL' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  最初のユーザーを作成
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((user, index) => {
                const userProjects = state.projects.filter(p => p.managerId === user.id);
                const userTimeEntries = state.timeEntries.filter(e => e.userId === user.id);
                const totalHours = userTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

                return (
                  <div 
                    key={user.id} 
                    className="card hover-lift animate-fadeIn"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="card-body space-y-4">
                      {/* ユーザーヘッダー */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
                            user.role === 'ADMIN' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                            user.role === 'MANAGER' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        {user.id !== state.currentUser?.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                              title="編集"
                            >
                              <span className="text-sm">✏️</span>
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                              title="削除"
                            >
                              <span className="text-sm">🗑️</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 権限バッジ */}
                      <div className="flex items-center">
                        <span className={`status-badge ${
                          user.role === 'ADMIN' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                          user.role === 'MANAGER' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                          'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        }`}>
                          {user.role === 'ADMIN' ? '👑 管理者' :
                           user.role === 'MANAGER' ? '🎯 マネージャー' : '👤 メンバー'}
                        </span>
                      </div>

                      {/* ユーザー統計 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>📋</span>
                            <span>管理プロジェクト</span>
                          </p>
                          <p className="font-medium">{userProjects.length}件</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>⏰</span>
                            <span>総工数</span>
                          </p>
                          <p className="font-medium">{totalHours.toFixed(1)}h</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-gray-500 flex items-center space-x-1">
                            <span>📅</span>
                            <span>登録日</span>
                          </p>
                          <p className="font-medium">{user.createdAt.toLocaleDateString('ja-JP')}</p>
                        </div>
                      </div>

                      {/* 現在のユーザー表示 */}
                      {user.id === state.currentUser?.id && (
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-center space-x-2 text-blue-600">
                            <span className="text-lg">👤</span>
                            <span className="font-medium">現在のユーザー</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
