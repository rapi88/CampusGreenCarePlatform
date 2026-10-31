import React, { useState, useEffect } from 'react';
import { Tree } from '../api/client';
import { Upload, X, MapPin } from 'lucide-react';

interface TreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Tree>, photoFile?: File) => Promise<void>;
  initialTree?: Tree | null;
}

export const TreeModal: React.FC<TreeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTree,
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('40.80421');
  const [longitude, setLongitude] = useState('29.36152');
  const [estimatedAge, setEstimatedAge] = useState('5');
  const [height, setHeight] = useState('3.5');
  const [wateringPeriodDays, setWateringPeriodDays] = useState('3');
  const [maxVolunteers, setMaxVolunteers] = useState('4');
  const [health, setHealth] = useState<'HEALTHY' | 'SICK' | 'CRITICAL'>('HEALTHY');
  const [isNaturalMonument, setIsNaturalMonument] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTree) {
      setName(initialTree.name);
      setSpecies(initialTree.species);
      setLocation(initialTree.location);
      setLatitude(initialTree.latitude.toString());
      setLongitude(initialTree.longitude.toString());
      setEstimatedAge(initialTree.estimatedAge.toString());
      setHeight(initialTree.height.toString());
      setWateringPeriodDays(initialTree.wateringPeriodDays.toString());
      setMaxVolunteers(initialTree.maxVolunteers.toString());
      setHealth(initialTree.health);
      setIsNaturalMonument(initialTree.isNaturalMonument);
      setPreviewUrl(initialTree.photoPath || null);
    } else {
      setName('');
      setSpecies('');
      setLocation('');
      setLatitude('40.80421');
      setLongitude('29.36152');
      setEstimatedAge('5');
      setHeight('3.5');
      setWateringPeriodDays('3');
      setMaxVolunteers('4');
      setHealth('HEALTHY');
      setIsNaturalMonument(false);
      setPhotoFile(undefined);
      setPreviewUrl(null);
    }
    setError(null);
  }, [initialTree, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Ağaç adı zorunludur');
    if (!species.trim()) return setError('Ağaç türü zorunludur');
    if (!location.trim()) return setError('Konum açıklaması zorunludur');

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        species: species.trim(),
        location: location.trim(),
        latitude: parseFloat(latitude) || 40.80421,
        longitude: parseFloat(longitude) || 29.36152,
        estimatedAge: parseInt(estimatedAge, 10) || 0,
        height: parseFloat(height) || 0,
        wateringPeriodDays: parseInt(wateringPeriodDays, 10) || 3,
        maxVolunteers: parseInt(maxVolunteers, 10) || 4,
        health,
        isNaturalMonument,
      }, photoFile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ağaç kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialTree ? 'Ağaç Bilgilerini Güncelle' : 'Yeni Ağaç Kaydı Ekle'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ağaç Adı / Kod</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Rektörlük Çınarı #12"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Botanik / Yaygın Tür</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Platanus orientalis (Doğu Çınarı)"
                  value={species}
                  onChange={e => setSpecies(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Konum / Bölge Açıklaması</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: Bilgisayar Mühendisliği Binası Batı Bahçesi"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Enlem (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Boylam (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sağlık Durumu</label>
                <select
                  className="form-select"
                  value={health}
                  onChange={e => setHealth(e.target.value as any)}
                >
                  <option value="HEALTHY">Sağlıklı (İyi Durumda)</option>
                  <option value="SICK">Hasta (Takip & İlaçlama Gerekli)</option>
                  <option value="CRITICAL">Kritik (Acil Müdahale)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sulama Periyodu (Gün)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={wateringPeriodDays}
                  onChange={e => setWateringPeriodDays(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tahmini Yaş</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={estimatedAge}
                  onChange={e => setEstimatedAge(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Boy (Metre)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Maksimum Gönüllü Sayısı</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-input"
                  value={maxVolunteers}
                  onChange={e => setMaxVolunteers(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={isNaturalMonument}
                    onChange={e => setIsNaturalMonument(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>🏛️ Doğal Anıt Ağaç Statüsü</span>
                </label>
              </div>
            </div>

            {/* Photo upload section */}
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label">Ağaç Fotoğrafı</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Önizleme"
                    style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Upload size={22} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="tree-photo-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="tree-photo-input" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    <Upload size={16} /> Fotoğraf Seç
                  </label>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG veya WEBP (Max 10MB)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : initialTree ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
