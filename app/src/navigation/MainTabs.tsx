import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { Colors } from '../theme/colors';

// Screens
import MapScreen from '../screens/map/MapScreen';
import TreeDetailScreen from '../screens/tree/TreeDetailScreen';
import WateringScreen from '../screens/tree/WateringScreen';
import AdoptionScreen from '../screens/tree/AdoptionScreen';
import ChatScreen from '../screens/tree/ChatScreen';
import NotesScreen from '../screens/tree/NotesScreen';
import MyTreesScreen from '../screens/myTrees/MyTreesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import LeaderboardScreen from '../screens/profile/LeaderboardScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';

export type TreeStackParamList = {
  TreeDetail: { treeId: string };
  Watering: { treeId: string };
  Adoption: { treeId: string };
  Chat: { treeId: string; treeName: string };
  Notes: { treeId: string; treeName: string };
};

export type MainTabsParamList = {
  MapTab: undefined;
  MyTreesTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = TreeStackParamList & {
  Tabs: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();
const AppStack = createStackNavigator<AppStackParamList>();
const ProfileStack = createStackNavigator();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.greenPrimary,
        tabBarInactiveTintColor: Colors.neutralMid,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.neutralLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            MapTab: 'Harita',
            MyTreesTab: 'Ağaçlarım',
            ProfileTab: 'Profil',
          };
          return (
            <Text style={{ fontSize: 11, color, fontWeight: '500' }}>
              {labels[route.name]}
            </Text>
          );
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            MapTab: '🗺️',
            MyTreesTab: '🌲',
            ProfileTab: '👤',
          };
          return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="MapTab" component={MapScreen} />
      <Tab.Screen name="MyTreesTab" component={MyTreesScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Tabs" component={TabNavigator} />
      <AppStack.Screen name="TreeDetail" component={TreeDetailScreen} />
      <AppStack.Screen name="Watering" component={WateringScreen} />
      <AppStack.Screen name="Adoption" component={AdoptionScreen} />
      <AppStack.Screen name="Chat" component={ChatScreen} />
      <AppStack.Screen name="Notes" component={NotesScreen} />
    </AppStack.Navigator>
  );
}
