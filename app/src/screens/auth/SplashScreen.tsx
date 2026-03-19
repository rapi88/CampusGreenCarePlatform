import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const scale = new Animated.Value(0.6);
  const opacity = new Animated.Value(0);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Check stored token
    const bootstrap = async () => {
      await new Promise((r) => setTimeout(r, 1800));
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const res = await authApi.me();
          setAuth(res.data, token);
          // RootNavigator handles redirect automatically
        } else {
          navigation.replace('Login');
        }
      } catch {
        await AsyncStorage.removeItem('token');
        navigation.replace('Login');
      }
    };
    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌿</Text>
        </View>
        <Text style={styles.title}>Campus Green</Text>
        <Text style={styles.subtitle}>Care Platform</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greenPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 52 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 },
});
