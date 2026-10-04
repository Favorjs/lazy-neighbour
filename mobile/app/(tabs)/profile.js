import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Card, Avatar, Button } from '../../components/ui';
import { KarmaBar } from '../../components/profile/KarmaBar';
import { COLORS, SPACING, RADIUS } from '../../constants/config';
import api from '../../services/api';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRunner, setIsRunner] = useState(false);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const data = await api.getMe();
            setUser(data.user);
            setIsRunner(data.user.currentRole === 'RUNNER');
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const data = await api.toggleRole();
            setUser(data.user);
            setIsRunner(data.user.currentRole === 'RUNNER');
            Alert.alert('Mode Changed! 🎉', data.message);
        } catch (error) {
            Alert.alert('Error', 'Failed to switch mode');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await api.clearAuth();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    if (loading || !user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Avatar */}
                <LinearGradient
                    colors={[COLORS.primaryDark, COLORS.bgDark]}
                    style={styles.headerGradient}
                >
                    <Avatar
                        source={user.avatarUrl ? { uri: user.avatarUrl } : null}
                        name={user.name}
                        size={100}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingStar}>⭐</Text>
                        <Text style={styles.ratingScore}>{user.ratingScore.toFixed(1)}</Text>
                    </View>
                </LinearGradient>

                {/* Karma Progress */}
                <Card style={styles.karmaCard}>
                    <KarmaBar karmaPoints={user.karmaPoints} />
                </Card>

                {/* Role Toggle */}
                <Card style={styles.roleCard}>
                    <View style={styles.roleHeader}>
                        <View>
                            <Text style={styles.roleTitle}>
                                {isRunner ? '🏃 Runner Mode' : '😴 Lazy Mode'}
                            </Text>
                            <Text style={styles.roleSubtitle}>
                                {isRunner
                                    ? "You're earning by running errands"
                                    : "You're getting help with errands"}
                            </Text>
                        </View>
                        <Switch
                            value={isRunner}
                            onValueChange={handleRoleToggle}
                            trackColor={{ false: COLORS.bgElevated, true: COLORS.primaryLight }}
                            thumbColor={isRunner ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>
                </Card>

                {/* Stats */}
                <Card style={styles.statsCard}>
                    <Text style={styles.sectionTitle}>Statistics</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user.stats?.errandsRequested || 0}</Text>
                            <Text style={styles.statLabel}>Requested</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user.stats?.errandsCompleted || 0}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: COLORS.accent }]}>
                                ${user.totalEarnings?.toFixed(0) || 0}
                            </Text>
                            <Text style={styles.statLabel}>Earned</Text>
                        </View>
                    </View>
                </Card>

                {/* Menu Items */}
                <Card style={styles.menuCard}>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuIcon}>💳</Text>
                        <Text style={styles.menuText}>Payment Methods</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuIcon}>🔔</Text>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuIcon}>🔒</Text>
                        <Text style={styles.menuText}>Privacy & Security</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuIcon}>❓</Text>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </Card>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
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
    },
    loadingText: {
        color: COLORS.textSecondary,
    },
    headerGradient: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    avatar: {
        marginBottom: SPACING.md,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    name: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '800',
    },
    email: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: SPACING.xs,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: SPACING.xs,
    },
    ratingStar: {
        fontSize: 18,
    },
    ratingScore: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    karmaCard: {
        marginHorizontal: SPACING.lg,
        marginTop: -SPACING.lg,
    },
    roleCard: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
    },
    roleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roleTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    roleSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    statsCard: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
    },
    sectionTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.md,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '800',
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.bgElevated,
    },
    menuCard: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        padding: 0,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bgElevated,
    },
    menuIcon: {
        fontSize: 20,
        marginRight: SPACING.md,
    },
    menuText: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    menuArrow: {
        color: COLORS.textMuted,
        fontSize: 20,
    },
    logoutButton: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.error,
        alignItems: 'center',
    },
    logoutText: {
        color: COLORS.error,
        fontWeight: '600',
    },
    version: {
        color: COLORS.textMuted,
        fontSize: 12,
        textAlign: 'center',
        marginVertical: SPACING.lg,
    },
});
