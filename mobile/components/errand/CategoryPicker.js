import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '../ui/Icon';
import { COLORS, CATEGORIES, SPACING, RADIUS, TYPE } from '../../constants/config';

// Four-up grid of category tiles. Selected: the tile turns black, tilts -2 degrees.
export const CategoryPicker = ({ selected, onSelect, title = 'What kind of errand?', style }) => {
    const handleSelect = (key) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(key);
    };

    return (
        <View style={[styles.container, style]}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <View style={styles.grid}>
                {Object.entries(CATEGORIES).map(([key, category]) => {
                    const on = selected === key;
                    return (
                        <Pressable
                            key={key}
                            onPress={() => handleSelect(key)}
                            accessibilityState={{ selected: on }}
                            style={[styles.tile, on && styles.tileOn]}
                        >
                            <View style={[styles.disc, on && { backgroundColor: COLORS.white }]}>
                                <Icon name={category.icon} size={24} color={COLORS.ink} />
                            </View>
                            <Text style={[styles.label, on && { color: COLORS.white }]} numberOfLines={2}>
                                {category.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: SPACING.md },
    title: { ...TYPE.heading, color: COLORS.ink, marginBottom: SPACING.sm + 2 },
    grid: { flexDirection: 'row', gap: 10 },
    tile: {
        flex: 1,
        alignItems: 'center',
        gap: 10,
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 4,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tileOn: {
        backgroundColor: COLORS.ink,
        borderColor: COLORS.ink,
        transform: [{ rotate: '-2deg' }],
    },
    disc: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { ...TYPE.chip, color: COLORS.ink, textAlign: 'center' },
});

export default CategoryPicker;
