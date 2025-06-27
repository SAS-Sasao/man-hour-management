'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../contexts/AppContext';
import { User, Company, Division, Department, Group } from '../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { state, dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // 組織データ
  const [companies, setCompanies] = useState<Company[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // クライアントサイドでのマウント確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // フォームデータ
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    divisionId: '',
    departmentId: '',
    groupId: '',
  });

  // 初期化
  useEffect(() => {
    if (isOpen && state.currentUser) {
      setFormData({
        email: state.currentUser.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        divisionId: state.currentUser.divisionId || '',
        departmentId: state.currentUser.departmentId || '',
        groupId: state.currentUser.groupId || '',
      });
      setError('');
      setSuccess('');
      loadOrganizationData();
    }
  }, [isOpen, state.currentUser]);

  // 組織データの読み込み
  const loadOrganizationData = async () => {
    try {
      // 全ての事業部を取得（会社IDに関係なく）
      const divisionsResponse = await fetch('/api/organizations/divisions');
      if (divisionsResponse.ok) {
        const divisionsData = await divisionsResponse.json();
        console.log('取得した事業部データ:', divisionsData);
        setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
      } else {
        console.error('事業部データの取得に失敗:', divisionsResponse.status);
      }

      // 現在のユーザーの事業部に属する部署を取得
      if (state.currentUser?.divisionId) {
        const departmentsResponse = await fetch(`/api/organizations/departments?divisionId=${state.currentUser.divisionId}`);
        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        }
      }

      // 現在のユーザーの部署に属するグループを取得
      if (state.currentUser?.departmentId) {
        const groupsResponse = await fetch(`/api/organizations/groups?departmentId=${state.currentUser.departmentId}`);
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          setGroups(Array.isArray(groupsData) ? groupsData : []);
        }
      }
    } catch (error) {
      console.error('組織データの読み込みエラー:', error);
      setDivisions([]);
      setDepartments([]);
      setGroups([]);
    }
  };

  // 事業部変更時の処理
  const handleDivisionChange = async (divisionId: string) => {
    setFormData(prev => ({
      ...prev,
      divisionId,
      departmentId: '',
      groupId: '',
    }));

    if (divisionId) {
      try {
        const response = await fetch(`/api/organizations/departments?divisionId=${divisionId}`);
        if (response.ok) {
          const data = await response.json();
          setDepartments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('部署データの読み込みエラー:', error);
        setDepartments([]);
      }
    } else {
      setDepartments([]);
    }
    setGroups([]);
  };

  // 部署変更時の処理
  const handleDepartmentChange = async (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentId,
      groupId: '',
    }));

    if (departmentId) {
      try {
        const response = await fetch(`/api/organizations/groups?departmentId=${departmentId}`);
        if (response.ok) {
          const data = await response.json();
          setGroups(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('グループデータの読み込みエラー:', error);
        setGroups([]);
      }
    } else {
      setGroups([]);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // バリデーション
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('新しいパスワードと確認用パスワードが一致しません');
        return;
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        setError('新しいパスワードは6文字以上で入力してください');
        return;
      }

      // APIリクエスト
      const requestData: any = {
        email: formData.email,
        divisionId: formData.divisionId || null,
        departmentId: formData.departmentId || null,
        groupId: formData.groupId || null,
      };

      if (formData.newPassword) {
        requestData.currentPassword = formData.currentPassword;
        requestData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        // AppContextのユーザー情報を更新
        const updatedUser = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
        dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
        
        setSuccess('プロフィールが更新されました');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              プロフィール編集
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
              {success}
            </div>
          )}

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* パスワード変更セクション */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">パスワード変更（任意）</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="パスワードを変更する場合のみ入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="6文字以上で入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="新しいパスワードを再入力"
                />
              </div>
            </div>
          </div>

          {/* 組織情報セクション */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">組織情報</h3>
            
            <div className="space-y-4">
              {/* 事業部 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業部
                </label>
                <select
                  value={formData.divisionId}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">事業部を選択してください</option>
                  {Array.isArray(divisions) && divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 部署 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  部署
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={!formData.divisionId}
                >
                  <option value="">部署を選択してください</option>
                  {Array.isArray(departments) && departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* グループ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  グループ
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={!formData.departmentId}
                >
                  <option value="">グループを選択してください</option>
                  {Array.isArray(groups) && groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
