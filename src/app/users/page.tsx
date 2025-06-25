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

  if (state.currentUser?.role !== 'ADMIN') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600">ユーザー管理は管理者のみアクセス可能です</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="mt-2 text-sm text-gray-500">
              システムユーザーの作成、編集、管理を行います
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={addPredefinedUser}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              笹尾さんを追加
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              新規ユーザー
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    氏名 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    権限 *
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="MEMBER">メンバー</option>
                    <option value="MANAGER">マネージャー</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    パスワード {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={!editingUser}
                    placeholder={editingUser ? '変更する場合のみ入力' : '8文字以上'}
                    minLength={editingUser ? 0 : 8}
                  />
                  {editingUser && (
                    <p className="mt-1 text-xs text-gray-500">
                      パスワードを変更する場合のみ入力してください
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingUser ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {state.users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ユーザーがいません</p>
              ) : (
                <div className="grid gap-4">
                  {state.users.map((user) => {
                    const userProjects = state.projects.filter(p => p.managerId === user.id);
                    const userTimeEntries = state.timeEntries.filter(e => e.userId === user.id);
                    const totalHours = userTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

                    return (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                              user.role === 'MANAGER' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'ADMIN' ? '管理者' :
                               user.role === 'MANAGER' ? 'マネージャー' : 'メンバー'}
                            </span>
                          </div>
                          {user.id !== state.currentUser?.id && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                削除
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">管理プロジェクト:</span>
                            <p className="font-medium">{userProjects.length}件</p>
                          </div>
                          <div>
                            <span className="text-gray-500">総工数:</span>
                            <p className="font-medium">{totalHours.toFixed(1)}時間</p>
                          </div>
                          <div>
                            <span className="text-gray-500">登録日:</span>
                            <p className="font-medium">{user.createdAt.toLocaleDateString('ja-JP')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
