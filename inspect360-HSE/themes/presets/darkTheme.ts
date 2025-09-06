import { colors } from '../colors';
import { fonts } from '../fonts';
import { spacing, borderRadius, shadows } from '../spacing';

export const darkTheme = {
  colors: {
    background: colors.background.dark,
    backgroundSecondary: colors.background.darkSecondary,
    backgroundAccent: colors.primary[900], // Very dark green
    surface: colors.background.paperDark,
    
    primary: colors.primary[500],        // #62B45B - Lighter for dark mode
    primaryLight: colors.primary[300],   // #7BC177
    primaryMedium: colors.primary[700],  // #33A12C
    primaryDark: colors.primary[100],    // #9AD094
    
    secondary: colors.secondary[500],
    secondaryLight: colors.secondary[100],
    secondaryDark: colors.secondary[700],
    
    accent: colors.accent[500],
    accentLight: colors.accent[100],
    accentDark: colors.accent[700],
    
    text: colors.text.primaryDark,
    textSecondary: colors.text.secondaryDark,
    textDisabled: colors.gray[600],
    textHint: colors.gray[500],
    
    border: colors.gray[700],
    borderMedium: colors.gray[600],
    borderDark: colors.gray[500],
    
    shadow: colors.shadow.dark,
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
    
    success: colors.primary[500],    // Use medium green for dark mode
    successLight: colors.primary[300],
    warning: colors.warning,
    error: colors.error,
    info: colors.primary[500],
  },
  
  fonts,
  spacing,
  borderRadius,
  shadows,
  
  // Component specific styles
  components: {
    button: {
      primary: {
        backgroundColor: colors.primary[700], // Use main brand color
        color: colors.background.light,
        borderRadius: borderRadius.md,
        height: 48,
        ...shadows.sm,
      },
      secondary: {
        backgroundColor: colors.primary[700],
        color: colors.background.light,
        borderRadius: borderRadius.md,
        height: 48,
        ...shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.primary[500],
        color: colors.primary[500],
        borderWidth: 2,
        borderRadius: borderRadius.md,
        height: 48,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.primary[500],
        borderRadius: borderRadius.md,
        height: 48,
      },
    },
    
    card: {
      backgroundColor: colors.background.paperDark,
      borderColor: colors.gray[700],
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      ...shadows.md,
    },
    
    input: {
      backgroundColor: colors.background.darkSecondary,
      borderColor: colors.gray[700],
      focusBorderColor: colors.primary[500],
      color: colors.text.primaryDark,
      placeholderColor: colors.gray[500],
      borderRadius: borderRadius.md,
      height: 48,
      padding: spacing.md,
    },
    
    header: {
      backgroundColor: colors.background.darkSecondary,
      color: colors.text.primaryDark,
      height: 60,
      ...shadows.sm,
    },
    
    tabBar: {
      backgroundColor: colors.background.darkSecondary,
      borderTopColor: colors.gray[700],
      activeColor: colors.primary[500],
      inactiveColor: colors.gray[500],
      height: 50,
    },
  },
};