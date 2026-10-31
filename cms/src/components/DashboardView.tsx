import React from 'react';
import { Tree, User, WateringLog, DashboardStats } from '../api/client';
import { Trees, Users, Droplets, Clock, AlertTriangle, CheckCircle, ChevronRight, MapPin, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  trees: Tree[];
  users: User[];
  wateringLogs: WateringLog[];
  pendingSuggestionsCount: number;
  onNavigate: (view: string) => void;
  onOpenAddTree: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  trees,
  users,
  wateringLogs,
  pendingSuggestionsCount,
  onNavigate,
  onOpenAddTree,
}) => {
  const healthyCount = trees.filter(t => t.health === 'HEALTHY').length;
  const sickCount = trees.filter(t => t.health === 'SICK').length;
  const criticalCount = trees.filter(t => t.health === 'CRITICAL').length;
  const totalTrees = trees.length || stats?.totalTrees || 0;

  return (
    <div>
      {/* Top Welcome / Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        color: '#ffffff',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
            <Sparkles size={14} /> GTÜ Kampüs Bakım Portalı
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', lineHeight: 1.2, marginBottom: '8px' }}>
            Hoş Geldiniz, Kampüs Yönetimi 🌿
          </h2>
          <p style={{ opacity: 0.9, fontSize: '14px', lineHeight: 1.5 }}>
            Gebze Teknik Üniversitesi yeşil alanları, kayıtlı ağaçlar ve gönüllü öğrenci sulama aktivitelerini tek bir panelden yönetin.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <button className="btn btn-secondary" onClick={onOpenAddTree} style={{ background: '#ffffff', color: '#064e3b', fontWeight: '700' }}>
            + Yeni Ağaç Ekle
          </button>
          <button className="btn" onClick={() => onNavigate('suggestions')} style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
            Önerileri Gör ({pendingSuggestionsCount})
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="cms-stats-grid">
        <div className="cms-stat-card">
          <div className="cms-stat-info">
            <p>Toplam Kayıtlı Ağaç</p>
            <h3>{totalTrees}</h3>
          </div>
          <div className="cms-stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <Trees size={26} />
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-info">
            <p>Aktif Gönüllüler</p>
            <h3>{users.length || stats?.activeVolunteers || 0}</h3>
          </div>
          <div className="cms-stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Users size={26} />
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-info">
            <p>Bugünkü Sulamalar</p>
            <h3>{stats?.wateringsToday ?? wateringLogs.length}</h3>
          </div>
          <div className="cms-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Droplets size={26} />
          </div>
        </div>

        <div className="cms-stat-card" style={{ borderColor: pendingSuggestionsCount > 0 ? '#f59e0b' : 'var(--border)' }}>
          <div className="cms-stat-info">
            <p>İncelenecek Öneriler</p>
            <h3 style={{ color: pendingSuggestionsCount > 0 ? '#b45309' : 'var(--text-main)' }}>
              {pendingSuggestionsCount}
            </h3>
          </div>
          <div className="cms-stat-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Clock size={26} />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Health Breakdown & Recent Watering */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
        
        {/* Tree Health Status Card */}
        <div className="cms-card">
          <div className="cms-card-header">
            <div className="cms-card-title">
              <h3>Ağaç Sağlık Durumu</h3>
              <p>Kampüs ağaçlarının genel kondisyonu</p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onNavigate('trees')}>
              Tümünü Gör
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Health Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857' }}>
                    <CheckCircle size={15} /> Sağlıklı Ağaçlar
                  </span>
                  <span>{healthyCount} ({totalTrees ? Math.round((healthyCount / totalTrees) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTrees ? (healthyCount / totalTrees) * 100 : 0}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309' }}>
                    <AlertTriangle size={15} /> Bakım / İlgi Gerektiren (Hasta)
                  </span>
                  <span>{sickCount} ({totalTrees ? Math.round((sickCount / totalTrees) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTrees ? (sickCount / totalTrees) * 100 : 0}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c' }}>
                    <AlertTriangle size={15} /> Acil Müdahale (Kritik)
                  </span>
                  <span>{criticalCount} ({totalTrees ? Math.round((criticalCount / totalTrees) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTrees ? (criticalCount / totalTrees) * 100 : 0}%`, height: '100%', background: '#ef4444', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '28px', padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                <MapPin size={16} color="#15803d" /> GTÜ Kampüs Koordinatı
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Gebze Teknik Üniversitesi ana kampüsünde 40.804° K, 29.361° D merkezli yeşil bakım çemberi aktiftir.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Watering Activities Card */}
        <div className="cms-card">
          <div className="cms-card-header">
            <div className="cms-card-title">
              <h3>Son Sulama Aktiviteleri</h3>
              <p>Gönüllülerin GPS doğrulamalı bakım kayıtları</p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onNavigate('watering')}>
              Tüm Raporu Aç
            </button>
          </div>

          <div className="cms-table-wrapper">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Ağaç</th>
                  <th>Gönüllü</th>
                  <th>Doğrulama</th>
                  <th>Puan</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {wateringLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Henüz sulama aktivitesi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  wateringLogs.slice(0, 5).map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{log.tree?.name || 'Ağaç'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.tree?.species}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{log.user?.name || 'Anonim'}</span>
                      </td>
                      <td>
                        {log.gpsVerified ? (
                          <span className="badge badge-healthy">✓ GPS Doğrulandı</span>
                        ) : (
                          <span className="badge badge-sick">Manuel Giriş</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#15803d' }}>+{log.pointsAwarded} Puan</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
