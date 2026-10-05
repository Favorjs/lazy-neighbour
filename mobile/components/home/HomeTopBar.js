import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/Button';
import { COLORS, SPACING, RADIUS, TYPE, makeStyles } from '../../constants/config';
import { getSavedLocation, setSavedLocation, subscribeLocation } from '../../services/locationStore';

const describePlace = (place) => {
    if (!place) return null;
    const area = place.district || place.subregion || place.street || place.name;
    const city = place.city || place.region;
    return [area, city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || null;
};

// Top of the home screen: where you are on the left (tap to change it), notifications on the right
export const HomeTopBar = ({ unreadCount = 0, onBellPress, onLocationPress }) => {
    const [saved, setSaved] = useState(getSavedLocation);
    const [needsPermission, setNeedsPermission] = useState(false);

    // Stay in step with whatever the Change location screen picks
    useEffect(() => subscribeLocation(setSaved), []);

    // Unless you chose a place yourself, keep the label in step with where you actually are
    useEffect(() => {
        if (getSavedLocation()?.mode === 'custom') return;

        (async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setNeedsPermission(true);
                    return;
                }
                setNeedsPermission(false);

                const position =
                    (await Location.getLastKnownPositionAsync()) ||
                    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
                if (!position) return;

                const [found] = await Location.reverseGeocodeAsync(position.coords);
                const label = describePlace(found);
                if (label && getSavedLocation()?.mode !== 'custom') {
                    setSavedLocation({
                        label,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        mode: 'gps',
                    });
                }
            } catch (error) {
                // Keep whatever we had; the bar still works without a fix
            }
        })();
    }, []);

    const label = saved?.label || (needsPermission ? 'Set your location' : 'Choose a location');

    return (
        <View style={styles.bar}>
            <Pressable
                style={({ pressed }) => [styles.location, pressed && { backgroundColor: COLORS.surfacePressed }]}
                onPress={onLocationPress}
                accessibilityLabel="Change location"
                hitSlop={6}
            >
                <Icon name="MapPin" size={16} />
                <View style={{ flexShrink: 1 }}>
                    <Text style={styles.overline}>{saved?.mode === 'custom' ? 'CUSTOM LOCATION' : 'YOUR LOCATION'}</Text>
                    <Text style={styles.place} numberOfLines={1}>{label}</Text>
                </View>
                <Icon name="ChevronDown" size={16} color={COLORS.inkSecondary} />
            </Pressable>

            <View>
                <IconButton icon="Bell" label="Notifications" onPress={onBellPress} />
                {unreadCount > 0 ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

const styles = makeStyles(() => ({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        paddingTop: SPACING.sm,
    },
    location: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        paddingVertical: 8,
        paddingLeft: 12,
        paddingRight: 12,
        alignSelf: 'flex-start',
        maxWidth: '78%',
    },
    overline: { ...TYPE.overline, fontSize: 9, lineHeight: 12, color: COLORS.inkSecondary },
    place: { ...TYPE.chip, color: COLORS.ink },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 5,
        backgroundColor: COLORS.clay,
        borderWidth: 2,
        borderColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { ...TYPE.badge, fontSize: 10, lineHeight: 12, color: COLORS.white },
}));

export default HomeTopBar;
