import React from 'react';
import { View, ViewProps, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAppTheme } from '../../themes';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function ScreenContainer({ children, style, ...props }: ViewProps) {
  const { theme } = useAppTheme();
  
  const containerStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: isTablet ? 40 : 16, // Consistent horizontal padding for all screen sizes
    paddingVertical: Platform.OS === 'web' ? 20 : 16, // Add some vertical padding
  };
    
  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
}