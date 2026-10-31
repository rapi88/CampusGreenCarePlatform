import React, { useState } from 'react';
import { User } from '../api/client';
import { Search, Shield, Award, Mail, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface UsersViewProps {
  users: User[];
}

export const UsersView: React.FC<UsersViewProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      {/* Search and Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Gönüllü adı veya GTÜ e-postası ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <select
            className="form-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            style={{ width: '160px' }}
          >
            <option value="ALL">Tüm Roller</option>
            <option value="USER">Gönüllü Öğrenci</option>
            <option value="ADMIN">Yönetici (Admin)</option>
          </select>
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card-header">
          <div className="cms-card-title">
            <h3>Kayıtlı Gönüllüler & Kullanıcılar ({filteredUsers.length})</h3>
            <p>Platformdaki tüm GTÜ öğrencileri ve yönetim hesapları</p>
          </div>
        </div>

        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>E-Posta</th>
                <th>Rol</th>
                <th>Yeşil Puan</th>
                <th>Doğrulama</th>
                <th>Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    Kriterlere uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-full)',
                          background: user.role === 'ADMIN' ? '#fef3c7' : '#ecfdf5',
                          color: user.role === 'ADMIN' ? '#b45309' : '#047857',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                            {user.name}
                          </div>
                          {user.role === 'ADMIN' && (
                            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>
                              Kampüs Yöneticisi
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <Mail size={14} />
                        {user.email}
                      </div>
                    </td>

                    <td>
                      {user.role === 'ADMIN' ? (
                        <span className="badge badge-sick">
                          <Shield size={12} /> ADMIN
                        </span>
                      ) : (
                        <span className="badge badge-active">
                          GÖNÜLLÜ
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={15} color="#15803d" />
                        <span style={{ fontWeight: '800', color: '#15803d', fontSize: '14px' }}>
                          {user.points} Puan
                        </span>
                      </div>
                    </td>

                    <td>
                      {user.isVerified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#047857', fontSize: '12px', fontWeight: '600' }}>
                          <CheckCircle2 size={15} /> Doğrulandı
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b91c1c', fontSize: '12px', fontWeight: '600' }}>
                          <XCircle size={15} /> Bekliyor
                        </span>
                      )}
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} />
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
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
