// Company Brand Color Palette (Based on #33A12C)
export const colors = {
  // Primary Colors (Company Brand Green)
  primary: {
    50: '#C4E4C2',   // Lightest green
    100: '#9AD094',  // Light green  
    300: '#7BC177',  // Medium light green
    500: '#62B45B',  // Medium green
    700: '#33A12C',  // Main brand color (logo)
    800: '#2A8423',  // Darker green
    900: '#1F631A',  // Darkest green
  },
  
  // Secondary Colors (Complementary)
  secondary: {
    50: '#E8F5FD',
    100: '#B8E0F7',
    500: '#1976D2',  // Professional Blue
    600: '#1565C0',
    700: '#0D47A1',
    900: '#0A2E5C',
  },
  
  // Accent Colors (Safety Orange/Warning)
  accent: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    500: '#FF9800',  // Safety Orange
    600: '#F57C00',
    700: '#E65100',
    900: '#BF360C',
  },
  
  // Status Colors (Using your green palette)
  success: '#33A12C',      // Your main brand color
  successLight: '#7BC177', // Medium light green
  warning: '#FF9800',
  error: '#F44336',
  info: '#62B45B',         // Your medium green
  
  // Grayscale
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background Colors
  background: {
    light: '#FFFFFF',
    lightSecondary: '#F8FBF8',      // Very light green tint
    lightAccent: '#C4E4C2',         // Your lightest green
    dark: '#2c2c2cff',
    darkSecondary: '#2c2e2cff',       // Dark green tint
    paper: '#FFFFFF',
    paperDark: '#1E1E1E',
  },
  
  // Text Colors
  text: {
    primary: '#212121',             // Dark text for light backgrounds
    secondary: '#33A12C',           // Your brand color for secondary text
    disabled: '#9E9E9E',            // Muted gray that works with light green tint
    hint: '#62B45B',               // Your medium green for hints
    primaryDark: '#FFFFFF',         // White text for dark backgrounds
    secondaryDark: '#9AD094',       // Light green for dark theme secondary text
    tertiaryDark: '#C4E4C2',        // Very light green for dark theme tertiary text
  },
  
  // Border Colors
  border: {
    light: '#E8F5E8',              // Very subtle green tint that complements #F8FBF8
    medium: '#C4E4C2',             // Your lightest green - matches lightAccent
    dark: '#9AD094',               // Your light green for stronger borders
    darkTheme: '#404240',          // Slightly lighter than dark background
    accent: '#33A12C',             // Brand color for focus states
  },
  
  // Shadow Colors
  shadow: {
    light: 'rgba(51, 161, 44, 0.08)',     // Very subtle green shadow for light backgrounds
    medium: 'rgba(51, 161, 44, 0.12)',    // Slightly stronger for cards on light green tint
    dark: 'rgba(51, 161, 44, 0.2)',       // For emphasis on light backgrounds
    darkTheme: 'rgba(0, 0, 0, 0.3)',      // Standard black shadow for dark backgrounds
    darkThemeStrong: 'rgba(0, 0, 0, 0.5)', // Stronger shadow for dark theme
  },

  // Overlay Colors (for modals, tooltips, etc.)
  overlay: {
    light: 'rgba(248, 251, 248, 0.9)',    // Semi-transparent version of lightSecondary
    dark: 'rgba(44, 44, 44, 0.9)',        // Semi-transparent version of dark background
    backdrop: 'rgba(33, 161, 44, 0.1)',   // Very subtle brand tint for backdrops
  },

  // Surface Colors (for cards, panels that sit on backgrounds)
  surface: {
    elevated: '#FFFFFF',                   // Pure white for elevated elements
    tinted: '#FAFCFA',                     // Slightly tinted white
    darkElevated: '#383838',               // Lighter than dark background for elevation
    darkTinted: '#353635',                 // Slightly green-tinted dark surface
  },
};
