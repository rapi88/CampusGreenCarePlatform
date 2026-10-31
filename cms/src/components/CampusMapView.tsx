import React, { useState } from 'react';
import { Tree } from '../api/client';
import { MapPin, Navigation, Eye, CheckCircle2, AlertTriangle, Users, Calendar } from 'lucide-react';

interface CampusMapViewProps {
  trees: Tree[];
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({ trees }) => {
  const [selectedTree, setSelectedTree] = useState<Tree | null>(trees[0] || null);
  const [filterHealth, setFilterHealth] = useState<string>('ALL');

  const filteredTrees = trees.filter(t => filterHealth === 'ALL' || t.health === filterHealth);

  // GTU campus coordinate bounding box for relative positioning on canvas
  // Approx GTU Gebze Campus bounds:
  // Lat: 40.8000 to 40.8120
  // Lng: 29.3520 to 29.3700
  const minLat = 40.8000;
  const maxLat = 40.8120;
  const minLng = 29.3520;
  const maxLng = 29.3700;

  const getRelativePosition = (lat: number, lng: number) => {
    // x from 5% to 95% based on longitude
    const x = Math.min(Math.max(((lng - minLng) / (maxLng - minLng)) * 100, 5), 95);
    // y from 5% to 95% based on latitude (inverted because north is up)
    const y = Math.min(Math.max((1 - (lat - minLat) / (maxLat - minLat)) * 100, 5), 95);
    return { left: `${x}%`, top: `${y}%` };
  };

  const getPinColor = (health: string) => {
    switch (health) {
      case 'HEALTHY':
        return '#10b981';
      case 'SICK':
        return '#f59e0b';
      case 'CRITICAL':
        return '#ef4444';
      default:
        return '#15803d';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
            GTÜ Kampüs Ağaç Haritası
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Gebze Teknik Üniversitesi yerleşkesindeki ağaçların konum ve sağlık haritası
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'HEALTHY', 'SICK', 'CRITICAL'] as const).map(h => (
            <button
              key={h}
              className={`btn ${filterHealth === h ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setFilterHealth(h)}
            >
              {h === 'ALL' ? 'Tümü' : h === 'HEALTHY' ? 'Sağlıklı' : h === 'SICK' ? 'Hasta' : 'Kritik'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Interactive Campus Map Canvas */}
        <div
          style={{
            height: '560px',
            background: 'radial-gradient(ellipse at 50% 50%, #f0fdf4 0%, #ecfdf5 40%, #e2e8f0 100%)',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid #cbd5e1',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Grid Lines and Campus zones */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(#15803d15 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.6,
          }} />

          {/* Campus Landmarks representation */}
          <div style={{ position: 'absolute', top: '15%', left: '20%', padding: '6px 14px', background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-md)', border: '1px dashed #94a3b8', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
            🏢 Mühendislik Fakültesi Bölgesi
          </div>
          <div style={{ position: 'absolute', top: '48%', left: '42%', padding: '6px 14px', background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-md)', border: '1px dashed #94a3b8', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
            🏛️ Rektörlük & Çayır Alanı
          </div>
          <div style={{ position: 'absolute', bottom: '18%', right: '25%', padding: '6px 14px', background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-md)', border: '1px dashed #94a3b8', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
            📚 Kütüphane & Öğrenci Meydanı
          </div>

          {/* Tree Pins */}
          {filteredTrees.map(tree => {
            const pos = getRelativePosition(tree.latitude, tree.longitude);
            const isSelected = selectedTree?.id === tree.id;
            const color = getPinColor(tree.health);

            return (
              <div
                key={tree.id}
                onClick={() => setSelectedTree(tree)}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 20 : 10,
                  transition: 'transform 0.2s',
                }}
              >
                <div
                  style={{
                    width: isSelected ? '40px' : '32px',
                    height: isSelected ? '40px' : '32px',
                    borderRadius: 'var(--radius-full)',
                    background: '#ffffff',
                    border: `3px solid ${color}`,
                    boxShadow: isSelected ? `0 0 16px ${color}80` : 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isSelected ? '18px' : '15px',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease-out',
                  }}
                  title={`${tree.name} (${tree.species})`}
                >
                  🌳
                </div>
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-sidebar)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    marginTop: '4px',
                    boxShadow: 'var(--shadow-md)',
                  }}>
                    {tree.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Compass / Legend overlay */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '11px', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> Sağlıklı
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} /> Hasta
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> Kritik
            </span>
          </div>
        </div>

        {/* Selected Tree Detail Panel */}
        {selectedTree ? (
          <div className="cms-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  🌳
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                    {selectedTree.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {selectedTree.species}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Konum</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>
                  <MapPin size={14} color="#15803d" />
                  {selectedTree.location}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '20px' }}>
                  {selectedTree.latitude.toFixed(6)}, {selectedTree.longitude.toFixed(6)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Sağlık Durumu</span>
                <div style={{ marginTop: '4px' }}>
                  {selectedTree.health === 'HEALTHY' && <span className="badge badge-healthy">Sağlıklı</span>}
                  {selectedTree.health === 'SICK' && <span className="badge badge-sick">Bakım Gerekli (Hasta)</span>}
                  {selectedTree.health === 'CRITICAL' && <span className="badge badge-critical">Kritik</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Yaş</span>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{selectedTree.estimatedAge} Yıl</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Boy</span>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{selectedTree.height} m</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Gönüllü Kotası</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '13px', fontWeight: '600' }}>
                  <Users size={14} color="#64748b" />
                  {selectedTree.adoptions?.length || 0} / {selectedTree.maxVolunteers} Öğrenci
                </div>
              </div>

              {selectedTree.isNaturalMonument && (
                <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', color: '#92400e', fontSize: '12px', fontWeight: '600' }}>
                  🏛️ Koruma Altında Doğal Anıt Ağaç
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <a
                  href={`https://www.google.com/maps?q=${selectedTree.latitude},${selectedTree.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  <Navigation size={14} /> Google Haritalar'da Aç
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="cms-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Detaylarını görmek için haritadan bir ağaca tıklayın.
          </div>
        )}
      </div>
    </div>
  );
};
