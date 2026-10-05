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
import { Button, Icon, Sheet } from '../../components/ui';
import { HomeHeaderSkeleton, ErrandListSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { COLORS, CATEGORIES, SPACING, RADIUS, TYPE } from '../../constants/config';
import api from '../../services/api';

export default function FeedScreen() {
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

            <View style={styles.hello}>
                <Text style={styles.greeting}>{firstName ? `Hi, ${firstName}` : 'Welcome'}</Text>
                <Text style={styles.hero}></Text>
                <Text style={styles.sub}>.</Text>
            </View>

            <View style={styles.ctas}>
                {sendCta}
                {runCta}
            </View>

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
                            style={[styles.chip, on && styles.chipOn]}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    hello: { paddingTop: SPACING.md, gap: 4 },
    greeting: { fontFamily: TYPE.heading.fontFamily, fontSize: 24, lineHeight: 32, color: COLORS.ink },
    hero: { ...TYPE.hero, color: COLORS.ink },
    sub: { ...TYPE.bodySm, color: COLORS.inkSecondary, marginTop: 4 },
    ctas: { gap: 12, marginTop: SPACING.lg },
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
});
