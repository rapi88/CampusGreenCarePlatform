import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Tree } from '../api/client';
import {
  MapPin,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Droplets,
  Users,
  Calendar,
  ExternalLink,
  Edit,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  X,
  Compass,
} from 'lucide-react';

interface CampusMapViewProps {
  trees: Tree[];
  onEditTree?: (tree: Tree) => void;
  onAddTreeAtCoords?: (coords: { lat: number; lng: number }) => void;
}

const MAPBOX_ACCESS_TOKEN =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) ||
  'pk.eyJ1IjoiaW5wZWNhIiwiYSI6ImNtbnhvemgwajA0dmgyb3NhMGk1dDVtNGYifQ.lIG95_Cpb8Mg2K6TADlptg';

// GTÜ Kampüs Koordinatları (Mobile ile birebir aynı)
const INITIAL_CENTER: [number, number] = [29.35769, 40.807147]; // [lng, lat]
const INITIAL_ZOOM = 16;
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [29.338894, 40.798236], // southwest
  [29.371615, 40.815137], // northeast
];

type MapStyleMode = 'satellite' | 'outdoors';
type ColorMode = 'health' | 'hydration';

export const CampusMapView: React.FC<CampusMapViewProps> = ({
  trees,
  onEditTree,
  onAddTreeAtCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pendingMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [selectedTree, setSelectedTree] = useState<Tree | null>(trees[0] || null);
  const [filterHealth, setFilterHealth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('satellite');
  const [colorMode, setColorMode] = useState<ColorMode>('health');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Hydration status calculator
  const computeHydration = useCallback(
    (lastWateredAt: string | undefined | null, periodDays: number) => {
      if (!lastWateredAt) return 'needs_water';
      const diffTime = Date.now() - new Date(lastWateredAt).getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays > periodDays) return 'needs_water';
      if (diffDays > periodDays - 1) return 'due_soon';
      return 'watered';
    },
    [],
  );

  // Filtered trees
  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      const matchHealth = filterHealth === 'ALL' || tree.health === filterHealth;
      const matchSearch =
        searchQuery.trim() === '' ||
        tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tree.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchHealth && matchSearch;
    });
  }, [trees, filterHealth, searchQuery]);

  // Status counts
  const stats = useMemo(() => {
    const total = trees.length;
    const healthy = trees.filter((t) => t.health === 'HEALTHY').length;
    const sick = trees.filter((t) => t.health === 'SICK').length;
    const critical = trees.filter((t) => t.health === 'CRITICAL').length;
    return { total, healthy, sick, critical };
  }, [trees]);

  // Determine marker color
  const getMarkerColor = useCallback(
    (tree: Tree) => {
      if (colorMode === 'hydration') {
        const lastWatered =
          tree.wateringEvents && tree.wateringEvents.length > 0
            ? tree.wateringEvents[0].createdAt
            : undefined;
        const hydration = computeHydration(lastWatered, tree.wateringPeriodDays);
        if (hydration === 'watered') return '#10b981';
        if (hydration === 'due_soon') return '#f59e0b';
        return '#ef4444';
      }

      switch (tree.health) {
        case 'HEALTHY':
          return '#10b981';
        case 'SICK':
          return '#f59e0b';
        case 'CRITICAL':
          return '#ef4444';
        default:
          return '#10b981';
      }
    },
    [colorMode, computeHydration],
  );

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:
        mapStyle === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/outdoors-v12',
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 14,
      pitch: 35,
      maxBounds: CAMPUS_BOUNDS,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );

    map.on('load', () => {
      setIsMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle style switch
  const handleToggleStyle = () => {
    const nextStyle: MapStyleMode = mapStyle === 'satellite' ? 'outdoors' : 'satellite';
    setMapStyle(nextStyle);
    if (mapRef.current) {
      mapRef.current.setStyle(
        nextStyle === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/outdoors-v12',
      );
    }
  };

  // Recenter to GTU
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: 35,
      bearing: 0,
      duration: 1000,
    });
  };

  // Click on map to add tree
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();
    if (canvas) {
      canvas.style.cursor = isAddingMode ? 'crosshair' : '';
    }

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isAddingMode) return;
      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      setPendingCoords(coords);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isAddingMode]);

  // Update Pending Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    if (pendingCoords) {
      const el = document.createElement('div');
      el.className = 'cms-pending-marker';
      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: bounce 0.6s ease infinite alternate;
        ">
          <div style="
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #15803d, #166534);
            border: 3px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(21, 128, 61, 0.6);
            font-size: 20px;
          ">📍</div>
          <div style="
            background: #15803d;
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            margin-top: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">Yeni Ağaç Konumu</div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([pendingCoords.lng, pendingCoords.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setPendingCoords({ lat: lngLat.lat, lng: lngLat.lng });
      });

      pendingMarkerRef.current = marker;
    }
  }, [pendingCoords]);

  // Render tree markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredTrees.forEach((tree) => {
      const isSelected = selectedTree?.id === tree.id;
      const color = getMarkerColor(tree);

      const el = document.createElement('div');
      el.className = `cms-tree-marker ${isSelected ? 'selected' : ''}`;
      el.style.cursor = 'pointer';

      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: scale(${isSelected ? 1.3 : 1});
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <div style="
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '18px' : '15px'};
            box-shadow: ${
              isSelected
                ? `0 0 0 4px ${color}40, 0 8px 18px rgba(0,0,0,0.35)`
                : '0 3px 8px rgba(0,0,0,0.22)'
            };
          ">
            🌳
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${color};
            margin-top: -1px;
          "></div>
          ${
            isSelected
              ? `<div style="
                  background: rgba(15, 23, 42, 0.95);
                  color: #ffffff;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 700;
                  margin-top: 3px;
                  white-space: nowrap;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                ">${tree.name}</div>`
              : ''
          }
        </div>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setSelectedTree(tree);
        map.flyTo({
          center: [tree.longitude, tree.latitude],
          zoom: 17.5,
          pitch: 45,
          duration: 700,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([tree.longitude, tree.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredTrees, selectedTree, isMapReady, getMarkerColor]);

  const handleSelectTreeFromList = (tree: Tree) => {
    setSelectedTree(tree);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [tree.longitude, tree.latitude],
        zoom: 17.5,
        pitch: 45,
        duration: 700,
      });
    }
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const photoSrc = selectedTree?.photoPath
    ? selectedTree.photoPath.startsWith('http')
      ? selectedTree.photoPath
      : `/uploads/${selectedTree.photoPath.replace(/^.*uploads\//, '')}`
    : null;

  return (
    <div>
      {/* Top Filter and Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '800',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🗺️ GTÜ Kampüs Ağaç Haritası
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Mapbox uydu ve yerleşim katmanı ile canlı GTÜ kampüs ağaç envanteri
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Map Style Toggle */}
          <button
            onClick={handleToggleStyle}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '600' }}
            title="Uydu ve standart harita arasında geçiş yap"
          >
            <Layers size={15} />
            {mapStyle === 'satellite' ? '🛰️ Uydu Görünümü' : '🗺️ Standart Harita'}
          </button>

          {/* Recenter Campus */}
          <button
            onClick={handleRecenter}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '600' }}
            title="Haritayı GTÜ kampüs merkezine odakla"
          >
            <Compass size={15} />
            GTÜ'ye Odaklan
          </button>

          {/* Add tree by clicking on map */}
          {onAddTreeAtCoords && (
            <button
              onClick={() => {
                setIsAddingMode(!isAddingMode);
                if (isAddingMode) setPendingCoords(null);
              }}
              className={`btn ${isAddingMode ? 'btn-danger' : 'btn-primary'}`}
              style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '600' }}
            >
              {isAddingMode ? (
                <>
                  <X size={15} /> İptal Et
                </>
              ) : (
                <>
                  <PlusCircle size={15} /> Haritadan Ağaç Ekle
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Adding Mode Notification Banner */}
      {isAddingMode && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            border: '2px dashed #10b981',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📍</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#065f46' }}>
                Konum Seçme Modu Aktif
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                {pendingCoords
                  ? `Seçilen Koordinat: ${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`
                  : 'Yeni ağaç eklemek istediğiniz noktaya harita üzerinden tıklayın.'}
              </div>
            </div>
          </div>

          {pendingCoords && (
            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
              onClick={() => {
                onAddTreeAtCoords?.(pendingCoords);
                setIsAddingMode(false);
                setPendingCoords(null);
              }}
            >
              Bu Konumla Ağaç Oluştur ➔
            </button>
          )}
        </div>
      )}

      {/* Search and Filter Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          marginBottom: '16px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            placeholder="Ağaç adı, tür veya konum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Health Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${filterHealth === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '12px' }}
            onClick={() => setFilterHealth('ALL')}
          >
            Tümü ({stats.total})
          </button>
          <button
            className={`btn ${filterHealth === 'HEALTHY' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              borderColor: filterHealth === 'HEALTHY' ? undefined : '#10b98140',
            }}
            onClick={() => setFilterHealth('HEALTHY')}
          >
            🟢 Sağlıklı ({stats.healthy})
          </button>
          <button
            className={`btn ${filterHealth === 'SICK' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              borderColor: filterHealth === 'SICK' ? undefined : '#f59e0b40',
            }}
            onClick={() => setFilterHealth('SICK')}
          >
            🟡 Hasta ({stats.sick})
          </button>
          <button
            className={`btn ${filterHealth === 'CRITICAL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              borderColor: filterHealth === 'CRITICAL' ? undefined : '#ef444440',
            }}
            onClick={() => setFilterHealth('CRITICAL')}
          >
            🔴 Kritik ({stats.critical})
          </button>
        </div>

        {/* Color Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Renklendirme:
          </span>
          <button
            className={`btn ${colorMode === 'health' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={() => setColorMode('health')}
          >
            Sağlık
          </button>
          <button
            className={`btn ${colorMode === 'hydration' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={() => setColorMode('hydration')}
          >
            <Droplets size={12} /> Sulama
          </button>
        </div>
      </div>

      {/* Main Grid: Mapbox Canvas & Tree Details Side Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: '20px' }}>
        {/* Mapbox Map Viewport */}
        <div
          style={{
            height: '640px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
          }}
        >
          {/* Map Container */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Campus Zone Indicator Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            GTÜ Çayırova Yerleşkesi ({filteredTrees.length} Ağaç Görünüyor)
          </div>

          {/* Map Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {colorMode === 'health' ? (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10b981',
                    }}
                  />
                  Sağlıklı
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                    }}
                  />
                  Hasta
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ef4444',
                    }}
                  />
                  Kritik
                </span>
              </>
            ) : (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10b981',
                    }}
                  />
                  Sulandı
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                    }}
                  />
                  Yakında Gerekli
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ef4444',
                    }}
                  />
                  Su Gerekli
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tree Detail Panel (Right Column) */}
        {selectedTree ? (
          <div
            className="cms-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '640px',
              overflowY: 'auto',
            }}
          >
            {/* Tree Image or Header Cover */}
            <div
              style={{
                height: '150px',
                background: photoSrc
                  ? `url(${photoSrc}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #15803d, #047857)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 70%)',
                }}
              />
              <div style={{ position: 'relative', zIndex: 2, color: '#ffffff', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', lineHeight: 1.2 }}>
                      {selectedTree.name}
                    </h4>
                    <div style={{ fontSize: '13px', opacity: 0.9, fontStyle: 'italic' }}>
                      {selectedTree.species}
                    </div>
                  </div>
                  {selectedTree.isNaturalMonument && (
                    <span
                      style={{
                        background: '#f59e0b',
                        color: '#000',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      🏛️ ANIT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tree Details Body */}
            <div
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                flex: 1,
              }}
            >
              {/* Health and Status Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Sağlık Durumu
                </span>
                <div>
                  {selectedTree.health === 'HEALTHY' && (
                    <span className="badge badge-healthy">Sağlıklı</span>
                  )}
                  {selectedTree.health === 'SICK' && (
                    <span className="badge badge-sick">Bakım Gerekli (Hasta)</span>
                  )}
                  {selectedTree.health === 'CRITICAL' && (
                    <span className="badge badge-critical">Kritik</span>
                  )}
                </div>
              </div>

              {/* Location Text & GPS */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
                  <MapPin size={15} color="#15803d" />
                  {selectedTree.location}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    GPS: {selectedTree.latitude.toFixed(6)}, {selectedTree.longitude.toFixed(6)}
                  </span>
                  <button
                    onClick={() => handleCopyCoords(selectedTree.latitude, selectedTree.longitude)}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '11px', height: '24px' }}
                    title="Koordinatları kopyala"
                  >
                    {copiedCoords ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedCoords ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  style={{
                    background: 'var(--bg-main)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Tahmini Yaş
                  </span>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>
                    {selectedTree.estimatedAge} Yıl
                  </div>
                </div>
                <div
                  style={{
                    background: 'var(--bg-main)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Ağaç Boyu
                  </span>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>
                    {selectedTree.height} m
                  </div>
                </div>
                <div
                  style={{
                    background: 'var(--bg-main)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Sulama Periyodu
                  </span>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '13px',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Droplets size={13} color="#0284c7" />
                    {selectedTree.wateringPeriodDays} Günde Bir
                  </div>
                </div>
                <div
                  style={{
                    background: 'var(--bg-main)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Gönüllü Kotası
                  </span>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '13px',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Users size={13} color="#64748b" />
                    {selectedTree.adoptions?.length || 0} / {selectedTree.maxVolunteers}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                {onEditTree && (
                  <button
                    onClick={() => onEditTree(selectedTree)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Edit size={14} /> Ağaç Bilgilerini Düzenle
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps?q=${selectedTree.latitude},${selectedTree.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> Google Haritalar'da Aç
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State or Tree Quick Finder */
          <div
            className="cms-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              height: '640px',
            }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🌲</div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                Ağaç Seçin
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Detayları incelemek ve yönetmek için haritadan veya aşağıdaki listeden bir ağaca tıklayın.
              </p>
            </div>

            {/* Tree Mini List */}
            <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTrees.slice(0, 15).map((tree) => (
                <div
                  key={tree.id}
                  onClick={() => handleSelectTreeFromList(tree)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#15803d';
                    e.currentTarget.style.background = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-main)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{tree.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tree.location}</div>
                  </div>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getMarkerColor(tree),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
