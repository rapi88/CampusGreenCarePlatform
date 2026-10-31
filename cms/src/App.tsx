import React, { useState, useEffect } from 'react';
import { api, User, Tree, WateringLog, DashboardStats } from './api/client';
import { LayoutDashboard, Trees, Clock, Users, Droplets, Map, LogOut, RefreshCw, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { TreesView } from './components/TreesView';
import { SuggestionsView } from './components/SuggestionsView';
import { UsersView } from './components/UsersView';
import { WateringView } from './components/WateringView';
import { CampusMapView } from './components/CampusMapView';
import { TreeModal } from './components/TreeModal';
import { LoginView } from './components/LoginView';

export function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cms_token'));

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trees' | 'suggestions' | 'users' | 'watering' | 'map'>('dashboard');

  // Data
  const [trees, setTrees] = useState<Tree[]>([]);
  const [suggestions, setSuggestions] = useState<Tree[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [wateringLogs, setWateringLogs] = useState<WateringLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [editingTree, setEditingTree] = useState<Tree | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [treesData, suggestionsData, usersData, statsData, logsData] = await Promise.all([
        api.getTrees(),
        api.getSuggestions().catch(() => []),
        api.getUsers().catch(() => []),
        api.getDashboardStats().catch(() => null),
        api.getWateringReport().catch(() => []),
      ]);

      setTrees(treesData);
      setSuggestions(suggestionsData);
      setUsers(usersData);
      setStats(statsData);
      setWateringLogs(logsData);
    } catch (err: any) {
      showToast(err.message || 'Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // Tree Handlers
  const handleOpenAddModal = () => {
    setEditingTree(null);
    setIsTreeModalOpen(true);
  };

  const handleOpenEditModal = (tree: Tree) => {
    setEditingTree(tree);
    setIsTreeModalOpen(true);
  };

  const handleSaveTree = async (data: Partial<Tree>, photoFile?: File) => {
    try {
      if (editingTree) {
        const updated = await api.updateTree(editingTree.id, data);
        if (photoFile) {
          await api.uploadTreePhoto(editingTree.id, photoFile);
        }
        showToast(`"${updated.name}" başarıyla güncellendi.`);
      } else {
        const created = await api.createTree(data);
        if (photoFile) {
          await api.uploadTreePhoto(created.id, photoFile);
        }
        showToast(`"${created.name}" sisteme kaydedildi.`);
      }
      setIsTreeModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'İşlem başarısız', 'error');
      throw err;
    }
  };

  const handleDeleteTree = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" ağacını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    try {
      await api.deleteTree(id);
      showToast(`"${name}" başarıyla silindi.`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Ağaç silinemedi', 'error');
    }
  };

  // Suggestion Handlers
  const handleApproveSuggestion = async (id: string) => {
    try {
      await api.approveSuggestion(id);
      showToast('Ağaç önerisi onaylandı ve envantere eklendi! 🎉');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Öneri onaylanırken hata oluştu', 'error');
    }
  };

  const handleRejectSuggestion = async (id: string, reason?: string) => {
    try {
      await api.rejectSuggestion(id, reason);
      showToast('Ağaç önerisi reddedildi.');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Öneri reddedilirken hata oluştu', 'error');
    }
  };

  // Watering Filter Handler
  const handleFilterWatering = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const logs = await api.getWateringReport(from, to);
      setWateringLogs(logs);
    } catch (err: any) {
      showToast(err.message || 'Filtre uygulanamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    setUser(null);
    setToken(null);
  };

  // Unauthenticated -> Show Login Screen
  if (!token || !user) {
    return (
      <LoginView
        onSuccess={(u, t) => {
          setUser(u);
          setToken(t);
        }}
      />
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Yönetim Paneli & İstatistikler', subtitle: 'Genel kampus durumu ve hızlı özet' };
      case 'trees':
        return { title: 'Ağaç Yönetimi', subtitle: 'Kampüs ağaç envanteri, düzenleme ve sağlık durumu' };
      case 'suggestions':
        return { title: 'Öğrenci Ağaç Önerileri', subtitle: 'Öğrenciler tarafından önerilen ağaçları onaylama veya reddetme' };
      case 'users':
        return { title: 'Gönüllü & Kullanıcı Yönetimi', subtitle: 'Platforma kayıtlı öğrenciler ve yeşil puan liderleri' };
      case 'watering':
        return { title: 'Sulama Geçmişi & Raporlar', subtitle: 'GPS doğrulamalı sulama logları ve veri dışa aktarma' };
      case 'map':
        return { title: 'Kampüs İnteraktif Haritası', subtitle: 'GTÜ yerleşkesindeki ağaçların konum ve kondisyon dağılımı' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="cms-app-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          background: notification.type === 'success' ? '#064e3b' : '#991b1b',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="cms-sidebar">
        <div className="cms-sidebar-header">
          <div className="cms-logo-icon">🌿</div>
          <div className="cms-logo-text">
            <h1>Campus Green</h1>
            <span>CMS Portal</span>
          </div>
        </div>

        <ul className="cms-nav-list">
          <li>
            <button
              className={`cms-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          </li>

          <li>
            <button
              className={`cms-nav-item ${activeTab === 'trees' ? 'active' : ''}`}
              onClick={() => setActiveTab('trees')}
            >
              <Trees size={18} />
              <span>Ağaç Yönetimi</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.8 }}>{trees.length}</span>
            </button>
          </li>

          <li>
            <button
              className={`cms-nav-item ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              <Clock size={18} />
              <span>Öğrenci Önerileri</span>
              {suggestions.length > 0 && (
                <span className="cms-nav-badge">{suggestions.length}</span>
              )}
            </button>
          </li>

          <li>
            <button
              className={`cms-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              <span>Gönüllüler</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.8 }}>{users.length}</span>
            </button>
          </li>

          <li>
            <button
              className={`cms-nav-item ${activeTab === 'watering' ? 'active' : ''}`}
              onClick={() => setActiveTab('watering')}
            >
              <Droplets size={18} />
              <span>Sulama Raporu</span>
            </button>
          </li>

          <li>
            <button
              className={`cms-nav-item ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <Map size={18} />
              <span>Kampüs Haritası</span>
            </button>
          </li>
        </ul>

        {/* Sidebar Footer */}
        <div className="cms-sidebar-footer">
          <div className="cms-admin-pill">
            <div className="cms-admin-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="cms-admin-info">
              <span className="cms-admin-name">{user.name}</span>
              <span className="cms-admin-role">Yönetici</span>
            </div>
          </div>

          <button className="cms-logout-btn" onClick={handleLogout} title="Çıkış Yap">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="cms-main">
        {/* Sticky Header */}
        <header className="cms-header">
          <div className="cms-header-title">
            <h2>{pageInfo.title}</h2>
            <p>{pageInfo.subtitle}</p>
          </div>

          <div className="cms-header-actions">
            <button
              className="btn btn-secondary"
              onClick={loadAllData}
              disabled={loading}
              title="Verileri Yenile"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Yenile</span>
            </button>

            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={16} /> Yeni Ağaç Ekle
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="cms-page-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              trees={trees}
              users={users}
              wateringLogs={wateringLogs}
              pendingSuggestionsCount={suggestions.length}
              onNavigate={(tab) => setActiveTab(tab as any)}
              onOpenAddTree={handleOpenAddModal}
            />
          )}

          {activeTab === 'trees' && (
            <TreesView
              trees={trees}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onDeleteTree={handleDeleteTree}
            />
          )}

          {activeTab === 'suggestions' && (
            <SuggestionsView
              suggestions={suggestions}
              onApprove={handleApproveSuggestion}
              onReject={handleRejectSuggestion}
            />
          )}

          {activeTab === 'users' && (
            <UsersView users={users} />
          )}

          {activeTab === 'watering' && (
            <WateringView
              logs={wateringLogs}
              onFilterDate={handleFilterWatering}
            />
          )}

          {activeTab === 'map' && (
            <CampusMapView trees={trees} />
          )}
        </div>
      </main>

      {/* Tree Create / Edit Modal */}
      <TreeModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        onSubmit={handleSaveTree}
        initialTree={editingTree}
      />
    </div>
  );
}

export default App;
