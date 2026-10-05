import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOW, SPACING, makeStyles } from '../../constants/config';

// default: 1px line border · elevated: soft neutral shadow (feed and tracker)
export const Card = ({ children, variant = 'default', style, padding = SPACING.md }) => (
    <View style={[styles.card, variant === 'elevated' ? styles.elevated : styles.bordered, { padding }, style]}>
        {children}
    </View>
);

const styles = makeStyles(() => ({
    card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.card },
    bordered: { borderWidth: 1, borderColor: COLORS.line },
    elevated: SHADOW.card,
}));

export default Card;
