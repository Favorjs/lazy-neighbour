import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Badge, Avatar, Button, Icon } from '../ui';
import { COLORS, CATEGORIES, SPACING, RADIUS, SHADOW, TYPE, makeStyles } from '../../constants/config';
import { formatNaira } from '../../utils/format';

export const formatTime = (dateString) => {
    const minutes = Math.floor((Date.now() - new Date(dateString)) / 60000);
    const hours = Math.floor(minutes / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} h ago`;
    return new Date(dateString).toLocaleDateString();
};

const formatMoney = formatNaira;

// Chat is open while an errand is in progress, and only for the two people on it
export const CHAT_OPEN_STATUSES = ['ACTIVE', 'COMPLETED'];

export const canChat = (errand, userId) =>
    !!userId &&
    !!errand.runnerId &&
    CHAT_OPEN_STATUSES.includes(errand.status) &&
    (errand.requesterId === userId || errand.runnerId === userId);

// The other person in the chat, from the viewer's side
const chatPartner = (errand, userId) =>
    errand.requesterId === userId ? errand.runner : errand.requester;

// Where the errand sits on the journey: posted, accepted, running, paid
const STEP_OF_STATUS = { PENDING: 1, ACTIVE: 2, COMPLETED: 3, RELEASED: 4, DISPUTED: 3, CANCELLED: 0 };

// default: runner feed card with a one-tap Accept · tracking (alias: compact): requester list item
export const ErrandCard = ({ errand, onPress, onAccept, onChat, currentUserId, acceptLoading = false, showDistance = true, variant = 'default' }) => {
    const category = CATEGORIES[errand.category] || CATEGORIES.QUICK;
    const chatOpen = !!onChat && canChat(errand, currentUserId);
    const partnerName = chatPartner(errand, currentUserId)?.name?.split(' ')[0];

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(errand);
    };

    if (variant === 'tracking' || variant === 'compact') {
        const step = STEP_OF_STATUS[errand.status] ?? 0;
        return (
            <Pressable onPress={handlePress} style={[styles.card, styles.trackingCard]}>
                <View style={styles.topRow}>
                    <View style={styles.catRow}>
                        <View style={[styles.catDisc, { backgroundColor: category.tint }]}>
                            <Icon name={category.icon} size={18} />
                        </View>
                        <Text style={styles.catName}>{category.label}</Text>
                    </View>
                    <Text style={styles.amount}>{formatMoney(errand.bountyAmount)}</Text>
                </View>

                <Text style={styles.title} numberOfLines={1}>{errand.title}</Text>

                <View style={styles.steps}>
                    {[1, 2, 3, 4].map((n) => (
                        <View key={n} style={[styles.seg, n <= step && styles.segOn]} />
                    ))}
                </View>

                <View style={styles.topRow}>
                    <Badge status={errand.status} />
                    <Text style={styles.meta}>{formatTime(errand.createdAt)}</Text>
                </View>

                {chatOpen ? (
                    <Button
                        title={partnerName ? `Chat with ${partnerName}` : 'Open chat'}
                        icon="MessageCircle"
                        size="sm"
                        block
                        bubbleIcon="ArrowRight"
                        onPress={() => onChat(errand)}
                    />
                ) : null}
            </Pressable>
        );
    }

    return (
        <Pressable onPress={handlePress} style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.catRow}>
                    <View style={[styles.catDisc, { backgroundColor: category.tint }]}>
                        <Icon name={category.icon} size={18} />
                    </View>
                    <Text style={styles.catName}>{category.label}</Text>
                </View>
                <View style={styles.ageRow}>
                    <View style={styles.ageDot} />
                    <Text style={styles.age}>{formatTime(errand.createdAt)}</Text>
                </View>
            </View>

            <Text style={styles.title}>{errand.title}</Text>
            <Text style={styles.desc} numberOfLines={1}>{errand.description}</Text>

            <View style={styles.chipRow}>
                {showDistance && errand.distance !== undefined ? (
                    <View style={styles.chip}>
                        <Icon name="MapPin" size={14} />
                        <Text style={styles.chipText}>{errand.distance} km</Text>
                    </View>
                ) : errand.address ? (
                    <View style={[styles.chip, { flexShrink: 1 }]}>
                        <Icon name="MapPin" size={14} />
                        <Text style={styles.chipText} numberOfLines={1}>{errand.address}</Text>
                    </View>
                ) : null}
                <View style={styles.bountyPill}>
                    <Icon name="Sparkles" size={14} color={COLORS.white} />
                    <Text style={styles.bountyText}>{formatMoney(errand.bountyAmount)}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.who}>
                    <Avatar
                        source={errand.requester?.avatarUrl ? { uri: errand.requester.avatarUrl } : null}
                        name={errand.requester?.name}
                        size={32}
                    />
                    <Text style={styles.whoName} numberOfLines={1}>{errand.requester?.name || 'A neighbour'}</Text>
                    {errand.requester?.ratingScore ? (
                        <View style={styles.rating}>
                            <Icon name="Star" size={12} />
                            <Text style={styles.ratingText}>{Number(errand.requester.ratingScore).toFixed(1)}</Text>
                        </View>
                    ) : null}
                </View>
                {chatOpen ? (
                    <Button title="Chat" icon="MessageCircle" variant="primary" size="sm" onPress={() => onChat(errand)} />
                ) : onAccept ? (
                    <Button title="Accept" variant="primary" size="sm" loading={acceptLoading} onPress={() => onAccept(errand)} />
                ) : (
                    <Badge status={errand.status} size="sm" />
                )}
            </View>
        </Pressable>
    );
};

const styles = makeStyles(() => ({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
        gap: 12,
        marginBottom: SPACING.md,
        ...SHADOW.card,
    },
    trackingCard: { gap: 10 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    catDisc: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catName: { ...TYPE.chip, color: COLORS.ink },
    ageRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.ink },
    age: { ...TYPE.badge, color: COLORS.inkSecondary },
    title: { ...TYPE.heading, fontFamily: TYPE.title.fontFamily, color: COLORS.ink },
    desc: { ...TYPE.bodySm, color: COLORS.inkSecondary, marginTop: -6 },
    chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    chipText: { ...TYPE.chip, color: COLORS.ink },
    bountyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.ink,
        borderRadius: RADIUS.full,
        paddingVertical: 4,
        paddingLeft: 10,
        paddingRight: 14,
        transform: [{ rotate: '-3deg' }],
    },
    bountyText: { ...TYPE.cardTitle, fontFamily: TYPE.amount.fontFamily, color: COLORS.white },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        padding: 6,
        paddingRight: 6,
    },
    who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    whoName: { ...TYPE.chip, color: COLORS.ink, flexShrink: 1 },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { ...TYPE.caption, color: COLORS.inkSecondary },
    amount: { ...TYPE.amount, color: COLORS.ink },
    steps: { flexDirection: 'row', gap: 4 },
    seg: { flex: 1, height: 6, borderRadius: RADIUS.detail, backgroundColor: COLORS.surfacePressed },
    segOn: { backgroundColor: COLORS.ink },
    meta: { ...TYPE.caption, color: COLORS.inkSecondary },
}));

export default ErrandCard;
