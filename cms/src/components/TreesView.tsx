import React, { useState } from 'react';
import { Tree } from '../api/client';
import { Search, Plus, Filter, Edit2, Trash2, MapPin, Calendar, Heart, Shield, Image, Users, ExternalLink } from 'lucide-react';

interface TreesViewProps {
  trees: Tree[];
  onOpenAddModal: () => void;
  onOpenEditModal: (tree: Tree) => void;
  onDeleteTree: (id: string, name: string) => void;
}

export const TreesView: React.FC<TreesViewProps> = ({
  trees,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTree,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');
  const [selectedTreeDetails, setSelectedTreeDetails] = useState<Tree | null>(null);

  const filteredTrees = trees.filter(tree => {
    const matchesSearch = 
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHealth = healthFilter === 'ALL' || tree.health === healthFilter;
    return matchesSearch && matchesHealth;
  });

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'HEALTHY':
        return <span className="badge badge-healthy">Sağlıklı</span>;
      case 'SICK':
        return <span className="badge badge-sick">Bakım Gerekli (Hasta)</span>;
      case 'CRITICAL':
        return <span className="badge badge-critical">Kritik</span>;
      default:
        return <span className="badge">{health}</span>;
    }
  };

  return (
    <div>
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Ağaç adı, türü veya kampüs konumu ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {/* Health filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">Tüm Sağlık Durumları</option>
              <option value="HEALTHY">Yalnızca Sağlıklı</option>
              <option value="SICK">Bakım Gerektiren</option>
              <option value="CRITICAL">Kritik Seviye</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={18} /> Yeni Ağaç Kaydet
        </button>
      </div>

      {/* Main Trees Table Card */}
      <div className="cms-card">
        <div className="cms-card-header">
          <div className="cms-card-title">
            <h3>Kayıtlı Ağaçlar ({filteredTrees.length})</h3>
            <p>Kampüs ağaç envanteri ve detaylı bakım durumu</p>
          </div>
        </div>

        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Ağaç / Tür</th>
                <th>Konum / Koordinat</th>
                <th>Sağlık Durumu</th>
                <th>Gönüllüler</th>
                <th>Sulama Periyodu</th>
                <th>Anıt Ağaç</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    Arama kriterlerine uygun ağaç bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTrees.map(tree => (
                  <tr key={tree.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {tree.photoPath ? (
                          <img
                            src={tree.photoPath.startsWith('http') ? tree.photoPath : `/uploads/${tree.photoPath.replace(/^.*uploads\//, '')}`}
                            alt={tree.name}
                            style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            🌳
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>
                            {tree.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {tree.species}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
                        <MapPin size={14} color="#15803d" />
                        {tree.location}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '19px' }}>
                        {tree.latitude.toFixed(5)}, {tree.longitude.toFixed(5)}
                      </div>
                    </td>

                    <td>{getHealthBadge(tree.health)}</td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="var(--text-muted)" />
                        <span style={{ fontWeight: '600' }}>
                          {tree.adoptions?.length ?? 0} / {tree.maxVolunteers}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: '500' }}>{tree.wateringPeriodDays} günde bir</span>
                    </td>

                    <td>
                      {tree.isNaturalMonument ? (
                        <span className="badge badge-active" style={{ background: '#fef3c7', color: '#b45309' }}>
                          🏛️ Anıt Ağaç
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Detayları İncele"
                          onClick={() => setSelectedTreeDetails(tree)}
                        >
                          İncele
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Düzenle"
                          onClick={() => onOpenEditModal(tree)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444' }}
                          title="Sil"
                          onClick={() => onDeleteTree(tree.id, tree.name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tree Detail Drawer / Modal */}
      {selectedTreeDetails && (
        <div className="modal-overlay" onClick={() => setSelectedTreeDetails(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🌳</span>
                <div>
                  <h3>{selectedTreeDetails.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedTreeDetails.species}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTreeDetails(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Konum</div>
                  <div style={{ fontWeight: '600', marginTop: '2px' }}>{selectedTreeDetails.location}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedTreeDetails.latitude}, {selectedTreeDetails.longitude}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sağlık & Periyot</div>
                  <div style={{ marginTop: '4px' }}>{getHealthBadge(selectedTreeDetails.health)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Sulama: {selectedTreeDetails.wateringPeriodDays} günde bir</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahmini Yaş & Boy</div>
                  <div style={{ fontWeight: '600', marginTop: '2px' }}>{selectedTreeDetails.estimatedAge} Yaşında / {selectedTreeDetails.height} metre</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gönüllü Kotası</div>
                  <div style={{ fontWeight: '600', marginTop: '2px' }}>Maksimum {selectedTreeDetails.maxVolunteers} Gönüllü</div>
                </div>
              </div>

              {/* Volunteers list */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>
                  Sahiplenen Öğrenciler ({selectedTreeDetails.adoptions?.length || 0})
                </h4>
                {selectedTreeDetails.adoptions && selectedTreeDetails.adoptions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTreeDetails.adoptions.map(ad => (
                      <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{ad.user?.name || 'Gönüllü Öğrenci'}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ad.user?.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Bu ağacı henüz sahiplenen bir öğrenci bulunmuyor.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTreeDetails(null)}>
                Kapat
              </button>
              <button className="btn btn-primary" onClick={() => { const t = selectedTreeDetails; setSelectedTreeDetails(null); onOpenEditModal(t); }}>
                <Edit2 size={16} /> Ağacı Düzenle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
