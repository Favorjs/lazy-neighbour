// API Configuration
export const API_URL = __DEV__
    ? 'http://192.168.1.121:3000'
    : 'https://production-api.com';

// App Theme Colors
export const COLORS = {
    // Primary - Energetic Purple
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#5B21B6',

    // Accent - Vibrant Teal
    accent: '#14B8A6',
    accentLight: '#5EEAD4',

    // Status Colors
    pending: '#F59E0B',
    active: '#3B82F6',
    completed: '#10B981',
    disputed: '#EF4444',

    // Backgrounds
    bgDark: '#0F172A',
    bgCard: '#1E293B',
    bgElevated: '#334155',

    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Misc
    white: '#FFFFFF',
    black: '#000000',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
};

// Category Icons and Colors
export const CATEGORIES = {
    FOOD: {
        label: 'Food & Drinks',
        icon: '🍔',
        color: '#F59E0B',
    },
    STORE: {
        label: 'Store Run',
        icon: '🛒',
        color: '#3B82F6',
    },
    HOME: {
        label: 'Home Help',
        icon: '🏠',
        color: '#10B981',
    },
    QUICK: {
        label: 'Quick Task',
        icon: '⚡',
        color: '#7C3AED',
    },
};

// Errand Status Labels
export const STATUS_LABELS = {
    PENDING: { label: 'Waiting for Runner', color: COLORS.pending },
    ACTIVE: { label: 'In Progress', color: COLORS.active },
    COMPLETED: { label: 'Completed', color: COLORS.completed },
    RELEASED: { label: 'Paid', color: COLORS.success },
    DISPUTED: { label: 'Disputed', color: COLORS.disputed },
    CANCELLED: { label: 'Cancelled', color: COLORS.textMuted },
};

// Spacing
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border Radius
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};
