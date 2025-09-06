import React, { useEffect, useState } from 'react';
import { View, StatusBar, Platform, AppState } from 'react-native';
import { TamaguiProvider } from '@tamagui/core';
import { ThemeProvider, useAppTheme } from './themes';
import ThemeToggle from './components/ui/themeToggle';
import config from './tamagui.config';
import MainNavigation from './navigation/MainNavigation';
import SplashScreen from './screens/SplashScreen';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './contexts/UserContext';

function AppContent() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [appState, setAppState] = useState(AppState.currentState);

  // Handle app state changes (background/foreground) - mobile only
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const handleAppStateChange = (nextAppState: string) => {
        console.log('🔄 AppState changing from', appState, 'to', nextAppState);
        setAppState(nextAppState as any);
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription?.remove();
    }
  }, [appState]);

  // Show ThemeToggle globally only on web and only for desktop/tablet width
  const showWebThemeToggle = Platform.OS === 'web' &&
    (typeof window !== 'undefined' && window.innerWidth >= 768);  

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background
    }}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Safe area top spacer - invisible but functional */}
      <View 
        style={{ 
          height: Platform.OS === 'web' ? 0 : insets.top,
          backgroundColor: 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }} 
        pointerEvents="none" 
      />
      
      {/* Content area with safe margins but no visible padding */}
      <View style={{
        flex: 1,
        marginTop: Platform.OS === 'web' ? 0 : insets.top,
        marginBottom: Platform.OS === 'web' ? 0 : insets.bottom,
      }}>
        {/* Show ThemeToggle globally only on web */}
        {showWebThemeToggle && <ThemeToggle />}
        <MainNavigation />
      </View>
      
      {/* Safe area bottom spacer - invisible but functional */}
      <View 
        style={{ 
          height: Platform.OS === 'web' ? 0 : insets.bottom,
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }} 
        pointerEvents="none" 
      />
    </View>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 App initialization started');
    
    // Only show splash screen on initial app load, not on logout/reload
    const isLogoutReload = Platform.OS === 'web' && 
      typeof window !== 'undefined' && 
      (window.performance.navigation?.type === 1 || // TYPE_RELOAD
       window.sessionStorage.getItem('app_initialized') === 'true');

    if (isLogoutReload) {
      // Skip splash screen for logout reloads
      console.log('🔄 App reload detected, skipping splash screen');
      setLoading(false);
    } else {
      // Show splash screen for initial app load
      console.log('🚀 Initial app load, showing splash screen...');
      
      // Mark app as initialized
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.sessionStorage.setItem('app_initialized', 'true');
      }
      
      // Initialize prebuilt templates in Supabase
      console.log('📝 Starting template initialization...');
      import('./services/templatesService').then(({ TemplatesService }) => {
        TemplatesService.initializePrebuiltTemplates()
          .then(() => console.log('✅ Templates initialized successfully'))
          .catch(console.error);
      }).catch(console.error);
      
      setTimeout(() => {
        console.log('✅ Splash screen complete, showing main app');
        setLoading(false);
      }, 3000); // 3 seconds splash screen only for initial load
    }
  }, []);

  // Show splash screen
  if (loading) {
    return (
      <SafeAreaProvider>
        <TamaguiProvider config={config}>
          <ThemeProvider initialTheme="light">
            <SplashScreen />
          </ThemeProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    );
  }

  // Show main app
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config}>
        <ThemeProvider initialTheme="light">
          <UserProvider>
            <AppContent />
          </UserProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}