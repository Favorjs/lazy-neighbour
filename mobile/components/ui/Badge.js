import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABELS, RADIUS, SPACING } from '../../constants/config';

export const Badge = ({
    status, // PENDING, ACTIVE, COMPLETED, etc.
    label, // Custom label
    color, // Custom color (overrides status color)
    size = 'md', // sm, md
}) => {
    const statusInfo = STATUS_LABELS[status] || {};
    const displayLabel = label || statusInfo.label || status;
    const displayColor = color || statusInfo.color || '#666';

    const sizeStyles = {
        sm: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 10 },
        md: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 12 },
    };

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: `${displayColor}20`,
                    paddingVertical: sizeStyles[size].paddingVertical,
                    paddingHorizontal: sizeStyles[size].paddingHorizontal,
                },
            ]}
        >
            <View style={[styles.dot, { backgroundColor: displayColor }]} />
            <Text style={[styles.text, { color: displayColor, fontSize: sizeStyles[size].fontSize }]}>
                {displayLabel}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.full,
        gap: SPACING.xs,
        alignSelf: 'flex-start',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    text: {
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});

export default Badge;
