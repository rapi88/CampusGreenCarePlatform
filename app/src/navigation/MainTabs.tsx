import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '../theme/colors';
import { useAuthStore } from '../store/auth.store';

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
import AwardsScreen from '../screens/profile/AwardsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminTreeListScreen from '../screens/admin/AdminTreeListScreen';
import AdminAddEditTreeScreen from '../screens/admin/AdminAddEditTreeScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import AdminTreeSuggestionsScreen from '../screens/admin/AdminTreeSuggestionsScreen';
import AdminNotificationTestScreen from '../screens/admin/AdminNotificationTestScreen';

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
  AwardsTab: undefined;
  ProfileTab: undefined;
  AdminTab?: undefined;
};

export type AppStackParamList = TreeStackParamList & {
  Tabs: undefined;
  // Admin sub-screens accessible from the admin tab
  SuggestTree: undefined;
  AdminTreeList: undefined;
  AdminAddEditTree: { treeId?: string };
  AdminReports: undefined;
  AdminUserManagement: undefined;
  AdminTreeSuggestions: undefined;
  AdminNotificationTest: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();
const AppStack = createStackNavigator<AppStackParamList>();
const ProfileStack = createStackNavigator();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, cardStyle: styles.scene }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function TabNavigator() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

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
        tabBarHideOnKeyboard: true,
        sceneStyle: styles.scene,
        tabBarLabel: ({ color }) => {
          const labels: Record<string, string> = {
            MapTab: 'Harita',
            MyTreesTab: 'Ağaçlarım',
            AwardsTab: 'Ödüller',
            ProfileTab: 'Profil',
            AdminTab: 'Admin',
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
            AwardsTab: '🏆',
            ProfileTab: '👤',
            AdminTab: '⚙️',
          };
          return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="MapTab" component={MapScreen} />
      <Tab.Screen name="MyTreesTab" component={MyTreesScreen} />
      <Tab.Screen name="AwardsTab" component={AwardsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
      {isAdmin && (
        <Tab.Screen name="AdminTab" component={AdminDashboardScreen} />
      )}
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false, cardStyle: styles.scene }}>
      <AppStack.Screen name="Tabs" component={TabNavigator} />
      <AppStack.Screen name="TreeDetail" component={TreeDetailScreen} />
      <AppStack.Screen name="Watering" component={WateringScreen} />
      <AppStack.Screen name="Adoption" component={AdoptionScreen} />
      <AppStack.Screen name="Chat" component={ChatScreen} />
      <AppStack.Screen name="Notes" component={NotesScreen} />
      <AppStack.Screen name="SuggestTree" component={AdminAddEditTreeScreen} />
      {/* Admin sub-screens (navigable from admin dashboard) */}
      <AppStack.Screen name="AdminTreeList" component={AdminTreeListScreen} />
      <AppStack.Screen name="AdminAddEditTree" component={AdminAddEditTreeScreen} />
      <AppStack.Screen name="AdminReports" component={AdminReportsScreen} />
      <AppStack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
      <AppStack.Screen name="AdminTreeSuggestions" component={AdminTreeSuggestionsScreen} />
      <AppStack.Screen name="AdminNotificationTest" component={AdminNotificationTestScreen} />
    </AppStack.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, backgroundColor: Colors.neutralBg },
});
