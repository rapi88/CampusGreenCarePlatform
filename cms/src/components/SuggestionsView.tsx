import React, { useState } from 'react';
import { Tree } from '../api/client';
import { Check, X, MapPin, User, Calendar, Image, AlertCircle } from 'lucide-react';

interface SuggestionsViewProps {
  suggestions: Tree[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
}

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  suggestions,
  onApprove,
  onReject,
}) => {
  const [rejectingTree, setRejectingTree] = useState<Tree | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await onApprove(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingTree) return;
    setActionLoading(rejectingTree.id);
    try {
      await onReject(rejectingTree.id, rejectReason);
      setRejectingTree(null);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="cms-card">
        <div className="cms-card-header">
          <div className="cms-card-title">
            <h3>Öğrenci Ağaç Önerileri ({suggestions.length})</h3>
            <p>Mobil uygulama üzerinden öğrenciler tarafından kampüse eklenmesi önerilen ağaçlar</p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
              Bekleyen Ağaç Önerisi Yok
            </h4>
            <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
              Şu anda onay bekleyen yeni bir öğrenci ağaç önerisi bulunmuyor. Yeni öneriler geldiğinde burada listelenecektir.
            </p>
          </div>
        ) : (
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {suggestions.map(tree => (
              <div
                key={tree.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Photo or placeholder banner */}
                <div style={{ height: '180px', width: '100%', background: '#f1f5f9', position: 'relative' }}>
                  {tree.photoPath ? (
                    <img
                      src={tree.photoPath.startsWith('http') ? tree.photoPath : `/uploads/${tree.photoPath.replace(/^.*uploads\//, '')}`}
                      alt={tree.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '48px' }}>
                      🌱
                    </div>
                  )}
                  <span className="badge badge-pending" style={{ position: 'absolute', top: '12px', right: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    Onay Bekliyor
                  </span>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>
                    {tree.name}
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '14px' }}>
                    {tree.species}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                      <MapPin size={15} color="#15803d" />
                      <span>{tree.location}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '21px' }}>
                      Koordinat: {tree.latitude.toFixed(5)}, {tree.longitude.toFixed(5)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Calendar size={15} />
                      <span>Öneri Tarihi: {new Date(tree.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-success"
                      style={{ flex: 1 }}
                      disabled={actionLoading === tree.id}
                      onClick={() => handleApprove(tree.id)}
                    >
                      <Check size={16} /> {actionLoading === tree.id ? 'İşleniyor...' : 'Onayla & Ekle'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                      disabled={actionLoading === tree.id}
                      onClick={() => setRejectingTree(tree)}
                    >
                      <X size={16} /> Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingTree && (
        <div className="modal-overlay" onClick={() => setRejectingTree(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Öneriyi Reddet</h3>
              <button className="modal-close-btn" onClick={() => setRejectingTree(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <strong>{rejectingTree.name}</strong> önerisini reddetme nedeninizi belirtebilirsiniz. Bu bilgi öğrenciye gösterilecektir.
              </p>

              <div className="form-group">
                <label className="form-label">Reddetme Nedeni (İsteğe Bağlı)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Örn: Bu ağaç daha önce kayıt altına alınmıştı veya koordinat kampüs sınırları dışındadır..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectingTree(null)}>
                İptal
              </button>
              <button className="btn btn-danger" onClick={handleConfirmReject} disabled={actionLoading === rejectingTree.id}>
                {actionLoading === rejectingTree.id ? 'Reddediliyor...' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
