import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Card, Avatar, Icon } from '../../components/ui';
import { ProfileSkeleton } from '../../components/ui/Skeleton';
import { KarmaBar } from '../../components/profile/KarmaBar';
import { COLORS, SPACING, RADIUS, TYPE } from '../../constants/config';
import { formatNaira } from '../../utils/format';
import api from '../../services/api';

const MENU = [
    { icon: 'Wallet', label: 'Wallet', route: '/wallet', wallet: true },
    { icon: 'CreditCard', label: 'Payment methods', route: '/payment-methods' },
    { icon: 'Bell', label: 'Notifications', route: '/notifications' },
    { icon: 'ShieldCheck', label: 'Settings', route: '/settings' },
    { icon: 'HelpCircle', label: 'Help and support', route: '/help' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchUser();
        }, [])
    );

    const fetchUser = async () => {
        try {
            const data = await api.getMe();
            setUser(data.user);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !user) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.scroll}>
                    <ProfileSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.top}>
                    <Avatar
                        source={user.avatarUrl ? { uri: user.avatarUrl } : null}
                        name={user.name}
                        size={96}
                    />
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                    <View style={styles.ratingChip}>
                        <Icon name="Star" size={14} />
                        <Text style={styles.ratingText}>{Number(user.ratingScore).toFixed(1)}</Text>
                    </View>
                </View>

                <Card variant="elevated" style={styles.card}>
                    <KarmaBar karmaPoints={user.karmaPoints} />
                </Card>

                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{user.stats?.errandsRequested || 0}</Text>
                        <Text style={styles.statLabel}>Sent</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{user.stats?.errandsCompleted || 0}</Text>
                        <Text style={styles.statLabel}>Run</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{formatNaira(user.totalEarnings || 0)}</Text>
                        <Text style={styles.statLabel}>Earned</Text>
                    </View>
                </View>

                <Card style={styles.card} padding={SPACING.sm}>
                    {MENU.map((item, i) => (
                        <Pressable
                            key={item.label}
                            onPress={() => router.push(item.route)}
                            style={({ pressed }) => [
                                styles.menuItem,
                                i > 0 && styles.menuBorder,
                                pressed && { backgroundColor: COLORS.surfaceMuted },
                            ]}
                        >
                            <View style={styles.menuDisc}>
                                <Icon name={item.icon} size={20} />
                            </View>
                            <Text style={styles.menuText}>{item.label}</Text>
                            {item.wallet ? (
                                <Text style={styles.menuValue}>{formatNaira(user.walletBalance || 0)}</Text>
                            ) : null}
                            <Icon name="ChevronRight" size={20} color={COLORS.grey} />
                        </Pressable>
                    ))}
                </Card>

                <Text style={styles.version}>Lazy Neighbour 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    top: { alignItems: 'center', paddingVertical: SPACING.lg, gap: 4 },
    name: { ...TYPE.title, color: COLORS.ink, marginTop: SPACING.sm },
    email: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    ratingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginTop: SPACING.sm,
    },
    ratingText: { ...TYPE.chip, color: COLORS.ink },
    card: { marginBottom: SPACING.md },
    stats: { flexDirection: 'row', gap: SPACING.sm + 2, marginBottom: SPACING.md },
    stat: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        paddingVertical: SPACING.md,
    },
    statValue: { ...TYPE.amount, color: COLORS.ink },
    statLabel: { ...TYPE.caption, color: COLORS.inkSecondary },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: RADIUS.tile },
    menuBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
    menuDisc: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuValue: { ...TYPE.cardTitle, color: COLORS.ink },
    menuText: { ...TYPE.cardTitle, fontFamily: TYPE.label.fontFamily, color: COLORS.ink, flex: 1 },
    version: { ...TYPE.caption, color: COLORS.inkSecondary, textAlign: 'center', marginTop: SPACING.lg },
});
