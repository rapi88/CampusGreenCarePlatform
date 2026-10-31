import React, { useState } from 'react';
import { WateringLog } from '../api/client';
import { Droplets, Calendar, MapPin, Download, CheckCircle, AlertTriangle, Search } from 'lucide-react';

interface WateringViewProps {
  logs: WateringLog[];
  onFilterDate: (from?: string, to?: string) => void;
}

export const WateringView: React.FC<WateringViewProps> = ({ logs, onFilterDate }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterDate(fromDate || undefined, toDate || undefined);
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
    onFilterDate(undefined, undefined);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Ağaç Adı', 'Tür', 'Gönüllü', 'E-Posta', 'GPS Doğrulandı', 'Puan', 'Tarih'];
    const rows = logs.map(l => [
      `"${l.tree?.name || ''}"`,
      `"${l.tree?.species || ''}"`,
      `"${l.user?.name || ''}"`,
      `"${l.user?.email || ''}"`,
      l.gpsVerified ? 'Evet' : 'Hayır',
      l.pointsAwarded,
      `"${new Date(l.createdAt).toLocaleString('tr-TR')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sulama_raporu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      (log.tree?.name || '').toLowerCase().includes(term) ||
      (log.user?.name || '').toLowerCase().includes(term) ||
      (log.tree?.location || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Date Filter & Export Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleApplyFilter} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Başlangıç:</span>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ width: '160px', padding: '8px 12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Bitiş:</span>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ width: '160px', padding: '8px 12px' }}
            />
          </div>

          <button type="submit" className="btn btn-secondary">
            Filtrele
          </button>
          {(fromDate || toDate) && (
            <button type="button" className="btn btn-secondary" onClick={handleResetFilter} style={{ color: 'var(--text-muted)' }}>
              Sıfırla
            </button>
          )}
        </form>

        <button className="btn btn-primary" onClick={handleExportCSV} disabled={logs.length === 0}>
          <Download size={16} /> Excel / CSV İndir
        </button>
      </div>

      {/* Main Logs Table */}
      <div className="cms-card">
        <div className="cms-card-header">
          <div className="cms-card-title">
            <h3>Sulama Aktiviteleri & Raporu ({filteredLogs.length})</h3>
            <p>Öğrencilerin GPS doğrulama ile gerçekleştirdiği tüm sulama kayıtları</p>
          </div>

          <div style={{ width: '280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Ağaç veya öğrenci ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Ağaç Bilgisi</th>
                <th>Gönüllü Öğrenci</th>
                <th>GPS Doğrulama Durumu</th>
                <th>Kazanılan Puan</th>
                <th>İşlem Zamanı</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    Kayıtlı sulama aktivitesi bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>
                        {log.tree?.name || 'Ağaç'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {log.tree?.species || 'Bilinmiyor'} • {log.tree?.location || ''}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {log.user?.name || 'Gönüllü'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {log.user?.email}
                      </div>
                    </td>

                    <td>
                      {log.gpsVerified ? (
                        <span className="badge badge-healthy">
                          <CheckCircle size={13} /> GPS Doğrulandı (&lt;20m)
                        </span>
                      ) : (
                        <span className="badge badge-sick">
                          <AlertTriangle size={13} /> Manuel Kayıt
                        </span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontWeight: '800', color: '#15803d', fontSize: '14px' }}>
                        +{log.pointsAwarded} Puan
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(log.createdAt).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
