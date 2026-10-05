// API Configuration
import Constants from 'expo-constants';
import { Appearance } from 'react-native';
import Storage from 'expo-sqlite/kv-store';

const THEME_KEY = 'lazyneighbour.theme';

// In dev, the API runs on the same machine as Metro, so reuse the host Metro
// was reached on (works on any network, no hardcoded LAN IP).
const getDevHost = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    return hostUri ? hostUri.split(':')[0] : 'localhost';
};

export const API_URL = __DEV__
    ? `http://${getDevHost()}:3000`
    : 'https://production-api.com';

// ---------------------------------------------------------------------------
// Lazy Neighbour design system: black, white and grey, Poppins, playful shapes.
// Green and clay are small signals only.
// ---------------------------------------------------------------------------

// Appearance: 'system' | 'light' | 'dark'. Read synchronously at start-up so every StyleSheet
// is built with the right palette; changing it reloads the app (see settings.js).
let storedPref = 'system';
try {
    storedPref = Storage.getItemSync(THEME_KEY) || 'system';
} catch (e) {
    storedPref = 'system';
}
export const THEME_PREF = ['light', 'dark', 'system'].includes(storedPref) ? storedPref : 'system';

if (THEME_PREF !== 'system') {
    // Keep native pieces (keyboard, system sheets, tab bar) in step with the chosen look
    Appearance.setColorScheme(THEME_PREF);
}

export const IS_DARK = (THEME_PREF === 'system' ? Appearance.getColorScheme() : THEME_PREF) === 'dark';

export const setThemePreference = (pref) => {
    try {
        Storage.setItemSync(THEME_KEY, pref);
    } catch (e) {
        // ignore: the choice just will not stick
    }
};

// The two palettes use the same roles. In dark mode the neutrals swap sides, so anything written as
// "white on ink" or "ink on surface" stays readable without per-screen changes.
const LIGHT = {
    white: '#FFFFFF',
    black: '#000000',
    grey: '#888888',          // placeholders, disabled, inactive icons (never readable text)
    green: '#2B6117',         // Release payment, Completed / Paid dots, online dot
    clay: '#A8461F',          // disputes, errors, destructive labels
    clayTint: '#F6E6DC',      // error banner background
    ochre: '#8A5A00',         // "Waiting for runner" dot

    surface: '#FFFFFF',
    surfaceMuted: '#F3F3F3',  // inputs, tiles, soft buttons, chips, badges
    surfacePressed: '#E8E8E8',
    line: '#EBEBEB',

    ink: '#000000',
    inkSecondary: '#5E5E5E',
    charcoal: '#333333',
    stone: '#6B6B6B',
    focusRing: '#000000',
};

const DARK = {
    white: '#0B0B0C',
    black: '#FFFFFF',
    grey: '#8C8C8C',
    green: '#7BD35C',
    clay: '#E58B63',
    clayTint: '#3A2118',
    ochre: '#E0A93A',

    surface: '#0B0B0C',
    surfaceMuted: '#1E1E20',
    surfacePressed: '#2C2C2F',
    line: '#2A2A2D',

    ink: '#FFFFFF',
    inkSecondary: '#A6A6A6',
    charcoal: '#D9D9D9',
    stone: '#B5B5B5',
    focusRing: '#FFFFFF',
};

const BASE = IS_DARK ? DARK : LIGHT;

export const COLORS = {
    ...BASE,

    // --- Legacy names, mapped onto the new palette so older code keeps working ---
    primary: BASE.ink,
    primaryLight: BASE.charcoal,
    primaryDark: BASE.ink,
    accent: BASE.ink,
    accentLight: BASE.surfacePressed,
    pending: BASE.ochre,
    active: BASE.ink,
    completed: BASE.green,
    disputed: BASE.clay,
    bgDark: BASE.surface,
    bgCard: BASE.surface,
    bgElevated: BASE.surfaceMuted,
    textPrimary: BASE.ink,
    textSecondary: BASE.inkSecondary,
    textMuted: BASE.grey,
    success: BASE.green,
    error: BASE.clay,
    warning: BASE.ochre,
};

// Poppins, loaded in app/_layout.js. React Native needs one family name per weight.
export const FONT = {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extrabold: 'Poppins_800ExtraBold',
};

// Text styles (spread into a style: ...TYPE.title)
export const TYPE = {
    hero: { fontFamily: FONT.extrabold, fontSize: 36, lineHeight: 44, letterSpacing: -0.5 },
    amountXl: { fontFamily: FONT.extrabold, fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
    title: { fontFamily: FONT.extrabold, fontSize: 24, lineHeight: 32, letterSpacing: -0.25 },
    heading: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 26 },
    amount: { fontFamily: FONT.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.25 },
    cardTitle: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24 },
    body: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 24 },
    button: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24 },
    label: { fontFamily: FONT.medium, fontSize: 14, lineHeight: 20 },
    bodySm: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 },
    caption: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16 },
    badge: { fontFamily: FONT.semibold, fontSize: 12, lineHeight: 16 },
    overline: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
    chip: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 18 },
};

// Category icons are Lucide names (see components/ui/Icon.js). Categories carry no colour.
export const CATEGORIES = {
    FOOD: { label: 'Food & drinks', icon: 'Utensils', color: COLORS.ink },
    STORE: { label: 'Store run', icon: 'ShoppingBag', color: COLORS.ink },
    HOME: { label: 'Home help', icon: 'House', color: COLORS.ink },
    QUICK: { label: 'Quick task', icon: 'Zap', color: COLORS.ink },
};

// Fixed status words. The dot is the only colour; Disputed also colours its label.
export const STATUS_LABELS = {
    PENDING: { label: 'Waiting for runner', color: COLORS.ochre, icon: 'Hourglass' },
    ACTIVE: { label: 'In progress', color: COLORS.black, icon: 'Footprints' },
    COMPLETED: { label: 'Completed', color: COLORS.green, icon: 'CircleCheck' },
    RELEASED: { label: 'Paid', color: COLORS.green, icon: 'Wallet' },
    DISPUTED: { label: 'Disputed', color: COLORS.clay, icon: 'CircleAlert' },
    CANCELLED: { label: 'Cancelled', color: COLORS.inkSecondary, icon: 'CircleX' },
};

// Where the Help and support screen sends people (change this to your real inbox)
export const SUPPORT_EMAIL = 'support@lazyneighbour.app';

// Smallest bounty a neighbour can post, in naira (the server enforces the same floor)
export const MIN_BOUNTY = 100;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const RADIUS = {
    detail: 5,      // progress segments, thumbnails, checkboxes
    tile: 14,       // inputs, category tiles, icon squares
    card: 20,       // cards, tracker header
    sheet: 28,      // bottom sheet top corners
    full: 9999,     // buttons, badges, chips, avatars
    // legacy
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
};

// React Native shadows (iOS shadow* + Android elevation)
export const SHADOW = {
    press: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 0, elevation: 4 },
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
    float: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
    sheet: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8 },
};
