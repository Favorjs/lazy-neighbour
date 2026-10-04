import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/config';

export const KarmaBar = ({
    karmaPoints = 0,
    level = null,
    showLabel = true,
    style,
}) => {
    // Calculate level and progress
    const calculateLevel = (points) => {
        if (points < 100) return { level: 1, name: 'Newcomer', next: 100, progress: points / 100 };
        if (points < 500) return { level: 2, name: 'Helper', next: 500, progress: (points - 100) / 400 };
        if (points < 1000) return { level: 3, name: 'Champion', next: 1000, progress: (points - 500) / 500 };
        if (points < 2500) return { level: 4, name: 'Legend', next: 2500, progress: (points - 1000) / 1500 };
        return { level: 5, name: 'Lazy Hero', next: null, progress: 1 };
    };

    const levelInfo = calculateLevel(karmaPoints);
    const progressWidth = `${Math.min(levelInfo.progress * 100, 100)}%`;

    return (
        <View style={[styles.container, style]}>
            {showLabel && (
                <View style={styles.header}>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelNumber}>Lvl {levelInfo.level}</Text>
                        <Text style={styles.levelName}>{levelInfo.name}</Text>
                    </View>
                    <Text style={styles.points}>
                        {karmaPoints} karma
                        {levelInfo.next && ` / ${levelInfo.next}`}
                    </Text>
                </View>
            )}

            <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: progressWidth }]} />
                <View style={styles.barGlow} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: SPACING.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    levelNumber: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    levelName: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    points: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    barContainer: {
        height: 8,
        backgroundColor: COLORS.bgElevated,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
    },
    barGlow: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 20,
        backgroundColor: 'rgba(124, 58, 237, 0.5)',
    },
});

export default KarmaBar;
