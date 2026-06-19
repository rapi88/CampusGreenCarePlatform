import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import StatusChip from "../../components/common/StatusChip";
import {
  useMapStore,
  TreeStatus as FrontendTreeStatus,
} from "../../store/map.store";
import { useAuthStore } from "../../store/auth.store";
import { formatDistance, computeHydrationStatus } from "../../utils/formatters";
import { haversineDistance } from "../../utils/geo";
import MapboxMap from "../../components/map/MapboxMap";
import AddTreeModal from "../../components/map/AddTreeModal";
import { treesApi, Tree } from "../../api/trees.api";
import { adminApi } from "../../api/admin.api";
import { extractError } from "../../utils/error";
import {
  hasMatchingTreeIdentity,
  markTreeIdentitySubmitted,
  unmarkTreeIdentitySubmitted,
  wasTreeIdentitySubmitted,
} from "../../utils/treeDuplicate";

const INITIAL_CENTER: [number, number] = [29.35769, 40.807147]; // [lng, lat]
const INITIAL_ZOOM = 15;

const USE_NEW_MAP_LIMITS = true; // Flag to toggle zoom limits and bounding box
const CAMPUS_BOUNDS = {
  ne: [29.371615, 40.815137] as [number, number],
  sw: [29.338894, 40.798236] as [number, number],
};

