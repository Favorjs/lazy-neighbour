import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Button, IconButton, Icon, Sheet } from '../../components/ui';
import { Skeleton, ErrandCardSkeleton } from '../../components/ui/Skeleton';
import { ErrandCard } from '../../components/errand/ErrandCard';
import { COLORS, CATEGORIES, SPACING, RADIUS, SHADOW, TYPE, THEME, makeStyles, useThemeVersion } from '../../constants/config';
import { getSavedLocation, subscribeLocation } from '../../services/locationStore';
import { errandEvents } from '../../services/errandEvents';
import api from '../../services/api';

// Only import maps on native platforms
let MapView, Marker, Circle;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
}

const RADIUS_KM = 5;

export default function RadarScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const mapRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [errands, setErrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedErrand, setSelectedErrand] = useState(null);
    const [accepting, setAccepting] = useState(false);

    // A cancelled errand leaves the map immediately
    useEffect(
        () =>
            errandEvents.subscribe((event) => {
                if (event.type === 'removed') {
                    setErrands((list) => list.filter((e) => e.id !== event.id));
                    setSelectedErrand((cur) => (cur?.id === event.id ? null : cur));
                } else {
                    getLocationAndErrands();
                }
            }),
        []
    );

    useEffect(() => {
        getLocationAndErrands();
        // Reload if the person picks a different place from the home screen
        return subscribeLocation((loc) => {
            if (loc?.mode === 'custom') getLocationAndErrands();
        });
    }, []);

    const getLocationAndErrands = async () => {
        setLoading(true);
        try {
            let coords;
            const chosen = getSavedLocation();

            if (chosen?.mode === 'custom') {
                // The person picked a place on the home screen: search around that instead of the GPS fix
                coords = { latitude: chosen.latitude, longitude: chosen.longitude };
            } else {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLoading(false);
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            }
            setLocation(coords);

            const data = await api.getNearbyErrands(coords.latitude, coords.longitude, RADIUS_KM);
            setErrands(data.errands || []);
        } catch (error) {
            console.error('Failed to get location/errands:', error);
            Sheet.alert('Something went wrong', error.message || 'Could not load errands near you');
        } finally {
            setLoading(false);
        }
    };

    const acceptErrand = async (errand) => {
        setAccepting(true);
        try {
            await api.acceptErrand(errand.id);
            setSelectedErrand(null);
            setErrands((list) => list.filter((e) => e.id !== errand.id));
            router.push(`/errand/${errand.id}`);
        } catch (error) {
            Sheet.alert('Could not accept', error.message || 'Please try again');
        } finally {
            setAccepting(false);
        }
    };

    const centerOnUser = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={{ flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
                    <Skeleton height={64} radius={RADIUS.full} />
                    <Skeleton height={320} radius={RADIUS.card} style={{ marginTop: SPACING.md }} />
                    <View style={{ marginTop: SPACING.lg }}>
                        <ErrandCardSkeleton />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (!location) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <View style={styles.bigDisc}>
                        <Icon name="MapPin" size={32} />
                    </View>
                    <Text style={styles.emptyTitle}>Where are you?</Text>
                    <Text style={styles.emptyText}>
                        Turn on location so we can show errands your neighbours need done nearby.
                    </Text>
                    <Button title="Turn on location" variant="primary" onPress={getLocationAndErrands} />
                </View>
            </SafeAreaView>
        );
    }

    // Web fallback: a list instead of a map
    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.listHeader}>
                    <Text style={styles.title}>Run errands</Text>
                    <Text style={styles.muted}>{errands.length} errands within {RADIUS_KM} km</Text>
                </View>
                <FlatList
                extraData={themeVersion}
                    data={errands}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: SPACING.lg }}
                    renderItem={({ item }) => (
                        <ErrandCard
                            errand={item}
                            onPress={(e) => router.push(`/errand/${e.id}`)}
                            onAccept={acceptErrand}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyTitle}>Nothing nearby yet</Text>
                            <Text style={styles.emptyText}>Check back soon, neighbours are always up to something.</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                showsUserLocation
                userInterfaceStyle={THEME.isDark ? 'dark' : 'light'}
                onPress={() => setSelectedErrand(null)}
            >
                <Circle
                    center={location}
                    radius={RADIUS_KM * 1000}
                    strokeColor={COLORS.ink}
                    fillColor="rgba(0,0,0,0.04)"
                    strokeWidth={1}
                />

                {errands.map((errand) => {
                    const category = CATEGORIES[errand.category] || CATEGORIES.QUICK;
                    const on = selectedErrand?.id === errand.id;
                    return (
                        <Marker
                            key={errand.id}
                            coordinate={{ latitude: errand.locationLat, longitude: errand.locationLng }}
                            onPress={() => setSelectedErrand(errand)}
                            tracksViewChanges={false}
                        >
                            <View style={[styles.pin, on && styles.pinOn]}>
                                <Icon name={category.icon} size={on ? 20 : 18} color={COLORS.white} />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {/* Floating search-style header */}
            <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
                <View style={styles.headerPill}>
                    <Icon name="Radar" size={20} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Run errands</Text>
                        <Text style={styles.headerSub}>{errands.length} within {RADIUS_KM} km</Text>
                    </View>
                </View>
            </SafeAreaView>

            <IconButton
                icon="Locate"
                label="Centre on me"
                onPress={centerOnUser}
                style={[styles.locate, selectedErrand ? { bottom: 330 } : { bottom: 170 }]}
            />

            {/* Bottom sheet */}
            <View style={styles.sheet}>
                <View style={styles.grabber} />
                {selectedErrand ? (
                    <ErrandCard
                        errand={selectedErrand}
                        onPress={(e) => router.push(`/errand/${e.id}`)}
                        onAccept={acceptErrand}
                        acceptLoading={accepting}
                    />
                ) : (
                    <View style={styles.sheetEmpty}>
                        <Text style={styles.sheetTitle}>
                            {errands.length ? 'Pick an errand' : 'Nothing nearby yet'}
                        </Text>
                        <Text style={styles.muted}>
                            {errands.length
                                ? 'Tap a pin on the map to see the details and the bounty.'
                                : 'Check back soon, neighbours are always up to something.'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm },
    muted: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center' },
    bigDisc: {
        width: 72,
        height: 72,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    emptyTitle: { ...TYPE.title, color: COLORS.ink, textAlign: 'center' },
    emptyText: { ...TYPE.body, color: COLORS.inkSecondary, textAlign: 'center', marginBottom: SPACING.md },
    listHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    title: { ...TYPE.title, color: COLORS.ink },
    map: { flex: 1 },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: SPACING.lg },
    headerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: SPACING.sm,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.full,
        paddingVertical: 10,
        paddingHorizontal: SPACING.md,
        ...SHADOW.float,
    },
    headerTitle: { ...TYPE.cardTitle, color: COLORS.ink },
    headerSub: { ...TYPE.caption, color: COLORS.inkSecondary },
    pin: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        borderWidth: 3,
        borderColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOW.float,
    },
    pinOn: { width: 48, height: 48, transform: [{ rotate: '-4deg' }] },
    locate: { position: 'absolute', right: SPACING.lg, backgroundColor: COLORS.white, ...SHADOW.float },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: RADIUS.sheet,
        borderTopRightRadius: RADIUS.sheet,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        ...SHADOW.sheet,
    },
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.surfacePressed,
        marginBottom: SPACING.md,
    },
    sheetEmpty: { paddingBottom: SPACING.md, gap: 4 },
    sheetTitle: { ...TYPE.heading, color: COLORS.ink, textAlign: 'center' },
}));
