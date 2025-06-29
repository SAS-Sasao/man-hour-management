'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

interface Company {
  id: string;
  code: string;
  name: string;
  description?: string;
  divisions: Division[];
  _count: { users: number };
}

interface Division {
  id: string;
  code: string;
  name: string;
  description?: string;
  departments: Department[];
  _count: { users: number };
}

interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  groups: Group[];
  _count: { users: number };
}

interface Group {
  id: string;
  code: string;
  name: string;
  description?: string;
  _count: { users: number };
}

export default function OrganizationsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  // 新規作成用のモーダル状態
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  // フォーム状態
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations/companies');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.data);
      } else {
        setError(data.error || '組織データの取得に失敗しました');
      }
    } catch (error) {
      console.error('組織データ取得エラー:', error);
      setError('組織データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const toggleDivision = (divisionId: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(divisionId)) {
      newExpanded.delete(divisionId);
    } else {
      newExpanded.add(divisionId);
    }
    setExpandedDivisions(newExpanded);
  };

  const toggleDepartment = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="spinner w-8 h-8 border-4 border-blue-500 border-l-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">組織データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">🏢 組織管理</h1>
            <p className="text-gray-600 mt-2">会社・事業部・部署・グループの管理</p>
          </div>
          <div className="flex space-x-3">
            {/* 会社追加ボタンは削除 */}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 組織ツリー */}
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.id} className="glass rounded-xl p-6">
              {/* 会社レベル */}
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="flex items-center cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors flex-1"
                  onClick={() => toggleCompany(company.id)}
                >
                  <div className="flex items-center mr-4">
                    <span className="text-2xl mr-2">🏢</span>
                    <span className="text-lg text-blue-600">
                      {expandedCompanies.has(company.id) ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      {company.name} 
                      <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {company.code}
                      </span>
                    </h3>
                    {company.description && (
                      <p className="text-gray-600 text-sm mt-1">{company.description}</p>
                    )}
                    <div className="flex items-center mt-2 space-x-4">
                      <p className="text-gray-500 text-xs flex items-center">
                        👥 {company._count?.users || 0}名
                      </p>
                      <p className="text-gray-500 text-xs flex items-center">
                        🏛️ {company.divisions.length}事業部
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCompanyId(company.id);
                      setShowDivisionModal(true);
                    }}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-lift flex items-center"
                  >
                    <span className="mr-1">🏛️</span>
                    事業部追加
                  </button>
                </div>
              </div>

              {/* 事業部レベル */}
              {expandedCompanies.has(company.id) && (
                <div className="ml-8 space-y-3">
                  {company.divisions.map((division) => (
                    <div key={division.id} className="border-l-2 border-blue-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div 
                          className="flex items-center cursor-pointer hover:bg-green-50 p-3 rounded-lg transition-colors flex-1"
                          onClick={() => toggleDivision(division.id)}
                        >
                          <div className="flex items-center mr-4">
                            <span className="text-xl mr-2">🏛️</span>
                            <span className="text-base text-green-600">
                              {expandedDivisions.has(division.id) ? '▼' : '▶'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                              {division.name}
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {division.code}
                              </span>
                            </h4>
                            {division.description && (
                              <p className="text-gray-600 text-sm mt-1">{division.description}</p>
                            )}
                            <div className="flex items-center mt-2 space-x-4">
                              <p className="text-gray-500 text-xs flex items-center">
                                👥 {division._count?.users || 0}名
                              </p>
                              <p className="text-gray-500 text-xs flex items-center">
                                🏬 {division.departments.length}部署
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDivisionId(division.id);
                            setShowDepartmentModal(true);
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-lift flex items-center"
                        >
                          <span className="mr-1">🏬</span>
                          部署追加
                        </button>
                      </div>

                      {/* 部署レベル */}
                      {expandedDivisions.has(division.id) && (
                        <div className="ml-8 space-y-2">
                          {division.departments.map((department) => (
                            <div key={department.id} className="border-l-2 border-green-200 pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <div 
                                  className="flex items-center cursor-pointer hover:bg-orange-50 p-3 rounded-lg transition-colors flex-1"
                                  onClick={() => toggleDepartment(department.id)}
                                >
                                  <div className="flex items-center mr-4">
                                    <span className="text-lg mr-2">🏬</span>
                                    <span className="text-sm text-orange-600">
                                      {expandedDepartments.has(department.id) ? '▼' : '▶'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-base font-medium text-gray-600 flex items-center">
                                      {department.name}
                                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                        {department.code}
                                      </span>
                                    </h5>
                                    {department.description && (
                                      <p className="text-gray-600 text-sm mt-1">{department.description}</p>
                                    )}
                                    <div className="flex items-center mt-2 space-x-4">
                                      <p className="text-gray-500 text-xs flex items-center">
                                        👥 {department._count?.users || 0}名
                                      </p>
                                      <p className="text-gray-500 text-xs flex items-center">
                                        👥 {department.groups.length}グループ
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedDepartmentId(department.id);
                                    setShowGroupModal(true);
                                  }}
                                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-lift flex items-center"
                                >
                                  <span className="mr-1">👥</span>
                                  グループ追加
                                </button>
                              </div>

                              {/* グループレベル */}
                              {expandedDepartments.has(department.id) && (
                                <div className="ml-8 space-y-1">
                                  {department.groups.map((group) => (
                                    <div key={group.id} className="border-l-2 border-purple-200 pl-4">
                                      <div className="flex items-center p-3 hover:bg-purple-50 rounded-lg transition-colors">
                                        <div className="flex items-center mr-4">
                                          <span className="text-base mr-2">👥</span>
                                        </div>
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium text-gray-500 flex items-center">
                                            {group.name}
                                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                              {group.code}
                                            </span>
                                          </h6>
                                          {group.description && (
                                            <p className="text-gray-600 text-xs mt-1">{group.description}</p>
                                          )}
                                          <p className="text-gray-500 text-xs mt-1 flex items-center">
                                            👥 {group._count?.users || 0}名
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 会社がない場合 */}
        {companies.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              組織が登録されていません
            </h3>
            <p className="text-gray-500 mb-6">
              最初の会社を作成して組織管理を始めましょう
            </p>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="btn-primary hover-lift"
            >
              <span className="text-lg mr-2">➕</span>
              会社を作成
            </button>
          </div>
        )}
      </div>

      {/* 会社作成モーダル */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">🏢 会社作成</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const response = await fetch('/api/organizations/companies', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (data.success) {
                  setShowCompanyModal(false);
                  setFormData({ code: '', name: '', description: '' });
                  fetchCompanies();
                } else {
                  setError(data.error || '会社の作成に失敗しました');
                }
              } catch (error) {
                setError('会社の作成中にエラーが発生しました');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社コード *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 00001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: SAS株式会社"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="会社の説明（任意）"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyModal(false);
                    setFormData({ code: '', name: '', description: '' });
                  }}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 事業部作成モーダル */}
      {showDivisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">🏛️ 事業部作成</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const response = await fetch('/api/organizations/divisions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...formData, companyId: selectedCompanyId })
                });
                const data = await response.json();
                if (data.success) {
                  setShowDivisionModal(false);
                  setFormData({ code: '', name: '', description: '' });
                  setSelectedCompanyId('');
                  fetchCompanies();
                } else {
                  setError(data.error || '事業部の作成に失敗しました');
                }
              } catch (error) {
                setError('事業部の作成中にエラーが発生しました');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    事業部コード *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    事業部名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: システム開発・クラウドサービス事業部"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="事業部の説明（任意）"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDivisionModal(false);
                    setFormData({ code: '', name: '', description: '' });
                    setSelectedCompanyId('');
                  }}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 部署作成モーダル */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">🏬 部署作成</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const response = await fetch('/api/organizations/departments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...formData, divisionId: selectedDivisionId })
                });
                const data = await response.json();
                if (data.success) {
                  setShowDepartmentModal(false);
                  setFormData({ code: '', name: '', description: '' });
                  setSelectedDivisionId('');
                  fetchCompanies();
                } else {
                  setError(data.error || '部署の作成に失敗しました');
                }
              } catch (error) {
                setError('部署の作成中にエラーが発生しました');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署コード *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 開発部"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="部署の説明（任意）"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentModal(false);
                    setFormData({ code: '', name: '', description: '' });
                    setSelectedDivisionId('');
                  }}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* グループ作成モーダル */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">👥 グループ作成</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const response = await fetch('/api/organizations/groups', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...formData, departmentId: selectedDepartmentId })
                });
                const data = await response.json();
                if (data.success) {
                  setShowGroupModal(false);
                  setFormData({ code: '', name: '', description: '' });
                  setSelectedDepartmentId('');
                  fetchCompanies();
                } else {
                  setError(data.error || 'グループの作成に失敗しました');
                }
              } catch (error) {
                setError('グループの作成中にエラーが発生しました');
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    グループコード *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    グループ名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: Aグループ"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="グループの説明（任意）"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupModal(false);
                    setFormData({ code: '', name: '', description: '' });
                    setSelectedDepartmentId('');
                  }}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
