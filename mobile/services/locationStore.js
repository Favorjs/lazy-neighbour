import Storage from 'expo-sqlite/kv-store';

// The place the app uses for "near me": either your GPS fix ('gps') or one you picked yourself ('custom').
// Shape: { label, latitude, longitude, mode }
const KEY = 'lazyneighbour.location';
const RECENT_KEY = 'lazyneighbour.recentPlaces';

const read = (key, fallback) => {
    try {
        const raw = Storage.getItemSync(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
};

const write = (key, value) => {
    try {
        Storage.setItemSync(key, JSON.stringify(value));
    } catch (e) {
        // not persisted: still works for this session
    }
};

let current = read(KEY, null);
const listeners = new Set();

export const getSavedLocation = () => current;

export const setSavedLocation = (location) => {
    current = location;
    write(KEY, location);
    listeners.forEach((fn) => fn(location));
};

export const subscribeLocation = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};

export const getRecentPlaces = () => read(RECENT_KEY, []);

export const addRecentPlace = (place) => {
    const next = [
        place,
        ...getRecentPlaces().filter((p) => p.label !== place.label),
    ].slice(0, 5);
    write(RECENT_KEY, next);
};
