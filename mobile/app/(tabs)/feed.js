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
import { LinearGradient } from 'expo-linear-gradient';
import { ErrandCard } from '../../components/errand/ErrandCard';
import { COLORS, CATEGORIES, SPACING, RADIUS } from '../../constants/config';
import api from '../../services/api';

export default function FeedScreen() {
    const router = useRouter();
    const [errands, setErrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [user, setUser] = useState(null);

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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFeed();
    }, [selectedCategory]);

    const handleErrandPress = (errand) => {
        router.push(`/errand/${errand.id}`);
    };

    const CategoryFilter = () => (
        <View style={styles.categoryFilter}>
            <TouchableOpacity
                style={[
                    styles.filterChip,
                    !selectedCategory && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(null)}
            >
                <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>
                    All
                </Text>
            </TouchableOpacity>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
                <TouchableOpacity
                    key={key}
                    style={[
                        styles.filterChip,
                        selectedCategory === key && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategory(selectedCategory === key ? null : key)}
                >
                    <Text style={styles.filterIcon}>{cat.icon}</Text>
                    <Text
                        style={[
                            styles.filterText,
                            selectedCategory === key && { color: cat.color },
                        ]}
                    >
                        {cat.label.split(' ')[0]}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const Header = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>
                    {user?.currentRole === 'RUNNER' ? '🏃 Runner Mode' : '😴 Lazy Mode'}
                </Text>
                <Text style={styles.title}>Live Stream</Text>
                <Text style={styles.subtitle}>What's happening nearby</Text>
            </View>
            <TouchableOpacity
                style={styles.postButton}
                onPress={() => router.push('/post')}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.postButtonGradient}
                >
                    <Text style={styles.postButtonText}>+</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading feed...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            <CategoryFilter />

            <FlatList
                data={errands}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ErrandCard errand={item} onPress={handleErrandPress} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🌙</Text>
                        <Text style={styles.emptyTitle}>No errands yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Be the first to post an errand in your area!
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    greeting: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: SPACING.xs,
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
    postButton: {
        marginTop: SPACING.sm,
    },
    postButtonGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postButtonText: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: '300',
        marginTop: -2,
    },
    categoryFilter: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
        gap: SPACING.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 4,
    },
    filterChipActive: {
        backgroundColor: `${COLORS.primary}20`,
        borderColor: COLORS.primary,
    },
    filterIcon: {
        fontSize: 14,
    },
    filterText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    filterTextActive: {
        color: COLORS.primary,
    },
    listContent: {
        padding: SPACING.lg,
        paddingTop: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl * 2,
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
    },
});
