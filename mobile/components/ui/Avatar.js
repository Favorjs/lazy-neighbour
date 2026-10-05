import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONT } from '../../constants/config';

// Photo, or initials on charcoal / stone. `online` adds a small green dot.
const FALLBACKS = [COLORS.charcoal, COLORS.stone];

export const Avatar = ({ source, name, size = 40, online = false, style }) => {
    const initials = name
        ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';
    const backgroundColor = FALLBACKS[name ? name.charCodeAt(0) % FALLBACKS.length : 0];

    return (
        <View style={[{ width: size, height: size }, style]}>
            {source?.uri ? (
                <Image
                    source={source}
                    style={[styles.round, { width: size, height: size, backgroundColor: COLORS.surfaceMuted }]}
                />
            ) : (
                <View style={[styles.round, styles.fallback, { width: size, height: size, backgroundColor }]}>
                    <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
                </View>
            )}
            {online ? <View style={styles.online} /> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    round: { borderRadius: 9999 },
    fallback: { alignItems: 'center', justifyContent: 'center' },
    initials: { color: COLORS.white, fontFamily: FONT.bold },
    online: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.green,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
});

export default Avatar;
