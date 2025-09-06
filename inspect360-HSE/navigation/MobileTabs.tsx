import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/auth/AuthScreen';
import HomeScreen from '../screens/Home';
import InspectionScreen from '../screens/Inspections';
import InspectionFormScreen from '../screens/InspectionForm';
import NewInspectionScreen from '../screens/NewInspectionScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import TemplateBuilderScreen from '../screens/TemplateBuilderScreen';
import SettingsScreen from '../screens/Settings';
import InspectorDashboard from '../screens/InspectorDashboard';
import UserManagementScreen from '../screens/UserManagementScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen'; // Add this import
import { useUser } from '../contexts/UserContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function InspectionStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InspectionList" component={InspectionScreen} />
      <Stack.Screen name="NewInspection" component={NewInspectionScreen} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} />
    </Stack.Navigator>
  );
}

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

// Role-based app navigator
function AppNavigator() {
  const { user, isInspectorOnly, canManageUsers } = useUser();
  
  console.log('Navigation - User:', user);
  console.log('Navigation - User role:', user?.role);
  console.log('Navigation - isInspectorOnly():', isInspectorOnly());
  console.log('Navigation - canManageUsers():', canManageUsers());
  
  // Inspector-only navigation
  if (isInspectorOnly()) {
    console.log('Navigation - Showing Inspector dashboard');
    return (
      <Tab.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Dashboard" component={InspectorDashboard} />
        <Tab.Screen name="Assignments" component={AssignmentsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    );
  }
  
  // Admin/Manager navigation
  console.log('Navigation - Showing Admin/Manager navigation');
  const tabs = [
    { name: "Home", component: HomeScreen },
    { name: "Inspection", component: InspectionStack },
    { name: "Templates", component: TemplateStack },
  ];
  
  // Add Assignments tab for admin/manager roles
  if (canManageUsers()) {
    console.log('Navigation - Adding Assignments tab for admin/manager');
    tabs.push({ name: "Assignments", component: AssignmentsScreen });
  }
  
  // Only add Users tab for admin/manager roles
  if (canManageUsers()) {
    console.log('Navigation - Adding Users tab for admin/manager');
    tabs.push({ name: "Users", component: UserManagementScreen });
  }
  
  tabs.push({ name: "Settings", component: SettingsScreen });
  
  return (
    <Tab.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      {tabs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

// Root stack navigator: Auth first, then main app
export default function MobileTabs() {
  const { user, isLoading } = useUser();
  
  console.log('MobileTabs - User state:', user ? `logged in as ${user.email}` : 'logged out');
  console.log('MobileTabs - Loading state:', isLoading);
  console.log('MobileTabs - Will show:', user ? 'App screen' : 'Auth screen');
  
  // Show loading while checking auth state
  if (isLoading) {
    console.log('MobileTabs - Showing loading state');
    return null; // or a loading screen
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
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
}
