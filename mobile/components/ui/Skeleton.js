import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOW, SPACING, makeStyles } from '../../constants/config';

// One shared pulse so every block on a screen breathes in sync
const useShimmer = () => {
    const t = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(t, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(t, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [t]);

    return t;
};

// A single grey block that pulses. Sizes are in px, or a percentage string for width.
export const Skeleton = ({ width = '100%', height = 16, radius = 8, style }) => {
    const t = useShimmer();
    return (
        <Animated.View
            style={[
                { width, height, borderRadius: radius, backgroundColor: COLORS.surfaceMuted },
                { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                style,
            ]}
        />
    );
};

export const SkeletonCircle = ({ size = 40, style }) => (
    <Skeleton width={size} height={size} radius={size / 2} style={style} />
);

// --- Shapes that mirror real screens -------------------------------------------------

// Feed / radar card
export const ErrandCardSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.between}>
            <View style={styles.row}>
                <SkeletonCircle size={36} />
                <Skeleton width={90} height={14} />
            </View>
            <Skeleton width={64} height={12} />
        </View>
        <Skeleton width="70%" height={22} />
        <Skeleton width="90%" height={14} />
        <View style={styles.row}>
            <Skeleton width={72} height={28} radius={RADIUS.full} />
            <Skeleton width={84} height={30} radius={RADIUS.full} />
        </View>
        <Skeleton height={44} radius={RADIUS.full} />
    </View>
);

// My errands list item
export const TrackingCardSkeleton = () => (
    <View style={[styles.card, { gap: 10 }]}>
        <View style={styles.between}>
            <View style={styles.row}>
                <SkeletonCircle size={36} />
                <Skeleton width={90} height={14} />
            </View>
            <Skeleton width={60} height={22} />
        </View>
        <Skeleton width="65%" height={18} />
        <View style={styles.row}>
            {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width="23%" height={6} radius={RADIUS.detail} />
            ))}
        </View>
        <View style={styles.between}>
            <Skeleton width={120} height={28} radius={RADIUS.full} />
            <Skeleton width={56} height={12} />
        </View>
    </View>
);

export const ErrandListSkeleton = ({ count = 3, variant = 'default' }) => (
    <View>
        {Array.from({ length: count }).map((_, i) =>
            variant === 'tracking' ? <TrackingCardSkeleton key={i} /> : <ErrandCardSkeleton key={i} />
        )}
    </View>
);

export const HomeHeaderSkeleton = () => (
    <View style={{ gap: 12, paddingTop: SPACING.sm }}>
        <View style={styles.between}>
            <Skeleton width={170} height={46} radius={RADIUS.full} />
            <SkeletonCircle size={48} />
        </View>
        <Skeleton height={206} radius={RADIUS.card} style={{ marginTop: SPACING.xs }} />
        <Skeleton height={56} radius={RADIUS.full} />
        <View style={[styles.row, { marginTop: SPACING.md }]}>
            {[56, 96, 84, 104].map((w, i) => (
                <Skeleton key={i} width={w} height={34} radius={RADIUS.full} />
            ))}
        </View>
    </View>
);

export const ProfileSkeleton = () => (
    <View style={{ gap: SPACING.md, paddingTop: SPACING.lg }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
            <SkeletonCircle size={96} />
            <Skeleton width={160} height={26} />
            <Skeleton width={190} height={14} />
            <Skeleton width={70} height={30} radius={RADIUS.full} />
        </View>
        <Skeleton height={86} radius={RADIUS.card} />
        <Skeleton height={76} radius={RADIUS.card} />
        <View style={styles.row}>
            {[0, 1, 2].map((i) => (
                <Skeleton key={i} width="31%" height={72} radius={RADIUS.card} />
            ))}
        </View>
        <Skeleton height={190} radius={RADIUS.card} />
    </View>
);

export const ErrandDetailSkeleton = () => (
    <View style={{ gap: SPACING.md, paddingHorizontal: SPACING.lg }}>
        <Skeleton width={110} height={32} radius={RADIUS.full} />
        <Skeleton width="85%" height={32} />
        <Skeleton height={16} />
        <Skeleton width="70%" height={16} />
        <Skeleton height={104} radius={RADIUS.card} style={{ marginTop: SPACING.sm }} />
        <Skeleton width={150} height={22} style={{ marginTop: SPACING.md }} />
        <Skeleton height={250} radius={RADIUS.card} />
        <Skeleton height={86} radius={RADIUS.card} />
    </View>
);

export const ChatSkeleton = () => (
    <View style={{ padding: SPACING.md, gap: SPACING.md }}>
        <View style={styles.row}>
            <SkeletonCircle size={32} />
            <Skeleton width="55%" height={48} radius={RADIUS.card} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width="45%" height={40} radius={RADIUS.card} />
        </View>
        <View style={styles.row}>
            <SkeletonCircle size={32} />
            <Skeleton width="65%" height={64} radius={RADIUS.card} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width="38%" height={40} radius={RADIUS.card} />
        </View>
    </View>
);


// Generic list rows: avatar/icon disc, two lines of text, a trailing bit (notifications, inbox, wallet activity)
export const RowListSkeleton = ({ count = 6, avatar = 48 }) => (
    <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.md, paddingTop: SPACING.sm }}>
        {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={styles.row}>
                <SkeletonCircle size={avatar} />
                <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton width="55%" height={16} />
                    <Skeleton width="85%" height={13} />
                </View>
                <Skeleton width={36} height={12} />
            </View>
        ))}
    </View>
);

export const WalletSkeleton = () => (
    <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.md }}>
        <Skeleton height={190} radius={RADIUS.card} />
        <Skeleton width={110} height={22} style={{ marginTop: SPACING.sm }} />
        <RowListSkeleton count={4} avatar={44} />
    </View>
);

const styles = makeStyles(() => ({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
        gap: 12,
        marginBottom: SPACING.md,
        ...SHADOW.card,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));

export default Skeleton;
