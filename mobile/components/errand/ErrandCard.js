import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card, Badge, Avatar } from '../ui';
import { COLORS, CATEGORIES, SPACING, RADIUS } from '../../constants/config';

export const ErrandCard = ({
    errand,
    onPress,
    showDistance = false,
    variant = 'default', // default, compact
}) => {
    const category = CATEGORIES[errand.category] || {};

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(errand);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    if (variant === 'compact') {
        return (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
                <Card style={styles.compactCard}>
                    <View style={styles.compactRow}>
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <View style={styles.compactContent}>
                            <Text style={styles.compactTitle} numberOfLines={1}>{errand.title}</Text>
                            <Text style={styles.compactMeta}>
                                ${errand.bountyAmount} • {formatTime(errand.createdAt)}
                            </Text>
                        </View>
                        <Badge status={errand.status} size="sm" />
                    </View>
                </Card>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Card variant="elevated" style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Avatar
                            source={errand.requester?.avatarUrl ? { uri: errand.requester.avatarUrl } : null}
                            name={errand.requester?.name}
                            size={40}
                        />
                        <View style={styles.userText}>
                            <Text style={styles.userName}>{errand.requester?.name || 'Anonymous'}</Text>
                            <Text style={styles.time}>{formatTime(errand.createdAt)}</Text>
                        </View>
                    </View>
                    <Badge status={errand.status} />
                </View>

                {/* Category Tag */}
                <View style={[styles.categoryTag, { backgroundColor: `${category.color}20` }]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[styles.categoryLabel, { color: category.color }]}>
                        {category.label}
                    </Text>
                </View>

                {/* Content */}
                <Text style={styles.title}>{errand.title}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {errand.description}
                </Text>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.bountyContainer}>
                        <Text style={styles.bountyLabel}>Bounty</Text>
                        <Text style={styles.bountyAmount}>${errand.bountyAmount}</Text>
                    </View>

                    {showDistance && errand.distance !== undefined && (
                        <View style={styles.distanceContainer}>
                            <Text style={styles.distanceIcon}>📍</Text>
                            <Text style={styles.distanceText}>{errand.distance} km away</Text>
                        </View>
                    )}

                    {errand.address && (
                        <Text style={styles.address} numberOfLines={1}>
                            📍 {errand.address}
                        </Text>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    userText: {
        gap: 2,
    },
    userName: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    time: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.full,
        gap: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: SPACING.xs,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: SPACING.md,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    bountyContainer: {
        gap: 2,
    },
    bountyLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    bountyAmount: {
        color: COLORS.accent,
        fontSize: 24,
        fontWeight: '800',
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    distanceIcon: {
        fontSize: 14,
    },
    distanceText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    address: {
        color: COLORS.textSecondary,
        fontSize: 12,
        flex: 1,
        textAlign: 'right',
    },
    // Compact styles
    compactCard: {
        marginBottom: SPACING.sm,
        padding: SPACING.sm,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    compactContent: {
        flex: 1,
        gap: 2,
    },
    compactTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    compactMeta: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});

export default ErrandCard;
