import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen';
import ResetPasswordCodeScreen from '../screens/auth/ResetPasswordCodeScreen';
import ResetPasswordNewScreen from '../screens/auth/ResetPasswordNewScreen';
import { Colors } from '../theme/colors';

export type AuthStackParamList = {
  Splash: undefined;
  Login: { message?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string };
  ResetPasswordCode: { email: string };
  ResetPasswordNew: { email: string; resetToken: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, cardStyle: styles.card }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPasswordCode" component={ResetPasswordCodeScreen} />
      <Stack.Screen name="ResetPasswordNew" component={ResetPasswordNewScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.neutralBg },
});
