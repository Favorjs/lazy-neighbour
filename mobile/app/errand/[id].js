import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Card, Badge, Avatar, Button } from '../../components/ui';
import { COLORS, CATEGORIES, SPACING, RADIUS } from '../../constants/config';
import api from '../../services/api';

export default function ErrandDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [errand, setErrand] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [errandData, userData] = await Promise.all([
                api.getErrand(id),
                api.getMe(),
            ]);
            setErrand(errandData.errand);
            setUser(userData.user);
        } catch (error) {
            console.error('Failed to fetch errand:', error);
            Alert.alert('Error', 'Failed to load errand details');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        setActionLoading(true);
        try {
            await api.acceptErrand(id);
            Alert.alert('Accepted! 🎉', 'You are now running this errand.');
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to accept errand');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        // Optionally pick a proof photo
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (result.canceled) return;

        setActionLoading(true);
        try {
            // In a real app, upload the image first and get URL
            const proofUrl = result.assets[0].uri;
            await api.completeErrand(id, proofUrl);
            Alert.alert('Completed! ✅', 'Waiting for the requester to release payment.');
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to complete errand');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRelease = async () => {
        Alert.alert(
            'Release Payment',
            `Are you sure you want to release $${errand.bountyAmount} to the runner?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Release',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await api.releasePayment(id);
                            Alert.alert('Payment Released! 💰', 'Thank you for using Lazy Neighbour!');
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to release payment');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleCancel = async () => {
        Alert.alert(
            'Cancel Errand',
            'Are you sure you want to cancel this errand?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await api.cancelErrand(id);
                            Alert.alert('Cancelled', 'Your errand has been cancelled.');
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to cancel errand');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!errand) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Errand not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const category = CATEGORIES[errand.category] || {};
    const isRequester = user?.id === errand.requesterId;
    const isRunner = user?.id === errand.runnerId;
    const canAccept = !isRequester && errand.status === 'PENDING';
    const canComplete = isRunner && errand.status === 'ACTIVE';
    const canRelease = isRequester && errand.status === 'COMPLETED';
    const canCancel = isRequester && errand.status === 'PENDING';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Badge status={errand.status} />
                </View>

                {/* Category & Title */}
                <View style={[styles.categoryTag, { backgroundColor: `${category.color}20` }]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[styles.categoryLabel, { color: category.color }]}>
                        {category.label}
                    </Text>
                </View>

                <Text style={styles.title}>{errand.title}</Text>
                <Text style={styles.description}>{errand.description}</Text>

                {/* Location */}
                {errand.address && (
                    <View style={styles.locationRow}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.locationText}>{errand.address}</Text>
                    </View>
                )}

                {/* Bounty Card */}
                <Card variant="elevated" style={styles.bountyCard}>
                    <View style={styles.bountyRow}>
                        <Text style={styles.bountyLabel}>Bounty</Text>
                        <Text style={styles.bountyAmount}>${errand.bountyAmount}</Text>
                    </View>
                    <View style={styles.bountyRow}>
                        <Text style={styles.feeLabel}>+ Service Fee</Text>
                        <Text style={styles.feeAmount}>${errand.serviceFee.toFixed(2)}</Text>
                    </View>
                </Card>

                {/* Requester Info */}
                <Card style={styles.userCard}>
                    <Text style={styles.userCardTitle}>Posted by</Text>
                    <View style={styles.userRow}>
                        <Avatar
                            source={errand.requester?.avatarUrl ? { uri: errand.requester.avatarUrl } : null}
                            name={errand.requester?.name}
                            size={48}
                        />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{errand.requester?.name}</Text>
                            <View style={styles.ratingRow}>
                                <Text>⭐</Text>
                                <Text style={styles.ratingText}>
                                    {errand.requester?.ratingScore?.toFixed(1) || '5.0'}
                                </Text>
                            </View>
                        </View>
                        {!isRequester && errand.status !== 'PENDING' && (
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => router.push(`/chat/${errand.id}`)}
                            >
                                <Text>💬</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Card>

                {/* Runner Info (if assigned) */}
                {errand.runner && (
                    <Card style={styles.userCard}>
                        <Text style={styles.userCardTitle}>Runner</Text>
                        <View style={styles.userRow}>
                            <Avatar
                                source={errand.runner?.avatarUrl ? { uri: errand.runner.avatarUrl } : null}
                                name={errand.runner?.name}
                                size={48}
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{errand.runner?.name}</Text>
                                <View style={styles.ratingRow}>
                                    <Text>⭐</Text>
                                    <Text style={styles.ratingText}>
                                        {errand.runner?.ratingScore?.toFixed(1) || '5.0'}
                                    </Text>
                                </View>
                            </View>
                            {isRequester && (
                                <TouchableOpacity
                                    style={styles.chatButton}
                                    onPress={() => router.push(`/chat/${errand.id}`)}
                                >
                                    <Text>💬</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Card>
                )}

                {/* Proof Photo */}
                {errand.proofPhotoUrl && (
                    <Card style={styles.proofCard}>
                        <Text style={styles.userCardTitle}>Proof of Completion</Text>
                        <Image
                            source={{ uri: errand.proofPhotoUrl }}
                            style={styles.proofImage}
                            resizeMode="cover"
                        />
                    </Card>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {canAccept && (
                        <Button
                            title="Accept This Errand 🏃"
                            onPress={handleAccept}
                            loading={actionLoading}
                            size="lg"
                        />
                    )}

                    {canComplete && (
                        <Button
                            title="Mark as Complete ✅"
                            onPress={handleComplete}
                            loading={actionLoading}
                            size="lg"
                            variant="secondary"
                        />
                    )}

                    {canRelease && (
                        <Button
                            title="Release Payment 💰"
                            onPress={handleRelease}
                            loading={actionLoading}
                            size="lg"
                        />
                    )}

                    {canCancel && (
                        <Button
                            title="Cancel Errand"
                            onPress={handleCancel}
                            loading={actionLoading}
                            variant="outline"
                            style={styles.cancelButton}
                        />
                    )}
                </View>
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
    errorText: {
        color: COLORS.textSecondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    backButton: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: '300',
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.full,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        gap: SPACING.xs,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: '800',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: 16,
        lineHeight: 24,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        gap: SPACING.xs,
    },
    locationIcon: {
        fontSize: 16,
    },
    locationText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    bountyCard: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    bountyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    bountyLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    bountyAmount: {
        color: COLORS.accent,
        fontSize: 32,
        fontWeight: '800',
    },
    feeLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    feeAmount: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    userCard: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    userCardTitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    chatButton: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.primary,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    proofCard: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    proofImage: {
        width: '100%',
        height: 200,
        borderRadius: RADIUS.md,
    },
    actions: {
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    cancelButton: {
        borderColor: COLORS.error,
    },
});