const { width } = Dimensions.get("window");

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const {
    viewMode,
    setViewMode,
    filterStatus,
    setFilterStatus,
    filterOwnership,
    setFilterOwnership,
    mapStyle,
    toggleMapStyle,
    selectedTreeId,
    setSelectedTree,
    isAddingTree,
    setIsAddingTree,
    isSuggestingTree,
    setIsSuggestingTree,
    pendingPin,
    setPendingPin,
  } = useMapStore();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number | null;
  } | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const applyUserLocation = useCallback((loc: Location.LocationObject) => {
    setUserCoords({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    });
  }, []);

  const loadUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = null;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        loc = await Location.getLastKnownPositionAsync();
      }

      if (loc) {
        applyUserLocation(loc);
      }
    } catch {
      // Distance labels stay hidden until a location is available.
    }
  }, [applyUserLocation]);

  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || !isMounted) return;

        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && isMounted) {
          applyUserLocation(lastKnown);
        }

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 15,
            timeInterval: 5000,
          },
          (loc) => {
            if (isMounted) applyUserLocation(loc);
          },
        );
      } catch {
        // The map still works without live user tracking.
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
    };
  }, [applyUserLocation]);

  useFocusEffect(
    useCallback(() => {
      loadUserLocation();
    }, [loadUserLocation]),
  );

  // Fetch trees (only ACTIVE trees for the map)
  const { data: activeTrees = [] } = useQuery({
    queryKey: ["trees"],
    queryFn: async () => {
      const res = await treesApi.getAll({ status: "ACTIVE" });
      return res.data;
    },
  });

  const { data: myTrees } = useQuery({
    queryKey: ["myTrees"],
    queryFn: async () => {
      const res = await treesApi.getMyTrees();
      return res.data;
    },
    enabled: !!user,
  });

  const finishTreeSubmitFlow = useCallback((message: string) => {
    queryClient.invalidateQueries({ queryKey: ["trees"] });
    queryClient.invalidateQueries({ queryKey: ["myTrees"] });
    queryClient.invalidateQueries({ queryKey: ["my-trees"] });
    queryClient.invalidateQueries({ queryKey: ["trees", "admin"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "suggestions"] });
    Toast.show({
      type: "success",
      position: "top",
      text1: "Başarılı",
      text2: message,
    });
    setShowAddModal(false);
    setIsAddingTree(false);
    setIsSuggestingTree(false);
    setPendingPin(null);
    setViewMode("map");
  }, [
    queryClient,
    setIsAddingTree,
    setIsSuggestingTree,
    setPendingPin,
    setViewMode,
  ]);

  // Admin Create Tree Mutation
  const createTreeMutation = useMutation({
    mutationFn: (data: Partial<Tree>) => adminApi.createTree(data),
    onSuccess: () => finishTreeSubmitFlow("Ağaç başarıyla eklendi"),
    onError: (error, variables) => {
      unmarkTreeIdentitySubmitted(variables);
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: extractError(error),
      });
    },
  });

  const suggestTreeMutation = useMutation({
    mutationFn: (data: Partial<Tree>) => treesApi.suggest(data),
    onSuccess: () => finishTreeSubmitFlow("Ağaç önerinizin admin onayına gönderildi."),
    onError: (error, variables) => {
      unmarkTreeIdentitySubmitted(variables);
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: extractError(error),
      });
    },
  });

  // Add hydrationStatus and distanceM
  const processedTrees = activeTrees.map((t) => ({
    ...t,
    distanceM: userCoords
      ? Math.round(
          haversineDistance(
            userCoords.lat,
            userCoords.lng,
            t.latitude,
            t.longitude,
          ),
        )
      : null,
    hydrationStatus: computeHydrationStatus(
      t.lastWateredAt,
      t.wateringPeriodDays,
    ),
  }));

  const filtered = processedTrees.filter((t) => {
    // 1. Search text match
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase());
      
    // 2. Hydration status match
    const matchStatus = !filterStatus || t.hydrationStatus === filterStatus;
    
    // 3. Ownership match
    let matchOwnership = true;
    if (filterOwnership === 'mine' && myTrees) {
      matchOwnership = myTrees.adopted.some((adoptedTree) => adoptedTree.id === t.id);
    }
    
    return matchSearch && matchStatus && matchOwnership;
  });

  const selectedTree =
    filtered.find((t) => t.id === selectedTreeId) ||
    (filtered.length > 0 ? filtered[0] : null);

  const handleMarkerPress = useCallback(
    (tree: { id: string }) => {
      if (!isAddingTree && !isSuggestingTree) {
        setSelectedTree(tree.id);
      }
    },
    [isAddingTree, isSuggestingTree, setSelectedTree],
  );

  const handleMapClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (isAddingTree || isSuggestingTree) {
        setPendingPin(coords);
        setShowAddModal(true);
      }
    },
    [isAddingTree, isSuggestingTree, setPendingPin],
  );

  const handleToggleAddMode = () => {
    if (isAddingTree || isSuggestingTree) {
      setIsAddingTree(false);
      setIsSuggestingTree(false);
      setPendingPin(null);
    } else if (isAdmin) {
      setIsAddingTree(true);
      setSelectedTree(null);
    }
  };

  const handleAddTreeSubmit = (data: {
    name: string;
    species: string;
    location: string;
    health: "Healthy" | "Sick" | "Critical";
    lat: number;
    lng: number;
  }) => {
    const payload = {
      name: data.name,
      species: data.species,
      location: data.location,
      health: data.health,
      latitude: data.lat,
      longitude: data.lng,
    };
    const knownTrees = [
      ...activeTrees,
      ...(myTrees?.adopted ?? []),
      ...(myTrees?.suggested ?? []),
    ];
    const isDuplicate =
      wasTreeIdentitySubmitted(payload) ||
      hasMatchingTreeIdentity(knownTrees, payload);

    if (isDuplicate) {
      Alert.alert("Ağaç zaten ekli", "Bu ağacı zaten eklediniz.");
      return;
    }

    if (isAddingTree) {
      markTreeIdentitySubmitted(payload);
      setShowAddModal(false);
      setIsAddingTree(false);
      setPendingPin(null);
      setViewMode("map");
      createTreeMutation.mutate(payload);
    } else if (isSuggestingTree) {
      markTreeIdentitySubmitted(payload);
      setShowAddModal(false);
      setIsSuggestingTree(false);
      setPendingPin(null);
      setViewMode("map");
      suggestTreeMutation.mutate(payload);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("../../assets/applogo1.png")} style={styles.logoImage} />
          <Text style={styles.appName}>Ağaç Takip</Text>
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === "map" ? "list" : "map")}
        >
          <Text style={styles.viewToggleText}>
            {viewMode === "map" ? "☰ Liste" : "🗺️ Harita"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add/Suggest banner */}
      {(isAddingTree || isSuggestingTree) && (
        <View style={styles.addBanner}>
          <Text style={styles.addBannerIcon}>📌</Text>
          <Text style={styles.addBannerText}>
            Ağaç konumunu seçmek için haritaya dokunun
          </Text>
        </View>
      )}

      {/* Search */}
      {!(isAddingTree || isSuggestingTree) && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Yakında bir ağaç bulun..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.neutralMid}
            />
          </View>
        </View>
      )}

      {/* Filters Row */}
      {!(isAddingTree || isSuggestingTree) && (
        <View>
          <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.filterScroll}
          contentContainerStyle={styles.filters}
        >
          {user && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterOwnership === 'mine' && styles.filterChipActive,
              ]}
              onPress={() => setFilterOwnership(filterOwnership === 'mine' ? 'all' : 'mine')}
            >
              <Text
                style={[
                  styles.filterText,
                  filterOwnership === 'mine' && styles.filterTextActive,
                ]}
              >
                🌲 Ağaçlarım
              </Text>
            </TouchableOpacity>
          )}

          {[null, "watered", "needs_water"].map((s) => (
            <TouchableOpacity
              key={String(s)}
              style={[
                styles.filterChip,
                filterStatus === s && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(s as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === s && styles.filterTextActive,
                ]}
              >
                {s === null
                  ? "Tümü"
                  : s === "watered"
                    ? "🟢 Sulandı"
                    : "🔴 Su Gerekli"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </View>
      )}

      {/* Map view — real Mapbox */}
      {viewMode === "map" && (
        <View style={styles.mapContainer}>
          <MapboxMap
            trees={filtered as any}
            selectedTreeId={selectedTreeId}
            onMarkerPress={handleMarkerPress}
            initialCenter={INITIAL_CENTER}
            initialZoom={USE_NEW_MAP_LIMITS ? 16 : INITIAL_ZOOM}
            isAddingTree={isAddingTree || isSuggestingTree}
            pendingPin={pendingPin}
            onMapClick={handleMapClick}
            maxBounds={USE_NEW_MAP_LIMITS ? CAMPUS_BOUNDS : undefined}
            followUserLocation={USE_NEW_MAP_LIMITS}
            userLocation={userCoords}
            mapStyle={mapStyle}
          />

          {/* Map Style Toggle */}
          {!(isAddingTree || isSuggestingTree) && (
            <TouchableOpacity 
              style={styles.mapStyleToggle} 
              onPress={toggleMapStyle}
            >
              <Text style={styles.mapStyleToggleText}>
                {mapStyle === 'outdoors' ? '🛰️ Uydu' : '🗺️ Harita'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Bottom preview card */}
          {!(isAddingTree || isSuggestingTree) && selectedTree && (
            <TouchableOpacity
              style={styles.previewCard}
              onPress={() =>
                navigation.navigate("TreeDetail", { treeId: selectedTree.id })
              }
            >
              <View style={styles.previewLeft}>
                <Text style={styles.previewEmoji}>🌳</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{selectedTree.name}</Text>
                <Text style={styles.previewLocation}>
                  📍 {selectedTree.location}
                </Text>
                <View style={styles.previewRow}>
                  <StatusChip
                    status={selectedTree.hydrationStatus as any}
                    size="sm"
                  />
                  <Text style={styles.previewDist}>
                    {selectedTree.distanceM !== null
                      ? `${formatDistance(selectedTree.distanceM)} uzakta`
                      : "Konum bekleniyor"}
                  </Text>
                </View>
              </View>
              <Text style={styles.previewArrow}>›</Text>
            </TouchableOpacity>
          )}

          {/* FAB — add/suggest tree toggle */}
          {viewMode === "map" && isAdmin && (
            <TouchableOpacity
              style={[
                styles.fab,
                (isAddingTree || isSuggestingTree) && styles.fabCancel,
              ]}
              onPress={handleToggleAddMode}
            >
              <Text style={styles.fabText}>
                {isAddingTree || isSuggestingTree ? "✕" : isAdmin ? "＋" : "🌟"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listCard}
              onPress={() =>
                navigation.navigate("TreeDetail", { treeId: item.id })
              }
            >
              <View style={styles.listCardLeft}>
                <Text style={styles.listEmoji}>🌳</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listLoc}>📍 {item.location}</Text>
                <StatusChip status={item.hydrationStatus as any} size="sm" />
              </View>
              <Text style={styles.listDist}>
                {item.distanceM !== null ? formatDistance(item.distanceM) : "—"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Ağaç bulunamadı</Text>
            </View>
          }
        />
      )}

      {/* Add Tree Modal */}
      <AddTreeModal
        visible={showAddModal}
        coordinates={pendingPin}
        onClose={handleCancelAdd}
        onSubmit={handleAddTreeSubmit}
        isSuggesting={isSuggestingTree}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoImage: { width: 40, height: 40, resizeMode: "contain" },
  appName: { fontSize: 20, fontWeight: "700", color: Colors.neutralDark },
  viewToggle: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  viewToggleText: { color: Colors.greenDark, fontWeight: "600", fontSize: 13 },
  // Add-tree banner
  addBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#FFE082",
    gap: 8,
  },
  addBannerIcon: { fontSize: 18 },
  addBannerText: { flex: 1, fontSize: 13, color: "#F57F17", fontWeight: "600" },
  // Search
  searchRow: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    ...Shadow.card,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.neutralDark },
  filterScroll: { flexGrow: 0, marginBottom: Spacing.sm, paddingBottom: 8 },
  filters: { paddingHorizontal: Spacing.md, gap: 8, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
  },
  filterChipActive: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenPrimary,
  },
  filterText: { fontSize: 13, color: Colors.neutralMid, fontWeight: "500" },
  filterTextActive: { color: Colors.greenDark, fontWeight: "600" },
  // Map
  mapContainer: { flex: 1, position: "relative" },
  // Map Style Toggle
  mapStyleToggle: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    ...Shadow.card,
  },
  mapStyleToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralDark,
  },
  // Preview card
  previewCard: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    ...Shadow.modal,
  },
  previewLeft: {
    width: 64,
    height: 64,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  previewEmoji: { fontSize: 32 },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 16, fontWeight: "700", color: Colors.neutralDark },
  previewLocation: { fontSize: 12, color: Colors.neutralMid, marginBottom: 6 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewDist: { fontSize: 12, color: Colors.greenPrimary, fontWeight: "500" },
  previewArrow: { fontSize: 24, color: Colors.neutralLight },
  // FAB — admin add tree button
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.greenPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.modal,
  },
  fabCancel: {
    backgroundColor: Colors.error,
  },
  fabText: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: "300",
    lineHeight: 30,
  },
  // List
  listContainer: { flex: 1 },
  list: {
    flexGrow: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 120,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  listCardLeft: {
    width: 52,
    height: 52,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  listEmoji: { fontSize: 26 },
  listInfo: { flex: 1, gap: 4 },
  listName: { fontSize: 15, fontWeight: "600", color: Colors.neutralDark },
  listLoc: { fontSize: 12, color: Colors.neutralMid },
  listDist: {
    fontSize: 12,
    color: Colors.greenPrimary,
    fontWeight: "600",
    marginLeft: 8,
  },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.neutralMid },
});
