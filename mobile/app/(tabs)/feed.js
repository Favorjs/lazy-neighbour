import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ErrandCard } from '../../components/errand/ErrandCard';
import { HomeTopBar } from '../../components/home/HomeTopBar';
import { SleepingPanda } from '../../components/brand/SleepingPanda';
import { Button, Icon, Sheet } from '../../components/ui';
import { HomeHeaderSkeleton, ErrandListSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { COLORS, CATEGORIES, SPACING, RADIUS, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import { errandEvents } from '../../services/errandEvents';
import api from '../../services/api';

export default function FeedScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const [errands, setErrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [user, setUser] = useState(null);
    const [acceptingId, setAcceptingId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchFeed = async () => {
        try {
            const [feedData, userData] = await Promise.all([
                api.getFeed(1, selectedCategory),
                api.getMe().catch(() => null),
            ]);
            setErrands(feedData.errands || []);
            if (userData?.user) setUser(userData.user);
        } catch (error) {
            console.error('Failed to fetch feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, [selectedCategory]);

    // A cancel (or any change) elsewhere shows up here immediately
    useEffect(
        () =>
            errandEvents.subscribe((event) => {
                if (event.type === 'removed') setErrands((list) => list.filter((e) => e.id !== event.id));
                else fetchFeed();
            }),
        [selectedCategory]
    );

    // Refresh the bell's unread count every time Home comes back into view
    useFocusEffect(
        useCallback(() => {
            api.getUnreadNotificationCount()
                .then((d) => setUnreadCount(d.unreadCount || 0))
                .catch(() => { });
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFeed();
    }, [selectedCategory]);

    const openErrand = (errand) => router.push(`/errand/${errand.id}`);

    const acceptErrand = async (errand) => {
        setAcceptingId(errand.id);
        try {
            await api.acceptErrand(errand.id);
            router.push(`/errand/${errand.id}`);
        } catch (error) {
            Sheet.alert('Could not accept', error.message || 'Please try again');
        } finally {
            setAcceptingId(null);
        }
    };

    const firstName = user?.name?.split(' ')[0];

    // The two big actions: Send is the one primary pill, Run sits right under it.
    const sendCta = (
        <Button
            title="Send an errand"
            variant="primary"
            block
            bubbleIcon="Plus"
            onPress={() => router.push('/post')}
        />
    );
    const runCta = (
        <Button
            title="Run errands, get paid"
            variant="soft"
            block
            bubbleIcon="Footprints"
            onPress={() => router.push('/(tabs)/radar')}
        />
    );

    const Header = (
        <View>
            <HomeTopBar
                unreadCount={unreadCount}
                onBellPress={() => router.push('/notifications')}
                onLocationPress={() => router.push('/location')}
            />

            <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greeting}>{firstName ? `Hi, ${firstName}` : 'Welcome'}</Text>
                        <Text style={styles.hero}>What do you need?</Text>
                    </View>
                    <SleepingPanda size={88} />
                </View>
                <Text style={styles.sub}>Send a task to a neighbour, or pick one up and earn.</Text>
                {sendCta}
            </View>

            <View style={styles.runRow}>{runCta}</View>

            <Text style={styles.section}>Around you</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                style={styles.chipScroll}
            >
                <Pressable
                    style={[styles.chip, !selectedCategory && styles.chipOn]}
                    onPress={() => setSelectedCategory(null)}
                >
                    <Text style={[styles.chipText, !selectedCategory && styles.chipTextOn]}>All</Text>
                </Pressable>
                {Object.entries(CATEGORIES).map(([key, cat]) => {
                    const on = selectedCategory === key;
                    return (
                        <Pressable
                            key={key}
                            style={[styles.chip, { backgroundColor: cat.tint }, on && styles.chipOn]}
                            onPress={() => setSelectedCategory(on ? null : key)}
                        >
                            <Icon name={cat.icon} size={14} color={on ? COLORS.white : COLORS.ink} />
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{cat.label}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.listContent}>
                    <HomeHeaderSkeleton />
                    <Skeleton width={120} height={22} style={{ marginTop: SPACING.xl, marginBottom: SPACING.md }} />
                    <ErrandListSkeleton count={2} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                extraData={themeVersion}
                data={errands}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ErrandCard
                        errand={item}
                        onPress={openErrand}
                        onAccept={item.requesterId !== user?.id && item.status === 'PENDING' ? acceptErrand : undefined}
                        onChat={(e) => router.push(`/chat/${e.id}`)}
                        currentUserId={user?.id}
                        acceptLoading={acceptingId === item.id}
                    />
                )}
                ListHeaderComponent={Header}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ink} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>Quiet around here</Text>
                        <Text style={styles.emptyText}>
                            No errands yet. Be the first neighbour to ask for a hand.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    heroCard: {
        marginTop: SPACING.md,
        backgroundColor: COLORS.tint.yellow,
        borderRadius: RADIUS.card,
        padding: SPACING.md + 4,
        gap: 12,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    greeting: { fontFamily: TYPE.heading.fontFamily, fontSize: 22, lineHeight: 30, color: COLORS.ink },
    hero: { ...TYPE.hero, fontSize: 32, lineHeight: 40, color: COLORS.ink },
    sub: { ...TYPE.bodySm, color: COLORS.ink, opacity: 0.75 },
    runRow: { marginTop: 12 },
    section: { ...TYPE.heading, color: COLORS.ink, marginTop: SPACING.xl, marginBottom: SPACING.sm + 2 },
    chipScroll: { marginHorizontal: -SPACING.lg, marginBottom: SPACING.md },
    chips: { paddingHorizontal: SPACING.lg, gap: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    chipOn: { backgroundColor: COLORS.ink },
    chipText: { ...TYPE.chip, color: COLORS.ink },
    chipTextOn: { color: COLORS.white },
    empty: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: 6 },
    emptyTitle: { ...TYPE.heading, color: COLORS.ink },
    emptyText: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl },
}));
