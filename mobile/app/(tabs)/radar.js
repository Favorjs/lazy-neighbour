import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Card, Badge } from '../../components/ui';
import { COLORS, CATEGORIES, SPACING, RADIUS } from '../../constants/config';
import api from '../../services/api';

// Only import maps on native platforms
let MapView, Marker, Circle;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
}

const { width } = Dimensions.get('window');
const RADIUS_KM = 5;

export default function RadarScreen() {
    const router = useRouter();
    const mapRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [errands, setErrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedErrand, setSelectedErrand] = useState(null);

    useEffect(() => {
        getLocationAndErrands();
    }, []);

    const getLocationAndErrands = async () => {
        try {
            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to find nearby errands.'
                );
                setLoading(false);
                return;
            }

            // Get current location
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
            setLocation(coords);

            // Fetch nearby errands
            const data = await api.getNearbyErrands(
                coords.latitude,
                coords.longitude,
                RADIUS_KM
            );
            setErrands(data.errands || []);
        } catch (error) {
            console.error('Failed to get location/errands:', error);
            Alert.alert('Error', 'Failed to load nearby errands');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerPress = (errand) => {
        setSelectedErrand(errand);
    };

    const handleErrandPress = () => {
        if (selectedErrand) {
            router.push(`/errand/${selectedErrand.id}`);
        }
    };

    const centerOnUser = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                ...location,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Finding nearby errands...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!location) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorEmoji}>📍</Text>
                    <Text style={styles.errorTitle}>Location Required</Text>
                    <Text style={styles.errorText}>
                        Please enable location services to find nearby errands.
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={getLocationAndErrands}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Web fallback - show list instead of map
    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Errand Radar</Text>
                    <Text style={styles.subtitle}>
                        {errands.length} tasks within {RADIUS_KM}km
                    </Text>
                </View>
                <FlatList
                    data={errands}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: SPACING.lg }}
                    renderItem={({ item }) => {
                        const category = CATEGORIES[item.category] || {};
                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/errand/${item.id}`)}
                                activeOpacity={0.8}
                            >
                                <Card variant="elevated" style={{ marginBottom: SPACING.md }}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.categoryTag}>
                                            <Text>{category.icon}</Text>
                                            <Text style={styles.categoryLabel}>{category.label}</Text>
                                        </View>
                                        <Badge status={item.status} size="sm" />
                                    </View>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDescription} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.bounty}>${item.bountyAmount}</Text>
                                        <Text style={styles.distance}>📍 {item.distance} km away</Text>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorEmoji}>🔍</Text>
                            <Text style={styles.errorTitle}>No errands nearby</Text>
                            <Text style={styles.errorText}>Check back later!</Text>
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
                initialRegion={{
                    ...location,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                customMapStyle={darkMapStyle}
            >
                {/* User location marker */}
                <Marker coordinate={location}>
                    <View style={styles.userMarker}>
                        <Text>📍</Text>
                    </View>
                </Marker>

                {/* Radius circle */}
                <Circle
                    center={location}
                    radius={RADIUS_KM * 1000}
                    strokeColor={COLORS.primary}
                    fillColor={`${COLORS.primary}10`}
                    strokeWidth={2}
                />

                {/* Errand markers */}
                {errands.map((errand) => {
                    const category = CATEGORIES[errand.category] || {};
                    return (
                        <Marker
                            key={errand.id}
                            coordinate={{
                                latitude: errand.locationLat,
                                longitude: errand.locationLng,
                            }}
                            onPress={() => handleMarkerPress(errand)}
                        >
                            <View
                                style={[
                                    styles.errandMarker,
                                    { backgroundColor: category.color || COLORS.primary },
                                ]}
                            >
                                <Text style={styles.markerIcon}>{category.icon || '📌'}</Text>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {/* Header overlay */}
            <SafeAreaView style={styles.headerOverlay}>
                <View style={styles.header}>
                    <Text style={styles.title}>Errand Radar</Text>
                    <Text style={styles.subtitle}>
                        {errands.length} tasks within {RADIUS_KM}km
                    </Text>
                </View>
            </SafeAreaView>

            {/* Center button */}
            <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
                <Text>🎯</Text>
            </TouchableOpacity>

            {/* Selected errand card */}
            {selectedErrand && (
                <TouchableOpacity
                    style={styles.errandCardContainer}
                    onPress={handleErrandPress}
                    activeOpacity={0.9}
                >
                    <Card variant="elevated" style={styles.errandCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.categoryTag}>
                                <Text>{CATEGORIES[selectedErrand.category]?.icon}</Text>
                                <Text style={styles.categoryLabel}>
                                    {CATEGORIES[selectedErrand.category]?.label}
                                </Text>
                            </View>
                            <Badge status={selectedErrand.status} size="sm" />
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {selectedErrand.title}
                        </Text>
                        <Text style={styles.cardDescription} numberOfLines={2}>
                            {selectedErrand.description}
                        </Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.bounty}>${selectedErrand.bountyAmount}</Text>
                            <Text style={styles.distance}>
                                📍 {selectedErrand.distance} km away
                            </Text>
                        </View>
                    </Card>
                </TouchableOpacity>
            )}
        </View>
    );
}

// Dark map style for the theme
const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#304a7d' }],
    },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    errorEmoji: {
        fontSize: 64,
        marginBottom: SPACING.md,
    },
    errorTitle: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: SPACING.sm,
    },
    errorText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.lg,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    map: {
        flex: 1,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    header: {
        padding: SPACING.lg,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 2,
    },
    userMarker: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    errandMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerIcon: {
        fontSize: 16,
    },
    centerButton: {
        position: 'absolute',
        right: SPACING.lg,
        bottom: 180,
        width: 48,
        height: 48,
        backgroundColor: COLORS.bgCard,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    errandCardContainer: {
        position: 'absolute',
        bottom: 100,
        left: SPACING.lg,
        right: SPACING.lg,
    },
    errandCard: {
        padding: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    categoryLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: SPACING.xs,
    },
    cardDescription: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: SPACING.sm,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bounty: {
        color: COLORS.accent,
        fontSize: 20,
        fontWeight: '800',
    },
    distance: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});
