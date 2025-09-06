import { colors } from '../colors';
import { fonts } from '../fonts';
import { spacing, borderRadius, shadows } from '../spacing';

export const hseTheme = {
  colors: {
    background: colors.background.light,
    backgroundSecondary: colors.background.lightSecondary,
    backgroundAccent: colors.background.lightAccent,
    surface: colors.background.paper,
    
    primary: colors.primary[700],        // #33A12C - Main brand
    primaryLight: colors.primary[100],   // #9AD094
    primaryMedium: colors.primary[500],  // #62B45B
    primaryDark: colors.primary[900],    // #1F631A
    
    secondary: colors.secondary[500],
    secondaryLight: colors.secondary[100],
    secondaryDark: colors.secondary[700],
    
    accent: colors.accent[500],
    accentLight: colors.accent[100],
    accentDark: colors.accent[700],
    
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textDisabled: colors.text.disabled,
    textHint: colors.text.hint,
    
    border: colors.border.light,
    borderMedium: colors.border.medium,
    borderDark: colors.border.dark,
    
    shadow: colors.shadow.light,
    shadowMedium: colors.shadow.medium,
    shadowDark: colors.shadow.dark,
    
    success: colors.success,
    successLight: colors.successLight,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    
    // HSE Specific Colors
    safety: {
      high: colors.primary[700],      // High safety - Green
      medium: colors.accent[500],     // Medium safety - Orange
      low: colors.error,              // Low safety - Red
      critical: '#B71C1C',           // Critical - Dark Red
    },
    
    inspection: {
      passed: colors.success,
      failed: colors.error,
      pending: colors.warning,
      inProgress: colors.info,
    },
  },
  
  fonts,
  spacing,
  borderRadius,
  shadows,
  
  components: {
    button: {
      primary: {
        backgroundColor: colors.primary[700], // #33A12C
        color: colors.background.light,
        borderRadius: borderRadius.md,
        height: 48,
        fontSize: fonts.size.md,
        fontWeight: fonts.weight.semibold,
        ...shadows.sm,
      },
      secondary: {
        backgroundColor: colors.primary[500], // #62B45B
        color: colors.background.light,
        borderRadius: borderRadius.md,
        height: 48,
        ...shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.primary[700],
        color: colors.primary[700],
        borderWidth: 2,
        borderRadius: borderRadius.md,
        height: 48,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.primary[700],
        borderRadius: borderRadius.md,
        height: 48,
      },
      warning: {
        backgroundColor: colors.warning,
        color: colors.background.light,
        borderRadius: borderRadius.md,
        height: 48,
        ...shadows.sm,
      },
      danger: {
        backgroundColor: colors.error,
        color: colors.background.light,
        borderRadius: borderRadius.md,
        height: 48,
        ...shadows.sm,
      },
    },
    
    card: {
      backgroundColor: colors.background.paper,
      borderColor: colors.border.light,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: colors.shadow.light,
      ...shadows.md,
    },
    
    input: {
      backgroundColor: colors.background.light,
      borderColor: colors.border.medium,
      focusBorderColor: colors.primary[700],
      color: colors.text.primary,
      placeholderColor: colors.text.hint,
      borderRadius: borderRadius.md,
      height: 48,
      padding: spacing.md,
    },
    
    header: {
      backgroundColor: colors.primary[700],
      color: colors.background.light,
      height: 60,
      ...shadows.sm,
    },
    
    tabBar: {
      backgroundColor: colors.background.light,
      borderTopColor: colors.border.light,
      activeColor: colors.primary[700],
      inactiveColor: colors.gray[500],
      height: 50,
    },
    
    inspectionCard: {
      backgroundColor: colors.background.paper,
      borderColor: colors.border.medium,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: colors.shadow.medium,
      ...shadows.lg,
    },
    
    statusBadge: {
      passed: {
        backgroundColor: colors.success,
        color: colors.background.light,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      },
      failed: {
        backgroundColor: colors.error,
        color: colors.background.light,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      },
      pending: {
        backgroundColor: colors.warning,
        color: colors.background.light,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      },
    },
  },
};
