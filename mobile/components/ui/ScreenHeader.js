import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton } from './Button';
import { COLORS, SPACING, TYPE, makeStyles } from '../../constants/config';

// Back button, centred title, optional element on the right (keeps the title centred)
export const ScreenHeader = ({ title, right, onBack, showBack = true }) => {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <View style={styles.side}>
                {showBack ? (
                    <IconButton icon="ChevronLeft" label="Back" onPress={onBack || (() => router.back())} />
                ) : null}
            </View>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
        </View>
    );
};

const styles = makeStyles(() => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    side: { minWidth: 48, flex: 1 },
    title: { ...TYPE.heading, color: COLORS.ink, textAlign: 'center', flexShrink: 1 },
}));

export default ScreenHeader;
