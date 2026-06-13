// Root navigator — routes to Auth or MainApp based on token
// Both regular users and admins see the same MainTabs.
// Admins get an extra "Admin" tab and the ＋ FAB on the map.
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { Colors } from '../theme/colors';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { token } = useAuthStore();

  return (
    <View style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: styles.card,
          }}
        >
          {!token ? (
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutralBg },
  card: { flex: 1, backgroundColor: Colors.neutralBg },
});
