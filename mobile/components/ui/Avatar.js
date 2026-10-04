import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../constants/config';

export const Avatar = ({
    source, // { uri: string }
    name,
    size = 40,
    style,
}) => {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const colorIndex = name ? name.charCodeAt(0) % 5 : 0;
    const colors = [COLORS.primary, COLORS.accent, '#F59E0B', '#EC4899', '#8B5CF6'];
    const backgroundColor = colors[colorIndex];

    if (source?.uri) {
        return (
            <Image
                source={source}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                    style,
                ]}
            />
        );
    }

    return (
        <View
            style={[
                styles.fallback,
                { width: size, height: size, borderRadius: size / 2, backgroundColor },
                style,
            ]}
        >
            <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        backgroundColor: COLORS.bgElevated,
    },
    fallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: COLORS.white,
        fontWeight: '700',
    },
});

export default Avatar;
