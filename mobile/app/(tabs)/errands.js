import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ErrandCard } from '../../components/errand/ErrandCard';
import { Button, Icon } from '../../components/ui';
import { ErrandListSkeleton } from '../../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, TYPE } from '../../constants/config';
import api from '../../services/api';

const TABS = [
    { key: 'lazy', label: 'Sent', icon: 'Send' },
    { key: 'runner', label: 'Running', icon: 'Footprints' },
];

export default function ErrandsScreen() {
    const router = useRouter();
    const [errands, setErrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('lazy');
    const [me, setMe] = useState(null);

    useEffect(() => {
        api.getStoredUser().then(setMe).catch(() => {});
    }, []);

    const fetchErrands = async () => {
        try {
            const data = await api.getMyErrands(activeTab);
            setErrands(data.errands || []);
        } catch (error) {
            console.error('Failed to fetch errands:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchErrands();
    }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchErrands();
    }, [activeTab]);

    const sent = activeTab === 'lazy';

    const EmptyState = () => (
        <View style={styles.empty}>
            <View style={styles.emptyDisc}>
                <Icon name={sent ? 'Send' : 'Footprints'} size={28} />
            </View>
            <Text style={styles.emptyTitle}>{sent ? 'Nothing sent yet' : 'No errands running'}</Text>
            <Text style={styles.emptyText}>
                {sent
                    ? 'Got something you would rather not do? Your neighbours will.'
                    : 'Errands you pick up will show up here, step by step.'}
            </Text>
        </View>
    );

    // Big, obvious call to action at the top of whichever tab you are on
    const StartCta = (
        <View style={styles.cta}>
            <View style={styles.ctaCopy}>
                <Text style={styles.ctaTitle}>{sent ? 'Need a hand?' : 'Ready to earn?'}</Text>
                <Text style={styles.ctaText}>
                    {sent
                        ? 'Post an errand and a neighbour will pick it up.'
                        : 'See errands near you and pick one up.'}
                </Text>
            </View>
            <Button
                title={sent ? 'Send an errand' : 'Start running'}
                variant="primary"
                block
                bubbleIcon={sent ? 'Plus' : 'Footprints'}
                onPress={() => router.push(sent ? '/post' : '/(tabs)/radar')}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My errands</Text>
            </View>

            <View style={styles.tabs}>
                {TABS.map((tab) => {
                    const on = activeTab === tab.key;
                    return (
                        <Pressable
                            key={tab.key}
                            style={[styles.tab, on && styles.tabOn]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Icon name={tab.icon} size={18} color={on ? COLORS.white : COLORS.ink} />
                            <Text style={[styles.tabText, on && { color: COLORS.white }]}>{tab.label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {loading ? (
                <View style={styles.list}>
                    {StartCta}
                    <ErrandListSkeleton count={3} variant="tracking" />
                </View>
            ) : (
                <FlatList
                    data={errands}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ErrandCard
                            errand={item}
                            onPress={(e) => router.push(`/errand/${e.id}`)}
                            onChat={(e) => router.push(`/chat/${e.id}`)}
                            currentUserId={me?.id}
                            variant="tracking"
                        />
                    )}
                    ListHeaderComponent={StartCta}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ink} />}
                    ListEmptyComponent={<EmptyState />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
    title: { ...TYPE.title, color: COLORS.ink },
    tabs: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
    },
    tabOn: { backgroundColor: COLORS.ink },
    tabText: { ...TYPE.button, fontSize: 14, color: COLORS.ink },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cta: {
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    ctaCopy: { gap: 2, paddingHorizontal: 4, paddingTop: 4 },
    ctaTitle: { ...TYPE.title, color: COLORS.ink },
    ctaText: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, flexGrow: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl, gap: 6 },
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
    emptyText: {
        ...TYPE.bodySm,
        color: COLORS.inkSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
    },
});
