// Main theme exports
export { colors } from './colors';
export { fonts } from './fonts';
export { spacing, borderRadius, shadows, layout } from './spacing';

// Theme presets
export { lightTheme } from './presets/lightTheme';
export { darkTheme } from './presets/darkTheme';
export { hseTheme } from './presets/hseTheme';

// Theme Context and Hook
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { lightTheme } from './presets/lightTheme';
import { darkTheme } from './presets/darkTheme';
import { hseTheme } from './presets/hseTheme';

export type Theme = typeof lightTheme;
export type ThemeName = 'light' | 'dark' | 'hse';

type ThemeContextType = {
  theme: Theme;
  themeName: ThemeName;
  isDark: boolean;
  setTheme: (themeName: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
}

export function ThemeProvider({ 
  children, 
  initialTheme = 'light' 
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  
  const getTheme = (name: ThemeName): Theme => {
    switch (name) {
      case 'dark':
        return darkTheme;
      case 'hse':
        return hseTheme;
      case 'light':
      default:
        return lightTheme;
    }
  };
  
  const theme = getTheme(themeName);
  const isDark = themeName === 'dark';
  
  const setTheme = (name: ThemeName) => {
    setThemeName(name);
  };
  
  const toggleTheme = () => {
    setThemeName(current => current === 'light' ? 'dark' : 'light');
  };
  
  return React.createElement(
    ThemeContext.Provider,
    { 
      value: {
        theme, 
        themeName, 
        isDark, 
        setTheme, 
        toggleTheme 
      }
    },
    children
  );
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};

// Utility function to get theme colors based on current theme
export const getThemeColors = (themeName: ThemeName) => {
  switch (themeName) {
    case 'dark':
      return darkTheme.colors;
    case 'hse':
      return hseTheme.colors;
    case 'light':
    default:
      return lightTheme.colors;
  }
};
