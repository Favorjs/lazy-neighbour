import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Input, Icon, ScreenHeader, Sheet, KeyboardAware } from '../components/ui';
import { Skeleton } from '../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, TYPE, makeStyles, useThemeVersion } from '../constants/config';
import { setSavedLocation, getSavedLocation, getRecentPlaces, addRecentPlace } from '../services/locationStore';

const describePlace = (place) => {
    if (!place) return null;
    const area = place.district || place.subregion || place.street || place.name;
    const city = place.city || place.region;
    return [area, city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || null;
};

export default function LocationScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const saved = getSavedLocation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null); // null = not searched yet
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const [recent] = useState(getRecentPlaces);

    const choose = (place, mode) => {
        setSavedLocation({ ...place, mode });
        if (mode === 'custom') addRecentPlace(place);
        router.back();
    };

    // 1. Use where I am right now
    const useCurrent = async () => {
        setLocating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return Sheet.alert('Location is off', 'Turn on location for Lazy Neighbour in your phone settings to use where you are.');
            }
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const [found] = await Location.reverseGeocodeAsync(position.coords);
            choose(
                {
                    label: describePlace(found) || 'Current location',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                },
                'gps'
            );
        } catch (error) {
            Sheet.alert('Could not find you', 'Check your connection and try again.');
        } finally {
            setLocating(false);
        }
    };

    // 2. Suggestions appear as you type (after a short pause), no Search button needed
    const requestId = useRef(0);

    useEffect(() => {
        const text = query.trim();

        if (text.length < 3) {
            requestId.current += 1; // drop any search still in flight
            setResults(null);
            setSearching(false);
            return;
        }

        setSearching(true);
        const id = ++requestId.current;

        const timer = setTimeout(async () => {
            try {
                const matches = (await Location.geocodeAsync(text)).slice(0, 5);
                const named = await Promise.all(
                    matches.map(async (m) => {
                        const [found] = await Location.reverseGeocodeAsync({
                            latitude: m.latitude,
                            longitude: m.longitude,
                        });
                        return { label: describePlace(found) || text, latitude: m.latitude, longitude: m.longitude };
                    })
                );
                if (id !== requestId.current) return; // a newer keystroke took over
                setResults(named.filter((p, i, arr) => arr.findIndex((x) => x.label === p.label) === i));
            } catch (error) {
                if (id === requestId.current) setResults([]);
            } finally {
                if (id === requestId.current) setSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const PlaceRow = ({ place, icon = 'MapPin' }) => (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.surfaceMuted }]}
            onPress={() => choose({ label: place.label, latitude: place.latitude, longitude: place.longitude }, 'custom')}
        >
            <View style={styles.disc}>
                <Icon name={icon} size={20} />
            </View>
            <Text style={styles.rowText} numberOfLines={2}>{place.label}</Text>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAware style={{ flex: 1 }}>
                <ScreenHeader title="Change location" />

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets>
                    <Input
                        placeholder="Search an area or address"
                        value={query}
                        onChangeText={setQuery}
                        leftIcon="Search"
                        pill
                        autoCapitalize="words"
                        style={{ marginBottom: SPACING.sm }}
                    />
                    <Pressable
                        style={({ pressed }) => [styles.row, styles.current, pressed && { opacity: 0.85 }]}
                        onPress={useCurrent}
                        disabled={locating}
                    >
                        <View style={[styles.disc, { backgroundColor: COLORS.ink }]}>
                            <Icon name="Locate" size={20} color={COLORS.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{locating ? 'Finding you...' : 'Use my current location'}</Text>
                            <Text style={styles.rowSub}>
                                {saved?.mode === 'custom' ? 'You are using a custom place right now' : saved?.label || 'Uses your phone GPS'}
                            </Text>
                        </View>
                        {saved?.mode !== 'custom' ? <Icon name="Check" size={20} /> : null}
                    </Pressable>

                    {searching ? (
                        <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
                            <Skeleton height={56} radius={RADIUS.tile} />
                            <Skeleton height={56} radius={RADIUS.tile} />
                        </View>
                    ) : results !== null ? (
                        <View style={{ marginTop: SPACING.md }}>
                            <Text style={styles.section}>Results</Text>
                            {results.length === 0 ? (
                                <Text style={styles.empty}>
                                    No match yet. Keep typing, or try the area and city, like "Lekki, Lagos".
                                </Text>
                            ) : (
                                results.map((p) => <PlaceRow key={`${p.latitude},${p.longitude}`} place={p} />)
                            )}
                        </View>
                    ) : recent.length > 0 ? (
                        <View style={{ marginTop: SPACING.md }}>
                            <Text style={styles.section}>Recent places</Text>
                            {recent.map((p) => (
                                <PlaceRow key={p.label} place={p} icon="Clock" />
                            ))}
                        </View>
                    ) : null}
                </ScrollView>
            </KeyboardAware>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING.sm + 4, borderRadius: RADIUS.tile },
    current: { backgroundColor: COLORS.surfaceMuted },
    disc: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTitle: { ...TYPE.cardTitle, color: COLORS.ink },
    rowSub: { ...TYPE.caption, color: COLORS.inkSecondary },
    rowText: { ...TYPE.cardTitle, fontFamily: TYPE.label.fontFamily, color: COLORS.ink, flex: 1 },
    section: { ...TYPE.heading, color: COLORS.ink, marginBottom: SPACING.xs },
    empty: { ...TYPE.bodySm, color: COLORS.inkSecondary, paddingVertical: SPACING.md },
}));
