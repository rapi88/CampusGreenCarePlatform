import React, { useState } from 'react';
import { api, User } from '../api/client';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onSuccess: (user: User, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return setError('Lütfen e-posta ve şifrenizi girin');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email.trim(), password);
      if (res.user.role !== 'ADMIN') {
        throw new Error('Bu panele erişim için ADMIN yetkisi gerekmektedir.');
      }
      localStorage.setItem('cms_token', res.token);
      localStorage.setItem('cms_user', JSON.stringify(res.user));
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@gtu.edu.tr');
    setPassword('Admin123!');
    setError(null);
  };

  return (
    <div className="cms-auth-wrap">
      <div className="cms-auth-card">
        <div className="cms-auth-header">
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #10b981 0%, #15803d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
          }}>
            🌿
          </div>
          <h2>Campus Green Care</h2>
          <p>Yönetici & CMS Paneli Girişi</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Yönetici E-Posta</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="admin@gtu.edu.tr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', marginTop: '12px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Giriş Yapılıyor...' : (
              <>
                Panele Giriş Yap <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleQuickFill}
            style={{ width: '100%', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Sparkles size={14} color="#15803d" /> Admin Bilgilerini Otomatik Doldur
          </button>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            admin@gtu.edu.tr / Admin123!
          </p>
        </div>
      </div>
    </div>
  );
};
