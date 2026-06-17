// Web-specific Mapbox Map component using mapbox-gl directly
import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';

// We'll load mapbox-gl dynamically to avoid Metro issues with CSS
let mapboxgl: any = null;

interface TreeMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hydrationStatus: string;
}

interface MapboxMapProps {
  trees: TreeMarker[];
  selectedTreeId: string | null;
  onMarkerPress: (tree: TreeMarker) => void;
  initialCenter: [number, number]; // [lng, lat]
  initialZoom: number;
  // Admin add-tree mode
  isAddingTree?: boolean;
  pendingPin?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  maxBounds?: { ne: [number, number]; sw: [number, number] };
  followUserLocation?: boolean;
  userLocation?: { lat: number; lng: number; accuracy?: number | null } | null;
  mapStyle?: 'outdoors' | 'satellite';
}

const statusColors: Record<string, string> = {
  watered: '#4CAF50',
  needs_water: '#F44336',
  due_soon: '#FF9800',
};

export default function MapboxMap({
  trees,
  selectedTreeId,
  onMarkerPress,
  initialCenter,
  initialZoom,
  isAddingTree = false,
  pendingPin = null,
  onMapClick,
  maxBounds,
  followUserLocation,
  userLocation,
  mapStyle = 'satellite',
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pendingMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const clickHandlerRef = useRef<((e: any) => void) | null>(null);
  // Store latest callback refs so listeners always call the latest version
  const onMapClickRef = useRef(onMapClick);
  const isAddingTreeRef = useRef(isAddingTree);

  // Keep refs in sync
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    isAddingTreeRef.current = isAddingTree;
  }, [isAddingTree]);

  useEffect(() => {
    // Dynamically load mapbox-gl and its CSS
    const loadMapbox = async () => {
      // Inject CSS first (before JS import) so the browser loads it in parallel
      if (!document.querySelector('[data-mapboxgl-css]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css';
        cssLink.setAttribute('data-mapboxgl-css', '');
        document.head.appendChild(cssLink);
      }

      if (!mapboxgl) {
        mapboxgl = (await import('mapbox-gl')).default;
      }

      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      if (mapContainer.current && !mapRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/outdoors-v12',
          center: initialCenter,
          zoom: initialZoom,
          minZoom: 15.829358883792652,
          pitch: 30,
          maxBounds: maxBounds ? [maxBounds.sw, maxBounds.ne] : [[29.344522, 40.805187], [29.364289, 40.814912]],
        });

        // Inject dynamic CSS variables to root for markers
        const updateMarkerStyles = () => {
          const currentZoom = map.getZoom();
          // Scale formula: double size for every zoom level above 18
          const baseScale = Math.pow(2, currentZoom - 18);
          const clampedScale = Math.min(baseScale, 4); // Max 4x size
          document.documentElement.style.setProperty('--map-marker-scale', clampedScale.toString());
        };

        map.on('zoom', updateMarkerStyles);

        // Add User Location indicator
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: false,
          showAccuracyCircle: false,
        });
        map.addControl(geolocate);
        
        map.on('load', () => {
          geolocate.trigger(); // Trigger automatically to show the blue dot
        });

        updateMarkerStyles(); // Initial call
        
        map.on('zoomend', () => {
          console.log('Current Zoom Level (Web):', map.getZoom());
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }));

        // Single click handler — uses refs so it stays current
        const handler = (e: any) => {
          if (isAddingTreeRef.current && onMapClickRef.current) {
            onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          }
        };
        map.on('click', handler);
        clickHandlerRef.current = handler;

        mapRef.current = map;
      }
    };

    loadMapbox();

    return () => {
      if (mapRef.current) {
        if (clickHandlerRef.current) {
          mapRef.current.off('click', clickHandlerRef.current);
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map style when mapStyle prop changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(
        mapStyle === 'satellite' 
          ? 'mapbox://styles/mapbox/satellite-streets-v12' 
          : 'mapbox://styles/mapbox/outdoors-v12'
      );
    }
  }, [mapStyle]);

  // Change cursor based on adding mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    if (canvas) {
      canvas.style.cursor = isAddingTree ? 'crosshair' : '';
    }
  }, [isAddingTree]);

  // Update tree markers when trees or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapboxgl) return;

    const addMarkers = () => {
      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      trees.forEach((tree) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'tree-marker';
        const isSelected = tree.id === selectedTreeId;

        el.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transform: scale(calc(var(--map-marker-scale, 1) * ${isSelected ? 1.25 : 1}));
            transition: transform 0.1s linear;
          ">
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${statusColors[tree.hydrationStatus] || '#999'};
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              font-size: 12px;
            ">🌳</div>
            <div style="
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 4px solid white;
            "></div>
          </div>
        `;

        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onMarkerPress(tree);
          map.flyTo({
            center: [tree.longitude, tree.latitude],
            zoom: 17,
            duration: 600,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([tree.longitude, tree.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.on('load', addMarkers);
    }
  }, [trees, selectedTreeId, onMarkerPress]);

  // Show / update pending pin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapboxgl) return;

    // Remove old pending marker
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    if (pendingPin) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: bounce 0.5s ease;
        ">
          <div style="
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(76,175,80,0.5);
            font-size: 22px;
          ">📍</div>
          <div style="
            background: #2E7D32;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            margin-top: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            white-space: nowrap;
          ">Yeni Ağaç</div>
          <div style="
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 7px solid #2E7D32;
          "></div>
        </div>
      `;

      // Add bounce animation style
      if (!document.getElementById('pending-pin-style')) {
        const style = document.createElement('style');
        style.id = 'pending-pin-style';
        style.textContent = `
          @keyframes bounce {
            0% { transform: translateY(-20px); opacity: 0; }
            60% { transform: translateY(4px); opacity: 1; }
            100% { transform: translateY(0); }
          }
        `;
        document.head.appendChild(style);
      }

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([pendingPin.lng, pendingPin.lat])
        .addTo(map);

      // Update pin position on drag
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        if (onMapClickRef.current) {
          onMapClickRef.current({ lat: lngLat.lat, lng: lngLat.lng });
        }
      });

      pendingMarkerRef.current = marker;
    }
  }, [pendingPin]);

  // Show / update live user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapboxgl) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    if (!document.getElementById('user-location-marker-style')) {
      const style = document.createElement('style');
      style.id = 'user-location-marker-style';
      style.textContent = `
        @keyframes user-location-pulse {
          0% { transform: scale(0.75); opacity: 0.55; }
          70% { transform: scale(1.3); opacity: 0.08; }
          100% { transform: scale(0.75); opacity: 0.55; }
        }
      `;
      document.head.appendChild(style);
    }

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        ">
          <div style="
            position: absolute;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(33, 150, 243, 0.16);
            border: 1px solid rgba(33, 150, 243, 0.24);
            animation: user-location-pulse 1.8s ease-out infinite;
          "></div>
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #2196F3;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(33,150,243,0.45);
            z-index: 1;
          ">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: white;
            "></div>
          </div>
          <div style="
            background: #1976D2;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            margin-top: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.18);
            white-space: nowrap;
            z-index: 1;
          ">Konumum</div>
        </div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
      return;
    }

    userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <div
        ref={mapContainer as any}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
