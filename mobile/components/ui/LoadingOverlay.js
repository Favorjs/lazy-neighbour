import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { SleepingPanda } from '../brand/SleepingPanda';
import { COLORS, SPACING, TYPE, makeStyles, useThemeVersion } from '../../constants/config';

// Full-screen "working on it" state: the sleeping panda in the middle of the screen. It sits over the
// screen (and swallows touches) so nothing can be tapped twice while a request is running.
export const LoadingOverlay = ({ visible, title = 'Hang tight', subtitle }) => {
    useThemeVersion();
    const fade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fade, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    }, [visible]);

    return (
        <Animated.View
            style={[styles.overlay, { opacity: fade }]}
            pointerEvents={visible ? 'auto' : 'none'}
            accessibilityViewIsModal={visible}
        >
            <SleepingPanda size={220} />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </Animated.View>
    );
};

const styles = makeStyles(() => ({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        gap: 6,
        zIndex: 50,
    },
    title: { ...TYPE.title, color: COLORS.ink, marginTop: SPACING.md, textAlign: 'center' },
    subtitle: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center' },
}));

export default LoadingOverlay;
