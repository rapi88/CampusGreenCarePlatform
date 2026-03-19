// TreeCard — compact card used in My Trees list, search results
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../common/StatusChip';
import { Tree } from '../../api/trees.api';
import { relativeTime } from '../../utils/formatters';

interface TreeCardProps {
  tree: Tree;
  onPress: () => void;
  distance?: string;
}

export default function TreeCard({ tree, onPress, distance }: TreeCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={
          tree.photoUrl
            ? { uri: tree.photoUrl }
            : require('../../assets/placeholder_tree.png')
        }
        style={styles.image}
      />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{tree.name}</Text>
          <StatusChip status={tree.status} size="sm" />
        </View>
        <Text style={styles.location} numberOfLines={1}>📍 {tree.location}</Text>
        {tree.lastWateredAt && (
          <Text style={styles.watered}>💧 {relativeTime(tree.lastWateredAt)}</Text>
        )}
        {distance && <Text style={styles.distance}>📏 {distance}</Text>}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  image: { width: 64, height: 64, borderRadius: Radius.md, marginRight: Spacing.md },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark, flex: 1, marginRight: 8 },
  location: { fontSize: 12, color: Colors.neutralMid, marginBottom: 2 },
  watered: { fontSize: 12, color: Colors.neutralMid },
  distance: { fontSize: 12, color: Colors.greenPrimary, fontWeight: '500' },
  arrow: { fontSize: 22, color: Colors.neutralLight, marginLeft: 8 },
});
