import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";

// GTÜ Çayırova Kampüsü koordinatları
const GTU_LAT = 40.807147;
const GTU_LNG = 29.35769;

// Open-Meteo API (Ücretsiz, API Key gerekmez)
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${GTU_LAT}&longitude=${GTU_LNG}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=Europe/Istanbul&forecast_days=7`;

interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  uvIndex: number;
}

interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentMax: number;
  apparentMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

// WMO Hava Kodu → Emoji + Açıklama
const weatherInfo: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Açık" },
  1: { icon: "🌤️", label: "Az Bulutlu" },
  2: { icon: "⛅", label: "Parçalı Bulutlu" },
  3: { icon: "☁️", label: "Bulutlu" },
  45: { icon: "🌫️", label: "Sisli" },
  48: { icon: "🌫️", label: "Kırağılı Sis" },
  51: { icon: "🌦️", label: "Hafif Çisenti" },
  53: { icon: "🌦️", label: "Çisenti" },
  55: { icon: "🌦️", label: "Yoğun Çisenti" },
  56: { icon: "🌧️", label: "Dondurucu Çisenti" },
  57: { icon: "🌧️", label: "Yoğun Dondurucu Çisenti" },
  61: { icon: "🌧️", label: "Hafif Yağmur" },
  63: { icon: "🌧️", label: "Yağmurlu" },
  65: { icon: "🌧️", label: "Şiddetli Yağmur" },
  66: { icon: "🌧️", label: "Dondurucu Yağmur" },
  67: { icon: "🌧️", label: "Yoğun Dondurucu Yağmur" },
  71: { icon: "🌨️", label: "Hafif Kar" },
  73: { icon: "🌨️", label: "Kar Yağışlı" },
  75: { icon: "❄️", label: "Yoğun Kar" },
  77: { icon: "❄️", label: "Kar Taneleri" },
  80: { icon: "🌦️", label: "Hafif Sağanak" },
  82: { icon: "⛈️", label: "Şiddetli Sağanak" },
  85: { icon: "🌨️", label: "Hafif Kar Sağanağı" },
  86: { icon: "❄️", label: "Yoğun Kar Sağanağı" },
  95: { icon: "⛈️", label: "Gök Gürültülü Fırtına" },
  96: { icon: "⛈️", label: "Fırtına (Dolu)" },
  99: { icon: "⛈️", label: "Şiddetli Fırtına (Dolu)" },
};

const getWeatherInfo = (code: number) =>
  weatherInfo[code] || { icon: "🌡️", label: "Bilinmiyor" };

const getDayName = (dateStr: string, index: number): string => {
  if (index === 0) return "Bugün";
  if (index === 1) return "Yarın";
  const date = new Date(dateStr);
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return days[date.getDay()];
};

const formatTime = (isoStr: string) => {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const getUVLabel = (uv: number): { text: string; color: string } => {
  if (uv <= 2) return { text: "Düşük", color: Colors.greenPrimary };
  if (uv <= 5) return { text: "Orta", color: Colors.warning };
  if (uv <= 7) return { text: "Yüksek", color: "#FF6B00" };
  if (uv <= 10) return { text: "Çok Yüksek", color: Colors.error };
  return { text: "Aşırı", color: "#8B00FF" };
};

// Sulama önerisi hesapla
const getWateringAdvice = (
  current: CurrentWeather,
  forecasts: DailyForecast[],
): { icon: string; text: string; color: string } => {
  const todayPrecip = forecasts[0]?.precipitationSum ?? 0;
  const tomorrowPrecip = forecasts[1]?.precipitationSum ?? 0;
  const temp = current.temperature;

  if (todayPrecip > 5 || tomorrowPrecip > 5) {
    return {
      icon: "🌧️",
      text: "Yağış bekleniyor, sulama ertelenebilir.",
      color: Colors.info,
    };
  }
  if (temp > 30) {
    return {
      icon: "🔥",
      text: "Sıcak hava! Ağaçlar akşam saatlerinde sulanmalı.",
      color: Colors.error,
    };
  }
  if (temp < 5) {
    return {
      icon: "🥶",
      text: "Soğuk hava. Sulama dikkatli yapılmalı, don riski var.",
      color: Colors.info,
    };
  }
  return {
    icon: "💧",
    text: "Sulama için uygun hava koşulları.",
    color: Colors.greenPrimary,
  };
};

async function fetchWeather(): Promise<{
  current: CurrentWeather;
  daily: DailyForecast[];
}> {
  const res = await fetch(WEATHER_API_URL);
  if (!res.ok) throw new Error("Hava durumu verisi alınamadı");
  const data = await res.json();

  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    uvIndex: data.current.uv_index,
  };

  const daily: DailyForecast[] = data.daily.time.map(
    (date: string, i: number) => ({
      date,
      dayName: getDayName(date, i),
      weatherCode: data.daily.weather_code[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      apparentMax: data.daily.apparent_temperature_max[i],
      apparentMin: data.daily.apparent_temperature_min[i],
      precipitationSum: data.daily.precipitation_sum[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      windSpeedMax: data.daily.wind_speed_10m_max[i],
      uvIndexMax: data.daily.uv_index_max[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
    }),
  );

  return { current, daily };
}

export default function WeatherScreen() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["weather", "gtu"],
    queryFn: fetchWeather,
    staleTime: 1000 * 60 * 15, // 15 dakika cache
    refetchInterval: 1000 * 60 * 30, // 30 dakikada bir yenile
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
          <Text style={styles.loadingText}>Hava durumu yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={styles.errorText}>Hava durumu alınamadı</Text>
          <Text style={styles.errorSub}>
            İnternet bağlantınızı kontrol edin
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { current, daily } = data;
  const currentInfo = getWeatherInfo(current.weatherCode);
  const advice = getWateringAdvice(current, daily);
  const today = daily[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🌤️ Hava Durumu</Text>
          <Text style={styles.headerSub}>GTÜ Çayırova Yerleşkesi</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Colors.greenPrimary}
          />
        }
      >
        {/* Current Weather Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroTemp}>
                {Math.round(current.temperature)}°
              </Text>
              <Text style={styles.heroFeelsLike}>
                Hissedilen {Math.round(current.apparentTemperature)}°
              </Text>
            </View>
            <View style={styles.heroRight}>
              <Text style={styles.heroIcon}>{currentInfo.icon}</Text>
              <Text style={styles.heroLabel}>{currentInfo.label}</Text>
            </View>
          </View>

          {/* Mini Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>💧</Text>
              <Text style={styles.metricValue}>{current.humidity}%</Text>
              <Text style={styles.metricLabel}>Nem</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>💨</Text>
              <Text style={styles.metricValue}>
                {Math.round(current.windSpeed)} km/s
              </Text>
              <Text style={styles.metricLabel}>Rüzgâr</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>☀️</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: getUVLabel(current.uvIndex).color },
                ]}
              >
                {current.uvIndex.toFixed(1)}
              </Text>
              <Text style={styles.metricLabel}>UV</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>🌧️</Text>
              <Text style={styles.metricValue}>
                {current.precipitation} mm
              </Text>
              <Text style={styles.metricLabel}>Yağış</Text>
            </View>
          </View>

          {/* Sunrise / Sunset */}
          {today && (
            <View style={styles.sunRow}>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌅</Text>
                <Text style={styles.sunLabel}>Gün Doğumu</Text>
                <Text style={styles.sunTime}>
                  {formatTime(today.sunrise)}
                </Text>
              </View>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌇</Text>
                <Text style={styles.sunLabel}>Gün Batımı</Text>
                <Text style={styles.sunTime}>
                  {formatTime(today.sunset)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Watering Advice Card */}
        <View style={[styles.adviceCard, { borderLeftColor: advice.color }]}>
          <Text style={styles.adviceIcon}>{advice.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.adviceTitle}>Sulama Tavsiyesi</Text>
            <Text style={styles.adviceText}>{advice.text}</Text>
          </View>
        </View>

        {/* 7-Day Forecast */}
        <Text style={styles.sectionTitle}>📅 7 Günlük Tahmin</Text>
        <View style={styles.forecastCard}>
          {daily.map((day, index) => {
            const info = getWeatherInfo(day.weatherCode);
            const isToday = index === 0;
            return (
              <View
                key={day.date}
                style={[
                  styles.forecastRow,
                  isToday && styles.forecastRowToday,
                  index < daily.length - 1 && styles.forecastRowBorder,
                ]}
              >
                {/* Day Name */}
                <View style={styles.forecastDay}>
                  <Text
                    style={[
                      styles.forecastDayText,
                      isToday && styles.forecastDayTextToday,
                    ]}
                  >
                    {day.dayName}
                  </Text>
                  <Text style={styles.forecastDate}>
                    {new Date(day.date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>

                {/* Weather Icon + Label */}
                <View style={styles.forecastWeather}>
                  <Text style={styles.forecastIcon}>{info.icon}</Text>
                  <Text style={styles.forecastLabel} numberOfLines={1}>
                    {info.label}
                  </Text>
                </View>

                {/* Precip Probability */}
                <View style={styles.forecastPrecip}>
                  {day.precipitationProbability > 0 ? (
                    <Text style={styles.forecastPrecipText}>
                      💧 %{day.precipitationProbability}
                    </Text>
                  ) : (
                    <Text style={[styles.forecastPrecipText, { opacity: 0.3 }]}>
                      —
                    </Text>
                  )}
                </View>

                {/* Temp Range */}
                <View style={styles.forecastTemps}>
                  <Text style={styles.forecastTempMax}>
                    {Math.round(day.tempMax)}°
                  </Text>
                  <Text style={styles.forecastTempMin}>
                    {Math.round(day.tempMin)}°
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Source Attribution */}
        <Text style={styles.attribution}>
          Veri kaynağı: Open-Meteo.com • GTÜ Çayırova ({GTU_LAT.toFixed(4)}°N,{" "}
          {GTU_LNG.toFixed(4)}°E)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutralBg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.neutralMid,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginTop: Spacing.sm,
  },
  errorSub: {
    fontSize: 14,
    color: Colors.neutralMid,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.neutralDark,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  heroTemp: {
    fontSize: 64,
    fontWeight: "800",
    color: Colors.neutralDark,
    lineHeight: 70,
  },
  heroFeelsLike: {
    fontSize: 14,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  heroRight: {
    alignItems: "center",
  },
  heroIcon: {
    fontSize: 56,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginTop: 4,
  },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutralDark,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.neutralLight,
  },

  // Sun
  sunRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sunItem: {
    alignItems: "center",
  },
  sunIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  sunLabel: {
    fontSize: 11,
    color: Colors.neutralMid,
  },
  sunTime: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginTop: 2,
  },

  // Advice Card
  adviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadow.card,
  },
  adviceIcon: {
    fontSize: 28,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: 2,
  },
  adviceText: {
    fontSize: 13,
    color: Colors.neutralMid,
    lineHeight: 18,
  },

  // Section Title
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: Spacing.md,
  },

  // Forecast Card
  forecastCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  forecastRowToday: {
    backgroundColor: "#f0fdf4",
  },
  forecastRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight + "60",
  },
  forecastDay: {
    width: 80,
  },
  forecastDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutralDark,
  },
  forecastDayTextToday: {
    color: Colors.greenPrimary,
    fontWeight: "800",
  },
  forecastDate: {
    fontSize: 11,
    color: Colors.neutralMid,
    marginTop: 1,
  },
  forecastWeather: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  forecastIcon: {
    fontSize: 22,
  },
  forecastLabel: {
    fontSize: 12,
    color: Colors.neutralMid,
    flexShrink: 1,
  },
  forecastPrecip: {
    width: 56,
    alignItems: "center",
  },
  forecastPrecipText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: "600",
  },
  forecastTemps: {
    flexDirection: "row",
    gap: 8,
    width: 70,
    justifyContent: "flex-end",
  },
  forecastTempMax: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutralDark,
  },
  forecastTempMin: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.neutralMid,
  },

  // Attribution
  attribution: {
    fontSize: 11,
    color: Colors.neutralMid,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
});

