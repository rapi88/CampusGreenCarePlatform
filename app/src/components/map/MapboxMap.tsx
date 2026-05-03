// Native Mapbox Map component using @rnmapbox/maps
import React, { useRef } from 'react';
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
}: MapboxMapProps) {
  const cameraRef = useRef<Camera>(null);

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
      styleURL="mapbox://styles/mapbox/outdoors-v12"
      logoEnabled={false}
      attributionEnabled={false}
      compassEnabled={true}
      scaleBarEnabled={false}
      onPress={handleMapPress}
    >
      <Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: initialCenter,
          zoomLevel: initialZoom,
        }}
      />

      {/* Tree markers */}
      {trees.map((tree) => (
        <MarkerView
          key={tree.id}
          coordinate={[tree.longitude, tree.latitude]}
        >
          <TouchableOpacity
            style={[
              styles.markerContainer,
              selectedTreeId === tree.id && styles.markerSelected,
            ]}
            onPress={() => handleMarkerPress(tree)}
          >
            <View style={[styles.markerDot, { backgroundColor: statusColors[tree.hydrationStatus] || '#999' }]}>
              <Text style={styles.markerEmoji}>🌳</Text>
            </View>
            <Text style={styles.markerLabel}>{tree.name}</Text>
            <View style={[styles.markerArrow, { borderTopColor: selectedTreeId === tree.id ? Colors.greenPrimary : Colors.white }]} />
          </TouchableOpacity>
        </MarkerView>
      ))}

      {/* Pending pin for new tree */}
      {pendingPin && (
        <MarkerView coordinate={[pendingPin.lng, pendingPin.lat]}>
          <View style={styles.pendingMarkerContainer}>
            <View style={styles.pendingDot}>
              <Text style={styles.pendingEmoji}>📍</Text>
            </View>
            <Text style={styles.pendingLabel}>New Tree</Text>
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
    transform: [{ scale: 1.15 }],
  },
  markerDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
    ...Shadow.card,
  },
  markerEmoji: { fontSize: 18 },
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
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
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
