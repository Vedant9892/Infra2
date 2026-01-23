export const DESIGN = {
  // Base reference: 360dp width
  SCREEN_WIDTH: 360,
  BASE_PADDING: 16,
  
  // Spacing tokens (only allowed values)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  
  // Typography sizes
  typography: {
    title: 18,
    subtitle: 14,
    body: 13,
    caption: 11,
  },
  
  // Component heights
  button: {
    min: 44,
    recommended: 48,
  },
  
  // Colors
  colors: {
    primary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB',
    surface: '#fff',
    border: '#E5E7EB',
    text: {
      primary: '#111',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
  },
  
  // Shadow (iOS)
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
  },
  
  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
};
