import React, { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import MobileTabs from './MobileTabs';
import WebDrawer from './DesktopDrawer';
import { NavigationContainer } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width <= 768;

export default function MainNavigation() {
  const { user } = useUser();
  
  // Set document title for web - update when user state changes
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const title = user 
        ? `Inspect360 HSE - ${user.full_name || user.email}`
        : 'Inspect360 HSE - Health, Safety & Environment';
      document.title = title;
      console.log('MainNavigation - Document title set to:', title);
    }
  }, [user]);
  
  if (isWeb && !isMobile) {
    return (
      <NavigationContainer key={user ? `auth-${user.id}` : 'unauth'}>
        <WebDrawer />
      </NavigationContainer>
    );
  } else {
    return (
      <NavigationContainer key={user ? `auth-${user.id}` : 'unauth'}>
        <MobileTabs />
      </NavigationContainer>
    );
  }
}
