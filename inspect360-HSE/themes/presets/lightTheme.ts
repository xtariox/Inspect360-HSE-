import { Navigation } from '@tamagui/lucide-icons';
import { colors } from '../colors';
import { fonts } from '../fonts';
import { spacing, borderRadius, shadows } from '../spacing';

export const lightTheme = {
  colors: {
    background: colors.background.light, // #FFFFFF
    backgroundSecondary: colors.background.lightSecondary, // #F8FBF8
    backgroundAccent: colors.background.lightAccent, // #C4E4C2
    surface: colors.background.paper, // #FFFFFF
    
    primary: colors.primary[700],        // #33A12C - Main brand
    primaryLight: colors.primary[100],   // #9AD094
    primaryMedium: colors.primary[500],  // #62B45B
    primaryDark: colors.primary[900],    // #1F631A

    secondary: colors.secondary[500],     // #33A12C
    secondaryLight: colors.secondary[100], // #9AD094
    secondaryDark: colors.secondary[700],  // #1F631A

    accent: colors.accent[500],           // #33A12C
    accentLight: colors.accent[100],      // #9AD094
    accentDark: colors.accent[700],      // #1F631A

    text: colors.text.primary,           // #212121
    textSecondary: colors.text.secondary, // #757575
    textDisabled: colors.text.disabled,  // #BDBDBD
    textHint: colors.text.hint,          // #9E9E9E

    border: colors.border.light,         // #E0E0E0
    borderMedium: colors.border.medium,  // #BDBDBD
    borderDark: colors.border.dark,     // #9E9E9E

    shadow: colors.shadow.light,        // #E0E0E0
    shadowMedium: colors.shadow.medium,  // #BDBDBD
    shadowDark: colors.shadow.dark,     // #9E9E9E

    success: colors.success,             // #33A12C
    successLight: colors.successLight,   // #7BC177
    warning: colors.warning,             // #FFA000
    error: colors.error,                 // #D32F2F
    info: colors.info,                   // #1976D2
  },
  
  fonts,
  spacing,
  borderRadius,
  shadows,
  
  // Component specific styles
  components: {
    button: {
      primary: {
        backgroundColor: colors.primary[700], // #33A12C
        color: colors.text.primaryDark, // #FFFFFF
        borderColor: colors.border, // #E0E0E0
        borderRadius: borderRadius.md, 
        height: 48,
        hover: {
          backgroundColor: colors.primary[800], // #1F631A
        },
        ...shadows.sm,
      },
      secondary: {
        backgroundColor: colors.primary[500], // #62B45B
        color: colors.background.light, // #FFFFFF
        borderRadius: borderRadius.md,
        height: 48,
        ...shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent', 
        borderColor: colors.primary[700], // #33A12C
        color: colors.primary[700], // #33A12C 
        borderWidth: 2,
        borderRadius: borderRadius.md,
        height: 48,
      },
      ghost: {
        backgroundColor: 'transparent', 
        color: colors.primary[700],         // #33A12C
        borderRadius: borderRadius.md,
        height: 48,
      },
    },
    
    Card: {
      backgroundColor: colors.primary[50], // #E8F5FD
      borderColor: colors.border.light, // #E0E0E0
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: colors.shadow.light, // #E0E0E0
      ...shadows.md,
    },
    
    input: {
      backgroundColor: colors.background.light, // #FFFFFF
      borderColor: colors.border.medium, // #BDBDBD
      focusBorderColor: colors.primary[700], // #33A12C
      color: colors.text.primary, // #212121
      placeholderColor: colors.text.hint, // #9E9E9E
      borderRadius: borderRadius.md,
      height: 48,
      padding: spacing.md,
    },
    
    header: {
      backgroundColor: colors.primary[700], // #33A12C
      color: colors.background.light, // #FFFFFF
      height: 60,
      ...shadows.sm,
    },
    
    tabBar: {
      backgroundColor: colors.background.light, // #FFFFFF
      borderTopColor: colors.border.light, // #E0E0E0
      activeColor: colors.primary[700], // #33A12C
      inactiveColor: colors.gray[500], // #BDBDBD
      height: 50,
      activeTabIndicatorColor: colors.primary[700], // #33A12C
    },

  },
};
