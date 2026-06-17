// Native Mapbox Map component using @rnmapbox/maps
import React, { useRef, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Mapbox, { Camera, MapView, MarkerView } from '@rnmapbox/maps';
import { Colors } from '../../theme/colors';
import { Shadow } from '../../theme/spacing';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

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
  mapStyle = 'satellite',
}: MapboxMapProps) {
  const cameraRef = useRef<Camera>(null);
  
  // NOTE FOR DEVELOPERS: 
  // We use this state to dynamically scale markers based on the map's zoom level.
  // If you experience performance issues or lag while dragging the map (because of too many re-renders),
  // you can remove this state, remove the `onCameraChanged` listener, and remove the `transform: [{ scale }]` 
  // from the markers to fall back to fixed-size markers.
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  const handleMarkerPress = (tree: TreeMarker) => {
    onMarkerPress(tree);
    cameraRef.current?.setCamera({
      centerCoordinate: [tree.longitude, tree.latitude],
      zoomLevel: 17,
      animationDuration: 600,
    });
  };

  const handleMapPress = (event: any) => {
    if (isAddingTree && onMapClick) {
      const { geometry } = event;
      if (geometry && geometry.coordinates) {
        onMapClick({
          lat: geometry.coordinates[1],
          lng: geometry.coordinates[0],
        });
      }
    }
  };

  return (
    <MapView
      style={styles.map}
      styleURL={mapStyle === 'satellite' ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/outdoors-v12"}
      logoEnabled={false}
      attributionEnabled={false}
      compassEnabled={true}
      scaleBarEnabled={false}
      onPress={handleMapPress}
      onCameraChanged={(state) => {
        setCurrentZoom(state.properties.zoom);
        console.log('Current Zoom Level (Native):', state.properties.zoom);
      }}
    >
      <Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: initialCenter,
          zoomLevel: initialZoom,
        }}
        minZoomLevel={15.829358883792652}
        maxBounds={maxBounds || {
          ne: [29.364289, 40.814912],
          sw: [29.344522, 40.805187],
        }}
        followUserLocation={followUserLocation}
        followZoomLevel={followUserLocation ? initialZoom : undefined}
      />
        <Mapbox.UserLocation 
          visible={true}
          showsUserHeadingIndicator={false} 
        />

      {/* Tree markers */}
      {trees.map((tree) => {
        const isSelected = selectedTreeId === tree.id;
        
        // Scale formula: double size for every zoom level above 18
        // Base size is smaller so it looks good when zoomed out
        const baseScale = Math.pow(2, currentZoom - 18);
        const clampedScale = Math.min(baseScale, 4); // Max 4x size
        const finalScale = isSelected ? clampedScale * 1.25 : clampedScale;

        return (
          <MarkerView
            key={tree.id}
            coordinate={[tree.longitude, tree.latitude]}
          >
            <TouchableOpacity
              style={[
                styles.markerContainer,
                { transform: [{ scale: finalScale }] }
              ]}
              onPress={() => handleMarkerPress(tree)}
            >
              <View style={[styles.markerDot, { backgroundColor: statusColors[tree.hydrationStatus] || '#999' }]}>
                <Text style={styles.markerEmoji}>🌳</Text>
              </View>
              <View style={[styles.markerArrow, { borderTopColor: isSelected ? Colors.greenPrimary : Colors.white }]} />
            </TouchableOpacity>
          </MarkerView>
        );
      })}

      {/* Pending pin for new tree */}
      {pendingPin && (
        <MarkerView coordinate={[pendingPin.lng, pendingPin.lat]}>
          <View style={styles.pendingMarkerContainer}>
            <View style={styles.pendingDot}>
              <Text style={styles.pendingEmoji}>📍</Text>
            </View>
            <Text style={styles.pendingLabel}>Yeni Ağaç</Text>
            <View style={styles.pendingArrow} />
          </View>
        </MarkerView>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  markerContainer: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  markerSelected: {
    // Scaling is now handled dynamically in the render loop based on zoom
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.card,
  },
  markerEmoji: { fontSize: 12 },
  markerLabel: {
    fontSize: 10,
    color: Colors.neutralDark,
    fontWeight: '700',
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
    overflow: 'hidden',
    ...Shadow.card,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
  },
  // Pending pin styles
  pendingMarkerContainer: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  pendingDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    backgroundColor: Colors.greenPrimary,
    ...Shadow.modal,
  },
  pendingEmoji: { fontSize: 22 },
  pendingLabel: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
    backgroundColor: Colors.greenDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
    ...Shadow.card,
  },
  pendingArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.greenDark,
  },
});
