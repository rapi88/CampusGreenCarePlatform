import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { useQuery } from '@tanstack/react-query';
import { awardApi } from '../../api/award.api';

export default function AwardsScreen() {
  const { data: awardResp, isLoading } = useQuery({
    queryKey: ['weeklyAward'],
    queryFn: () => awardApi.getWeeklyAward()
  });
  
  const topWatererPhotoUrl = awardResp?.data?.photoUrl;
  const awardText = awardResp?.data?.text;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Ödüller</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Haftanın En Çok Sulayanı 💧</Text>
          <Text style={styles.cardSubtitle}>
            Kampüsümüzü yeşillendiren gönüllülerimize teşekkür ederiz!
          </Text>
          {topWatererPhotoUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: topWatererPhotoUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              {awardText ? (
                <View style={styles.textOverlay}>
                  <Text style={styles.overlayText}>{awardText}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Henüz fotoğraf paylaşılmadı.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutralDark },
  content: { padding: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.greenDark, marginBottom: Spacing.xs },
  cardSubtitle: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.md },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutralLight,
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.sm,
  },
  overlayText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutralLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.neutralMid,
    fontSize: 14,
  },
});
