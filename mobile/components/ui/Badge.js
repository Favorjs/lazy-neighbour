import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { STATUS_LABELS, COLORS, RADIUS, TYPE, makeStyles } from '../../constants/config';

// Grey pill: coloured dot + ink icon + sentence-case label. Colour lives only in the dot
// (Disputed also colours its label).
export const Badge = ({ status, label, color, icon, size = 'md' }) => {
    const info = STATUS_LABELS[status] || {};
    const dot = color || info.color || COLORS.inkSecondary;
    const text = label || info.label || status;
    const glyph = icon || info.icon;
    const disputed = status === 'DISPUTED';

    return (
        <View style={[styles.badge, size === 'sm' && styles.badgeSm]}>
            <View style={[styles.dot, { backgroundColor: dot }]} />
            {glyph ? <Icon name={glyph} size={14} color={disputed ? COLORS.clay : COLORS.ink} /> : null}
            <Text style={[styles.text, disputed && { color: COLORS.clay }]} numberOfLines={1}>
                {text}
            </Text>
        </View>
    );
};

const styles = makeStyles(() => ({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        paddingVertical: 6,
        paddingLeft: 10,
        paddingRight: 12,
    },
    badgeSm: { paddingVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    text: { ...TYPE.badge, color: COLORS.ink },
}));

export default Badge;
