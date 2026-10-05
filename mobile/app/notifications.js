import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Icon, Button, ScreenHeader, Sheet } from '../components/ui';
import { BottomModal } from '../components/ui/Sheet';
import { RowListSkeleton } from '../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, TYPE, makeStyles, useThemeVersion } from '../constants/config';
import { timeAgo } from '../utils/format';
import api from '../services/api';

const TYPE_ICON = {
    ERRAND_ACCEPTED: 'Footprints',
    ERRAND_COMPLETED: 'CircleCheck',
    PAYMENT_RECEIVED: 'Wallet',
    MESSAGE: 'MessageCircle',
    WALLET: 'Wallet',
    SYSTEM: 'Bell',
};

const TINT_NAME = {
    ERRAND_ACCEPTED: 'sky',
    ERRAND_COMPLETED: 'mint',
    PAYMENT_RECEIVED: 'yellow',
    MESSAGE: 'lilac',
    WALLET: 'yellow',
    SYSTEM: 'peach',
};

// Read the colour at render time so it follows light / dark
const tintFor = (type) => COLORS.tint[TINT_NAME[type]] || COLORS.surfaceMuted;

const TYPE_LABEL = {
    ERRAND_ACCEPTED: 'Errand update',
    ERRAND_COMPLETED: 'Errand update',
    PAYMENT_RECEIVED: 'Payment',
    MESSAGE: 'Message',
    WALLET: 'Wallet',
    SYSTEM: 'Notice',
};

const fullDate = (d) =>
    new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

export default function NotificationsScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const { height } = useWindowDimensions();
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const load = async () => {
        try {
            const data = await api.getNotifications();
            setItems(data.notifications || []);
            setUnread(data.unreadCount || 0);
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'We could not load your notifications.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    const markAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setItems((list) => list.map((n) => ({ ...n, isRead: true })));
            setUnread(0);
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'Please try again.');
        }
    };

    // Tapping shows the full notification in a modal (it never navigates away on its own)
    const openDetail = (item) => {
        setSelected(item);
        setDetailOpen(true);

        if (!item.isRead) {
            setItems((list) => list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
            setUnread((c) => Math.max(0, c - 1));
            api.markNotificationRead(item.id).catch(() => {});
        }
    };

    const closeDetail = () => setDetailOpen(false);

    // Optional shortcut inside the modal, only for notifications about a specific errand
    const shortcut = selected?.errandId
        ? selected.type === 'MESSAGE'
            ? { title: 'Open chat', icon: 'MessageCircle', route: `/chat/${selected.errandId}` }
            : { title: 'View errand', icon: 'ArrowRight', route: `/errand/${selected.errandId}` }
        : null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
                title="Notifications"
                right={unread > 0 ? <Button title="Read all" variant="ghost" onPress={markAllRead} /> : null}
            />

            {loading ? (
                <RowListSkeleton count={7} />
            ) : (
                <FlatList
                extraData={themeVersion}
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                load();
                            }}
                            tintColor={COLORS.ink}
                        />
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => openDetail(item)}
                            style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.surfaceMuted }]}
                        >
                            <View style={[styles.disc, { backgroundColor: tintFor(item.type) }]}>
                                <Icon name={TYPE_ICON[item.type] || 'Bell'} size={22} color={COLORS.ink} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.title, !item.isRead && { fontFamily: TYPE.title.fontFamily }]} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    {!item.isRead ? <View style={styles.dot} /> : null}
                                </View>
                                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyDisc}>
                                <Icon name="BellRing" size={30} />
                            </View>
                            <Text style={styles.emptyTitle}>All quiet</Text>
                            <Text style={styles.emptyText}>
                                When a neighbour picks up your errand, messages you or pays you, you will see it here.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Full details */}
            <BottomModal visible={detailOpen} onClose={closeDetail} onClosed={() => setSelected(null)}>
                {selected ? (
                    <View>
                        <View style={styles.detailTop}>
                            <View style={[styles.detailDisc, { backgroundColor: tintFor(selected.type) }]}>
                                <Icon name={TYPE_ICON[selected.type] || 'Bell'} size={28} color={COLORS.ink} />
                            </View>
                            <View style={styles.typeChip}>
                                <Text style={styles.typeChipText}>{TYPE_LABEL[selected.type] || 'Notice'}</Text>
                            </View>
                        </View>

                        <Text style={styles.detailTitle}>{selected.title}</Text>
                        <Text style={styles.detailDate}>{fullDate(selected.createdAt)}</Text>

                        <ScrollView
                            style={{ maxHeight: height * 0.4 }}
                            contentContainerStyle={{ paddingVertical: SPACING.md }}
                            showsVerticalScrollIndicator
                        >
                            <Text style={styles.detailBody}>{selected.body}</Text>
                        </ScrollView>

                        <View style={styles.detailActions}>
                            {shortcut ? (
                                <Button
                                    title={shortcut.title}
                                    variant="primary"
                                    block
                                    bubbleIcon={shortcut.icon}
                                    onPress={() => {
                                        closeDetail();
                                        setTimeout(() => router.push(shortcut.route), 280);
                                    }}
                                />
                            ) : null}
                            <Text style={styles.swipeHint}>Swipe down to close</Text>
                        </View>
                    </View>
                ) : null}
            </BottomModal>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    list: { paddingHorizontal: SPACING.sm, paddingBottom: SPACING.xl, flexGrow: 1 },
    row: { flexDirection: 'row', gap: 14, padding: SPACING.md, borderRadius: RADIUS.card },
    disc: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { ...TYPE.cardTitle, color: COLORS.ink, flexShrink: 1 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.ink },
    body: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    time: { ...TYPE.caption, color: COLORS.inkSecondary, marginTop: 2 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 6 },
    emptyDisc: {
        width: 72,
        height: 72,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    emptyTitle: { ...TYPE.heading, color: COLORS.ink },
    emptyText: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center' },
    // detail modal
    detailTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
    detailDisc: {
        width: 56,
        height: 56,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeChip: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingVertical: 6, paddingHorizontal: 12 },
    typeChipText: { ...TYPE.chip, color: COLORS.ink },
    detailTitle: { ...TYPE.title, color: COLORS.ink },
    detailDate: { ...TYPE.caption, color: COLORS.inkSecondary, marginTop: 4 },
    detailBody: { ...TYPE.body, color: COLORS.ink },
    detailActions: { gap: 12, marginTop: SPACING.sm },
    swipeHint: { ...TYPE.caption, color: COLORS.grey, textAlign: 'center' },
}));
