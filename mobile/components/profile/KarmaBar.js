import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { COLORS, RADIUS, TYPE, makeStyles } from '../../constants/config';

const calculateLevel = (points) => {
    if (points < 100) return { level: 1, name: 'Newcomer', next: 100, progress: points / 100 };
    if (points < 500) return { level: 2, name: 'Helper', next: 500, progress: (points - 100) / 400 };
    if (points < 1000) return { level: 3, name: 'Champion', next: 1000, progress: (points - 500) / 500 };
    if (points < 2500) return { level: 4, name: 'Legend', next: 2500, progress: (points - 1000) / 1500 };
    return { level: 5, name: 'Lazy Hero', next: null, progress: 1 };
};

// Level medal + karma points over a black-on-grey track
export const KarmaBar = ({ karmaPoints = 0, showLabel = true, style }) => {
    const info = calculateLevel(karmaPoints);

    return (
        <View style={[styles.container, style]}>
            {showLabel ? (
                <View style={styles.head}>
                    <View style={styles.level}>
                        <View style={styles.medal}>
                            <Icon name="Medal" size={18} color={COLORS.white} />
                        </View>
                        <Text style={styles.levelText}>Level {info.level} · {info.name}</Text>
                    </View>
                    <Text style={styles.points}>
                        {karmaPoints} karma{info.next ? ` / ${info.next}` : ''}
                    </Text>
                </View>
            ) : null}
            <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(info.progress * 100, 100)}%` }]} />
            </View>
        </View>
    );
};

const styles = makeStyles(() => ({
    container: { gap: 10 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    level: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    medal: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelText: { ...TYPE.label, fontFamily: TYPE.cardTitle.fontFamily, color: COLORS.ink },
    points: { ...TYPE.caption, color: COLORS.inkSecondary },
    track: { height: 10, backgroundColor: COLORS.surfacePressed, borderRadius: RADIUS.full, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: COLORS.ink, borderRadius: RADIUS.full },
}));

export default KarmaBar;
