'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../contexts/AppContext';
import { Company } from '../../types';

export default function CompaniesPage() {
  const { state } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  });

  // 権限チェック
  const canCreateCompany = state.currentUser?.role === 'ADMIN';
  const canEditCompany = (company: Company) => {
    if (state.currentUser?.role === 'ADMIN') return true;
    if (state.currentUser?.role === 'MANAGER' && state.currentUser?.companyId === company.id) return true;
    return false;
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/organizations/companies');
      if (response.ok) {
        const data = await response.json();
        const companiesData = data.data || data;
        setCompanies(companiesData.map((company: any) => ({
          ...company,
          createdAt: new Date(company.createdAt),
          updatedAt: new Date(company.updatedAt),
        })));
      } else {
        console.error('会社データの取得に失敗しました');
      }
    } catch (error) {
      console.error('会社データの取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: ''
    });
    setEditingCompany(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCompany) {
        // 会社更新
        const response = await fetch(`/api/organizations/companies/${editingCompany.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          await fetchCompanies();
          resetForm();
          alert('会社情報を更新しました');
        } else {
          const errorData = await response.json();
          alert(`会社の更新に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      } else {
        // 会社新規作成
        const response = await fetch('/api/organizations/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          await fetchCompanies();
          resetForm();
          alert('会社を作成しました');
        } else {
          const errorData = await response.json();
          alert(`会社の作成に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      }
    } catch (error) {
      console.error('会社保存エラー:', error);
      alert('会社の保存に失敗しました');
    }
  };

  const handleEdit = (company: Company) => {
    if (!canEditCompany(company)) {
      alert('この会社を編集する権限がありません');
      return;
    }
    
    setEditingCompany(company);
    setFormData({
      code: company.code,
      name: company.name,
      description: company.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (companyId: string) => {
    if (state.currentUser?.role !== 'ADMIN') {
      alert('会社を削除する権限がありません');
      return;
    }

    if (confirm('この会社を削除しますか？関連する組織データもすべて削除されます。')) {
      try {
        const response = await fetch(`/api/organizations/companies/${companyId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchCompanies();
          alert('会社が正常に削除されました');
        } else {
          const errorData = await response.json();
          alert(`会社の削除に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      } catch (error) {
        console.error('会社削除エラー:', error);
        alert('会社の削除に失敗しました');
      }
    }
  };

  // フィルタリング
  const filteredCompanies = companies.filter(company => {
    const companyName = company.name || '';
    const companyCode = company.code || '';
    const companyDescription = company.description || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return companyName.toLowerCase().includes(searchTermLower) ||
           companyCode.toLowerCase().includes(searchTermLower) ||
           companyDescription.toLowerCase().includes(searchTermLower);
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <span className="text-2xl">🏢</span>
            </div>
            <p className="text-gray-600">会社データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* ヘッダーセクション */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10 rounded-3xl"></div>
          <div className="relative glass-heavy rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text">会社管理</h1>
                    <p className="text-gray-600 mt-1">
                      {state.currentUser?.role === 'ADMIN' 
                        ? '会社の作成、編集、管理を行います' 
                        : '所属会社の情報を確認・編集します'}
                    </p>
                  </div>
                </div>
              </div>
              {canCreateCompany && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary hover-lift flex items-center space-x-2 px-6 py-3 text-lg"
                  >
                    <span className="text-xl">✨</span>
                    <span>新規会社作成</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card hover-lift animate-slideIn">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総会社数</p>
                  <p className="text-3xl font-bold gradient-text">{companies.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.1s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">アクセス権限</p>
                  <p className="text-lg font-bold gradient-text-success">
                    {state.currentUser?.role === 'ADMIN' ? '全会社' : '所属会社のみ'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift animate-slideIn" style={{animationDelay: '0.2s'}}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ユーザー権限</p>
                  <p className="text-lg font-bold gradient-text-secondary">
                    {state.currentUser?.role === 'ADMIN' ? '管理者' : 'マネージャー'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 検索 */}
        <div className="card animate-scaleIn">
          <div className="card-body">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
              <input
                type="text"
                placeholder="会社名、コード、説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-12 w-full"
              />
            </div>
          </div>
        </div>

        {/* 会社作成・編集フォーム */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold gradient-text flex items-center space-x-3">
                    <span className="text-3xl">{editingCompany ? '✏️' : '✨'}</span>
                    <span>{editingCompany ? '会社情報編集' : '新規会社作成'}</span>
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
                      <label htmlFor="code" className="form-label flex items-center space-x-2">
                        <span className="text-lg">🏷️</span>
                        <span>会社コード *</span>
                      </label>
                      <input
                        type="text"
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="form-input"
                        placeholder="例: 00001"
                        required
                        disabled={!!editingCompany} // 編集時はコード変更不可
                      />
                      {editingCompany && (
                        <p className="text-sm text-gray-500">※ 会社コードは変更できません</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="name" className="form-label flex items-center space-x-2">
                        <span className="text-lg">🏢</span>
                        <span>会社名 *</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input"
                        placeholder="会社名を入力..."
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="form-label flex items-center space-x-2">
                      <span className="text-lg">📄</span>
                      <span>説明</span>
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="form-textarea"
                      placeholder="会社の詳細説明を入力..."
                    />
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
                      {editingCompany ? '更新する' : '作成する'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 会社一覧 */}
        <div className="space-y-6">
          {filteredCompanies.length === 0 ? (
            <div className="card text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? '該当する会社がありません' : '会社がありません'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? '検索条件を変更してみてください' : '新しい会社を作成して始めましょう'}
              </p>
              {!searchTerm && canCreateCompany && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  最初の会社を作成
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCompanies.map((company, index) => (
                <div 
                  key={company.id} 
                  className="card hover-lift animate-fadeIn"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="card-body space-y-4">
                    {/* 会社ヘッダー */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {company.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="status-badge status-active">
                            🏷️ {company.code}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {canEditCompany(company) && (
                          <button
                            onClick={() => handleEdit(company)}
                            className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                            title="編集"
                          >
                            <span className="text-sm">✏️</span>
                          </button>
                        )}
                        {state.currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                            title="削除"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 会社説明 */}
                    {company.description && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {company.description}
                      </p>
                    )}

                    {/* 会社詳細 */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-gray-500 flex items-center space-x-1">
                          <span>📅</span>
                          <span>作成日</span>
                        </p>
                        <p className="font-medium">{company.createdAt.toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>

                    {/* 権限表示 */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">アクセス権限</span>
                        <span className={`font-medium ${canEditCompany(company) ? 'text-green-600' : 'text-gray-400'}`}>
                          {canEditCompany(company) ? '編集可能' : '閲覧のみ'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
