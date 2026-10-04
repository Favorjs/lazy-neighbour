import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ErrandCard } from '../../components/errand/ErrandCard';
import { COLORS, SPACING, RADIUS } from '../../constants/config';
import api from '../../services/api';

export default function ErrandsScreen() {
    const router = useRouter();
    const [errands, setErrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('lazy'); // 'lazy' or 'runner'

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

    const handleErrandPress = (errand) => {
        router.push(`/errand/${errand.id}`);
    };

    const TabSelector = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'lazy' && styles.tabActive]}
                onPress={() => setActiveTab('lazy')}
            >
                <Text style={styles.tabEmoji}>😴</Text>
                <Text style={[styles.tabText, activeTab === 'lazy' && styles.tabTextActive]}>
                    My Requests
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'runner' && styles.tabActive]}
                onPress={() => setActiveTab('runner')}
            >
                <Text style={styles.tabEmoji}>🏃</Text>
                <Text style={[styles.tabText, activeTab === 'runner' && styles.tabTextActive]}>
                    Running
                </Text>
            </TouchableOpacity>
        </View>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
                {activeTab === 'lazy' ? '📝' : '🔍'}
            </Text>
            <Text style={styles.emptyTitle}>
                {activeTab === 'lazy' ? 'No requests yet' : 'No tasks accepted'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'lazy'
                    ? 'Post an errand and get help from your neighbours!'
                    : 'Check the radar to find nearby tasks to run!'}
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push(activeTab === 'lazy' ? '/post' : '/(tabs)/radar')}
            >
                <Text style={styles.emptyButtonText}>
                    {activeTab === 'lazy' ? 'Post an Errand' : 'Find Tasks'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Errands</Text>
                <Text style={styles.subtitle}>Track your requests and tasks</Text>
            </View>

            <TabSelector />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={errands}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ErrandCard
                            errand={item}
                            onPress={handleErrandPress}
                            variant="compact"
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                    ListEmptyComponent={<EmptyState />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: '800',
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xs,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabEmoji: {
        fontSize: 18,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: SPACING.lg,
        paddingTop: 0,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    emptyButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.lg,
    },
    emptyButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
});
