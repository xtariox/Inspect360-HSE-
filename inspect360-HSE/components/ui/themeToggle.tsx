import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Button } from '@tamagui/button';
import { Sun, Moon, Shield } from '@tamagui/lucide-icons';
import { useAppTheme, ThemeName } from '../../themes';

export default function ThemeToggle() {
  const { theme, themeName, setTheme } = useAppTheme();

  const getNextTheme = (): ThemeName => {
    switch (themeName) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'hse';
      case 'hse':
        return 'light';
      default:
        return 'light';
    }
  };

  const getThemeIcon = () => {
    switch (themeName) {
      case 'light':
        return <Sun size={20} color={theme.colors.text} />;
      case 'dark':
        return <Moon size={20} color={theme.colors.text} />;
      case 'hse':
        return <Shield size={20} color={theme.colors.text} />; // Safety shield for HSE theme
      default:
        return <Sun size={20} color={theme.colors.text} />;
    }
  };

  const getThemeLabel = () => {
    switch (themeName) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'hse':
        return 'HSE';
      default:
        return 'Light';
    }
  };

  const handlePress = () => {
    setTheme(getNextTheme());
  };

  // Only show text if on desktop web (not mobile web or native)
  const isDesktopWeb = (() => {
    if (Platform.OS !== 'web') return false;
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') return false;
    // Check for mobile user agents
    const ua = window.navigator.userAgent;
    return !/Mobi|Android|iPhone|iPad|iPod|Mobile|Tablet|IEMobile|BlackBerry|Opera Mini/i.test(ua);
  })();

  return (
    <Button
      onPress={handlePress}
      backgroundColor={theme.colors.surface}
      borderColor={theme.colors.border}
      borderWidth={1}
      {...(isDesktopWeb
        ? { position: 'absolute', top: 10, right: 10, zIndex: 10 }
        : {})}
      borderRadius={25}
      paddingHorizontal={16}
      paddingVertical={8}
      flexDirection="row"
      alignItems="center"
      style={{ boxShadow: `0 2px 4px ${theme.colors.shadow}1A` }}
      elevation={3}
      pressStyle={{
        backgroundColor: theme.colors.backgroundSecondary,
        borderColor: theme.colors.primary,
      }}
    >
      <View style={isDesktopWeb ? { marginRight: 6 } : undefined}>
        {getThemeIcon()}
      </View>
      {isDesktopWeb && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.text,
          }}
        >
          {getThemeLabel()}
        </Text>
      )}
    </Button>
  );
}