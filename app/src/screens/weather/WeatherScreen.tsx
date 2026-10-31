import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { weatherApi, WeatherResponse } from '../../api/weather.api';
import { Colors } from '../../theme/colors';
import { Radius, Shadow, Spacing } from '../../theme/spacing';

const CAMPUS_LOCATION = { latitude: 40.807147, longitude: 29.35769 };

function weatherInfo(code: number) {
  if (code === 0) return { icon: '☀️', label: 'Açık' };
  if (code <= 3) return { icon: '🌤️', label: 'Parçalı bulutlu' };
  if (code <= 48) return { icon: '🌫️', label: 'Sisli' };
  if (code <= 67 || code >= 80) return { icon: '🌧️', label: 'Yağmurlu' };
  if (code <= 77) return { icon: '🌨️', label: 'Karlı' };
  return { icon: '⛈️', label: 'Fırtınalı' };
}

function dayLabel(date: string, index: number) {
  if (index === 0) return 'Bugün';
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(new Date(date));
}

export default function WeatherScreen() {
  const [location, setLocation] = useState(CAMPUS_LOCATION);
  const [usingCampusLocation, setUsingCampusLocation] = useState(true);

  const loadLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setUsingCampusLocation(false);
    } catch {
      // The campus coordinates remain a reliable fallback.
    }
  }, []);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  const { data, isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ['weather', location.latitude, location.longitude],
    queryFn: () => weatherApi.getForecast(location.latitude, location.longitude),
  });

  const forecast = data?.data;
  const current = forecast?.current;
  const currentInfo = current ? weatherInfo(current.weather_code) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} tintColor={Colors.greenPrimary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BUGÜNÜN HAVASI</Text>
            <Text style={styles.title}>Kampüs havası</Text>
            <Text style={styles.subtitle}>
              {usingCampusLocation ? 'Gebze Teknik Üniversitesi' : 'Bulunduğun konum'}
            </Text>
          </View>
          <Text style={styles.headerIcon}>🌤️</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.greenPrimary} />
            <Text style={styles.loadingText}>Hava durumu yükleniyor...</Text>
          </View>
        ) : isError || !forecast || !current || !currentInfo ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>☁️</Text>
            <Text style={styles.errorTitle}>Hava durumu alınamadı</Text>
            <Text style={styles.errorText}>Bağlantını kontrol edip tekrar deneyebilirsin.</Text>
          </View>
        ) : (
          <>
            <View style={styles.currentCard}>
              <View style={styles.currentTop}>
                <View>
                  <Text style={styles.currentLabel}>{currentInfo.label}</Text>
                  <Text style={styles.temperature}>{Math.round(current.temperature_2m)}°</Text>
                  <Text style={styles.feelsLike}>
                    Hissedilen {Math.round(current.apparent_temperature)}°
                  </Text>
                </View>
                <Text style={styles.weatherIcon}>{currentInfo.icon}</Text>
              </View>
              <View style={styles.metrics}>
                <Metric icon="💧" label="Nem" value={`${current.relative_humidity_2m}%`} />
                <Metric icon="💨" label="Rüzgar" value={`${Math.round(current.wind_speed_10m)} km/s`} />
                <Metric icon="🌧️" label="Yağış" value={`${current.precipitation} mm`} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>5 günlük tahmin</Text>
            <View style={styles.forecastCard}>
              {forecast.daily.time.map((date, index) => {
                const info = weatherInfo(forecast.daily.weather_code[index]);
                return (
                  <View key={date} style={styles.forecastRow}>
                    <Text style={styles.day}>{dayLabel(date, index)}</Text>
                    <Text style={styles.forecastIcon}>{info.icon}</Text>
                    <Text style={styles.forecastRain}>
                      {forecast.daily.precipitation_probability_max[index]}%
                    </Text>
                    <Text style={styles.min}>{Math.round(forecast.daily.temperature_2m_min[index])}°</Text>
                    <Text style={styles.max}>{Math.round(forecast.daily.temperature_2m_max[index])}°</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.source}>Veriler Open-Meteo tarafından sağlanır.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  content: { padding: Spacing.md, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: Colors.greenPrimary },
  title: { fontSize: 26, fontWeight: '800', color: Colors.neutralDark, marginTop: 4 },
  subtitle: { fontSize: 13, color: Colors.neutralMid, marginTop: 4 },
  headerIcon: { fontSize: 42 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loadingText: { marginTop: Spacing.md, color: Colors.neutralMid },
  currentCard: {
    backgroundColor: Colors.greenDark,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  currentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
  temperature: { color: Colors.white, fontSize: 64, lineHeight: 72, fontWeight: '800' },
  feelsLike: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  weatherIcon: { fontSize: 74 },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  metric: { alignItems: 'center', minWidth: 75 },
  metricIcon: { fontSize: 17 },
  metricLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 3 },
  metricValue: { color: Colors.white, fontSize: 13, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.neutralDark, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  forecastCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm, ...Shadow.card },
  forecastRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.sm },
  day: { width: 75, fontSize: 14, fontWeight: '600', color: Colors.neutralDark },
  forecastIcon: { width: 38, fontSize: 22 },
  forecastRain: { width: 42, fontSize: 12, color: Colors.info },
  min: { width: 38, fontSize: 14, color: Colors.neutralMid, textAlign: 'right' },
  max: { width: 38, fontSize: 14, fontWeight: '700', color: Colors.neutralDark, textAlign: 'right' },
  source: { textAlign: 'center', color: Colors.neutralMid, fontSize: 11, marginTop: Spacing.md },
  errorCard: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, ...Shadow.card },
  errorIcon: { fontSize: 42 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutralDark, marginTop: Spacing.sm },
  errorText: { color: Colors.neutralMid, marginTop: Spacing.xs, textAlign: 'center' },
});
