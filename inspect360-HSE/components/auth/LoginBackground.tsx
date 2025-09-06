import { View } from '@tamagui/core';
import React from 'react';
import { ImageBackground, StyleSheet, Dimensions, Platform } from 'react-native';
// import { View } from 'tamagui';
import { useAppTheme } from '../../themes';

interface LoginBackgroundProps {
  children: React.ReactNode;
  image?: any;
  blurRadius?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  
}

export default function LoginBackground({
  children,
  image,
  blurRadius = 10,
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  overlayOpacity = 1,
}: LoginBackgroundProps) {
  const { theme, themeName } = useAppTheme();
  const { width } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  const isMobile = width <= 768;

  const styles = StyleSheet.create({
    container: { flex: 1 },

    mobileImageContainer: {
      ...StyleSheet.absoluteFillObject,
    },

    background: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: themeName === 'dark' ? theme.colors.background : theme.colors.backgroundSecondary,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
    },

    content: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },

    webContainer: {
      flex: 1,
      flexDirection: 'row',
      minHeight: Dimensions.get('window').height,
    },

    webImageContainer: {
      flex: 1,
      minWidth: '50%',
      position: 'relative',
      overflow: 'hidden',
    },

    webImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },

    webFormContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: Dimensions.get('window').height,
    },
  });

  if (isWeb && !isMobile) {
    // Web Layout: Image on left, form on right
    return (
      <View style={styles.webContainer}>
        {image && (
          <View style={styles.webImageContainer}>
            <ImageBackground
              source={image}
              style={styles.webImage}
              blurRadius={blurRadius}
              resizeMode="cover"
            >
              <View 
                style={[
                  styles.overlay, 
                  { backgroundColor: overlayColor, opacity: overlayOpacity }
                ]} 
              />
            </ImageBackground>
          </View>
        )}
        
        <View style={styles.webFormContainer}>
          {children}
        </View>
      </View>
    );
  }

// Mobile Layout
  if (image) {
    return (
      <View style={styles.container}>
        <View style={styles.mobileImageContainer}>
          <ImageBackground
            source={image}
            style={styles.background}
            blurRadius={blurRadius}
            resizeMode="cover"
          >
            <View 
              style={[
                styles.overlay, 
                { backgroundColor: overlayColor, opacity: overlayOpacity }
              ]} 
            />
          </ImageBackground>
        </View>
        
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }
  // Fallback
  return (
    <View style={[styles.container, { backgroundColor: '$background' }]}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}
