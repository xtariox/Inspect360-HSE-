
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/auth/AuthScreen';
import HomeScreen from '../screens/Home';
import InspectionScreen from '../screens/Inspections';
import InspectionFormScreen from '../screens/InspectionForm';
import NewInspectionScreen from '../screens/NewInspectionScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import TemplateBuilderScreen from '../screens/TemplateBuilderScreen';
import SettingsScreen from '../screens/Settings';
import UserManagementScreen from '../screens/UserManagementScreen';
import InspectorDashboard from '../screens/InspectorDashboard';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import { useUser } from '../contexts/UserContext';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Stack navigator for inspection screens
function InspectionStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InspectionList" component={InspectionScreen} />
      <Stack.Screen name="NewInspection" component={NewInspectionScreen} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} />
    </Stack.Navigator>
  );
}

// Stack navigator for template screens
function TemplateStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TemplatesList" component={TemplatesScreen} />
      <Stack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
      <Stack.Screen name="NewInspection" component={NewInspectionScreen} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} />
    </Stack.Navigator>
  );
}

// Stack navigator for assignment screens
function AssignmentStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssignmentsList" component={AssignmentsScreen} />
      <Stack.Screen name="NewInspection" component={NewInspectionScreen} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} />
    </Stack.Navigator>
  );
}

// Role-based drawer navigator
function AppDrawer() {
  const { user, isInspectorOnly, canManageUsers } = useUser();
  
  console.log('Desktop Navigation - User:', user);
  console.log('Desktop Navigation - User role:', user?.role);
  console.log('Desktop Navigation - isInspectorOnly():', isInspectorOnly());
  console.log('Desktop Navigation - canManageUsers():', canManageUsers());
  
  if (isInspectorOnly()) {
    // Inspector-only navigation
    console.log('Desktop Navigation - Showing Inspector drawer');
    return (
      <Drawer.Navigator id={undefined}>
        <Drawer.Screen name="Dashboard" component={InspectorDashboard} />
        <Drawer.Screen name="Assignments" component={AssignmentsScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    );
  }
  
  // Admin/Manager navigation
  console.log('Desktop Navigation - Showing Admin/Manager drawer');
  const screens = [
    { name: "Home", component: HomeScreen },
    { name: "Inspection", component: InspectionStack },
    { name: "Templates", component: TemplateStack },
    { name: "Assignments", component: AssignmentStack },
  ];
  
  // Only add Users screen for admin/manager roles
  if (canManageUsers()) {
    console.log('Desktop Navigation - Adding Users screen for admin/manager');
    screens.push({ name: "Users", component: UserManagementScreen });
  }
  
  screens.push({ name: "Settings", component: SettingsScreen });
  
  return (
    <Drawer.Navigator id={undefined}>
      {screens.map(screen => (
        <Drawer.Screen key={screen.name} name={screen.name} component={screen.component} />
      ))}
    </Drawer.Navigator>
  );
}

// Root stack navigator: Auth first, then main app

// Root stack navigator: Auth first, then main app
export default function DesktopDrawer() {
  const { user, isLoading } = useUser();
  
  console.log('DesktopDrawer - User state:', user ? `logged in as ${user.email}` : 'logged out');
  console.log('DesktopDrawer - Loading state:', isLoading);
  console.log('DesktopDrawer - Will show:', user ? 'App screen' : 'Auth screen');
  
  // Show loading while checking auth state
  if (isLoading) {
    console.log('DesktopDrawer - Showing loading state');
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Loading...
        </Text>
      </View>
    );
  }
  
  // Use key to force re-render when auth state changes
  return (
    <Stack.Navigator 
      key={user ? 'authenticated' : 'unauthenticated'}
      id={undefined} 
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? "App" : "Auth"}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="App" component={AppDrawer} />
    </Stack.Navigator>
  );
}


