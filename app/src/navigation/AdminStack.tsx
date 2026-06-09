import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminTreeListScreen from '../screens/admin/AdminTreeListScreen';
import AdminAddEditTreeScreen from '../screens/admin/AdminAddEditTreeScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import AdminNotificationTestScreen from '../screens/admin/AdminNotificationTestScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminTreeList: undefined;
  AdminAddEditTree: { treeId?: string };
  AdminReports: undefined;
  AdminUserManagement: undefined;
  AdminNotificationTest: undefined;
};

const Stack = createStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminTreeList" component={AdminTreeListScreen} />
      <Stack.Screen name="AdminAddEditTree" component={AdminAddEditTreeScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
      <Stack.Screen name="AdminNotificationTest" component={AdminNotificationTestScreen} />
    </Stack.Navigator>
  );
}
