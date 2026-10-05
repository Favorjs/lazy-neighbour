// API Configuration
import Constants from 'expo-constants';
import { useSyncExternalStore } from 'react';
import { Appearance, StyleSheet } from 'react-native';
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
    white: '#1A1B1F',
    black: '#FFFFFF',
    grey: '#92939A',
    green: '#7BD35C',
    clay: '#E58B63',
    clayTint: '#47281D',
    ochre: '#E0A93A',

    surface: '#1A1B1F',
    surfaceMuted: '#26282D',
    surfacePressed: '#33353B',
    line: '#33353B',

    ink: '#FFFFFF',
    inkSecondary: '#B4B5BB',
    charcoal: '#D9D9D9',
    stone: '#B5B5B5',
    focusRing: '#FFFFFF',
};

// Soft accent tints for backgrounds behind icons, cards and highlights. Text on them is always `ink`.
const LIGHT_TINTS = {
    yellow: '#FFE680',
    mint: '#BDEBCB',
    lilac: '#DCD0FF',
    peach: '#FFD3BE',
    sky: '#C9E4FF',
};

const DARK_TINTS = {
    yellow: '#5A4D1C',
    mint: '#22493A',
    lilac: '#3C3363',
    peach: '#5A3622',
    sky: '#21405F',
};

const buildPalette = (dark) => {
    const base = dark ? DARK : LIGHT;
    return {
        ...base,
        tint: dark ? DARK_TINTS : LIGHT_TINTS,

        // --- Legacy names, mapped onto the new palette so older code keeps working ---
        primary: base.ink,
        primaryLight: base.charcoal,
        primaryDark: base.ink,
        accent: base.ink,
        accentLight: base.surfacePressed,
        pending: base.ochre,
        active: base.ink,
        completed: base.green,
        disputed: base.clay,
        bgDark: base.surface,
        bgCard: base.surface,
        bgElevated: base.surfaceMuted,
        textPrimary: base.ink,
        textSecondary: base.inkSecondary,
        textMuted: base.grey,
        success: base.green,
        error: base.clay,
        warning: base.ochre,
    };
};

// ---------------------------------------------------------------------------
// Live theme. COLORS is ONE object whose values are swapped in place when the look changes,
// so every `COLORS.ink` read at render time is current. Styles are built lazily by makeStyles
// and rebuilt on a change; screens subscribe with useThemeVersion() so they re-render.
// ---------------------------------------------------------------------------
export const COLORS = {};
export const THEME = { pref: 'system', isDark: false, version: 0 };

const themeListeners = new Set();

const resolveDark = (pref) => (pref === 'system' ? Appearance.getColorScheme() : pref) === 'dark';

// pref: 'system' | 'light' | 'dark'
export const applyTheme = (pref, { persist = true } = {}) => {
    THEME.pref = pref;
    THEME.isDark = resolveDark(pref);
    Object.assign(COLORS, buildPalette(THEME.isDark));

    // Keep native pieces (keyboard, system sheets, tab bar) in step with the chosen look
    Appearance.setColorScheme(pref === 'system' ? null : pref);

    THEME.version += 1;
    if (persist) {
        try {
            Storage.setItemSync(THEME_KEY, pref);
        } catch (e) {
            // ignore: the choice just will not stick
        }
    }
    themeListeners.forEach((fn) => fn());
};

// Subscribe a component so it re-renders when the theme changes. Returns the version (handy as FlatList extraData).
const subscribeTheme = (fn) => {
    themeListeners.add(fn);
    return () => themeListeners.delete(fn);
};
const getThemeVersion = () => THEME.version;

export const useThemeVersion = () => useSyncExternalStore(subscribeTheme, getThemeVersion);

// Like StyleSheet.create, but the styles are rebuilt whenever the theme changes.
//   const styles = makeStyles(() => ({ box: { backgroundColor: COLORS.surface } }));
export const makeStyles = (factory) => {
    let cache = null;
    let builtFor = -1;
    const current = () => {
        if (builtFor !== THEME.version) {
            cache = StyleSheet.create(factory());
            builtFor = THEME.version;
        }
        return cache;
    };
    return new Proxy({}, { get: (_, key) => current()[key] });
};

let savedPref = 'system';
try {
    savedPref = Storage.getItemSync(THEME_KEY) || 'system';
} catch (e) {
    savedPref = 'system';
}
applyTheme(['light', 'dark', 'system'].includes(savedPref) ? savedPref : 'system', { persist: false });

// Follow the phone when the choice is "System"
Appearance.addChangeListener(() => {
    if (THEME.pref === 'system' && resolveDark('system') !== THEME.isDark) {
        applyTheme('system', { persist: false });
    }
});

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
    FOOD: { label: 'Food & drinks', icon: 'Utensils', get color() { return COLORS.ink; }, get tint() { return COLORS.tint.peach; } },
    STORE: { label: 'Store run', icon: 'ShoppingBag', get color() { return COLORS.ink; }, get tint() { return COLORS.tint.sky; } },
    HOME: { label: 'Home help', icon: 'House', get color() { return COLORS.ink; }, get tint() { return COLORS.tint.mint; } },
    QUICK: { label: 'Quick task', icon: 'Zap', get color() { return COLORS.ink; }, get tint() { return COLORS.tint.lilac; } },
};

// Fixed status words. The dot is the only colour; Disputed also colours its label.
export const STATUS_LABELS = {
    PENDING: { label: 'Waiting for runner', get color() { return COLORS.ochre; }, icon: 'Hourglass' },
    ACTIVE: { label: 'In progress', get color() { return COLORS.black; }, icon: 'Footprints' },
    COMPLETED: { label: 'Completed', get color() { return COLORS.green; }, icon: 'CircleCheck' },
    RELEASED: { label: 'Paid', get color() { return COLORS.green; }, icon: 'Wallet' },
    DISPUTED: { label: 'Disputed', get color() { return COLORS.clay; }, icon: 'CircleAlert' },
    CANCELLED: { label: 'Cancelled', get color() { return COLORS.inkSecondary; }, icon: 'CircleX' },
};

// Where the Help and support screen sends people (change this to your real inbox)
export const SUPPORT_EMAIL = 'support@lazyneighbour.com';

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
