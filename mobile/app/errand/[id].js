import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Card, Badge, Avatar, Button, IconButton, Icon, Sheet } from '../../components/ui';
import { StatusTimeline } from '../../components/errand/StatusTimeline';
import { ErrandDetailSkeleton } from '../../components/ui/Skeleton';
import { COLORS, CATEGORIES, SPACING, RADIUS, SHADOW, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import { formatNaira } from '../../utils/format';
import { errandEvents } from '../../services/errandEvents';
import api from '../../services/api';

const money = formatNaira;

export default function ErrandDetailScreen() {
    const themeVersion = useThemeVersion();
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
            const [errandData, userData] = await Promise.all([api.getErrand(id), api.getMe()]);
            setErrand(errandData.errand);
            setUser(userData.user);
        } catch (error) {
            console.error('Failed to fetch errand:', error);
            Sheet.alert('Something went wrong', error.message || 'Could not load this errand');
        } finally {
            setLoading(false);
        }
    };

    const run = async (action, onDone) => {
        setActionLoading(true);
        try {
            await action();
            errandEvents.emit({ type: 'changed' });
            onDone?.();
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'Please try again');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAccept = () =>
        run(() => api.acceptErrand(id), () => {
            Sheet.alert('It is yours', 'You are now running this errand.');
            fetchData();
        });

    const handleComplete = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (result.canceled) return;

        run(() => api.completeErrand(id, result.assets[0].uri), () => {
            Sheet.alert('Nice work', 'Waiting for the requester to release your payment.');
            fetchData();
        });
    };

    const handleRelease = () =>
        Sheet.alert('Release payment', `Pay ${money(errand.bountyAmount)} to your runner?`, [
            { text: 'Not yet', style: 'cancel' },
            {
                text: 'Release payment',
                onPress: () =>
                    run(() => api.releasePayment(id), () => {
                        Sheet.alert('Paid', 'Thanks for using Lazy Neighbour.');
                        fetchData();
                    }),
            },
        ]);

    const handleCancel = () =>
        Sheet.alert('Cancel errand', 'Are you sure you want to cancel this errand?', [
            { text: 'Keep it', style: 'cancel' },
            {
                text: 'Cancel errand',
                style: 'destructive',
                // Optimistic: it disappears from every list and this page closes at once. If the server
                // refuses, the lists reload and the errand comes back with the reason shown.
                onPress: () => {
                    errandEvents.emit({ type: 'removed', id });
                    router.back();
                    api.cancelErrand(id)
                        .then(() => errandEvents.emit({ type: 'changed' }))
                        .catch((error) => {
                            errandEvents.emit({ type: 'changed' });
                            Sheet.alert('Could not cancel', error.message || 'Please try again.');
                        });
                },
            },
        ]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />
                </View>
                <ErrandDetailSkeleton />
            </SafeAreaView>
        );
    }

    if (!errand) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.muted}>We could not find that errand.</Text>
                    <Button title="Go back" onPress={() => router.back()} style={{ marginTop: SPACING.md }} />
                </View>
            </SafeAreaView>
        );
    }

    const category = CATEGORIES[errand.category] || CATEGORIES.QUICK;
    const isRequester = user?.id === errand.requesterId;
    const isRunner = user?.id === errand.runnerId;
    const canAccept = !isRequester && errand.status === 'PENDING';
    const canComplete = isRunner && errand.status === 'ACTIVE';
    const canRelease = isRequester && errand.status === 'COMPLETED';
    const canCancel = isRequester && errand.status === 'PENDING';
    const hasActions = canAccept || canComplete || canRelease || canCancel;
    const chatOpen = ['ACTIVE', 'COMPLETED'].includes(errand.status);

    const Person = ({ label, person, chat }) => (
        <View style={styles.person}>
            <Avatar
                source={person?.avatarUrl ? { uri: person.avatarUrl } : null}
                name={person?.name}
                size={44}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.overline}>{label}</Text>
                <View style={styles.personRow}>
                    <Text style={styles.personName} numberOfLines={1}>{person?.name}</Text>
                    <Icon name="Star" size={12} />
                    <Text style={styles.rating}>{Number(person?.ratingScore ?? 5).toFixed(1)}</Text>
                </View>
            </View>
            {chat ? (
                <IconButton icon="MessageCircle" label="Message" onPress={() => router.push(`/chat/${errand.id}`)} />
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />
                <Badge status={errand.status} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.chip}>
                    <Icon name={category.icon} size={14} />
                    <Text style={styles.chipText}>{category.label}</Text>
                </View>

                <Text style={styles.title}>{errand.title}</Text>
                <Text style={styles.description}>{errand.description}</Text>

                {errand.address ? (
                    <View style={styles.location}>
                        <Icon name="MapPin" size={14} color={COLORS.inkSecondary} />
                        <Text style={styles.locationText}>{errand.address}</Text>
                    </View>
                ) : null}

                <Card variant="elevated" style={styles.bounty}>
                    <Text style={styles.overline}>BOUNTY</Text>
                    <Text style={styles.amountXl}>{money(errand.bountyAmount)}</Text>
                    <Text style={styles.fee}>+ {money(errand.serviceFee)} service fee</Text>
                </Card>

                <Text style={styles.section}>How it is going</Text>
                <Card style={styles.card}>
                    <StatusTimeline errand={errand} isRequester={isRequester} />
                </Card>

                <Card style={styles.card} padding={SPACING.sm + 4}>
                    <Person label="POSTED BY" person={errand.requester} chat={!isRequester && chatOpen} />
                    {errand.runner ? (
                        <>
                            <View style={styles.divider} />
                            <Person label="RUNNER" person={errand.runner} chat={isRequester && chatOpen} />
                        </>
                    ) : null}
                </Card>

                {errand.proofPhotoUrl ? (
                    <Card style={styles.card}>
                        <Text style={styles.overline}>PROOF OF COMPLETION</Text>
                        <Image source={{ uri: errand.proofPhotoUrl }} style={styles.proof} resizeMode="cover" />
                    </Card>
                ) : null}
            </ScrollView>

            {hasActions ? (
                <View style={styles.actions}>
                    {canAccept ? (
                        <Button title="Accept errand" variant="primary" block loading={actionLoading} onPress={handleAccept} />
                    ) : null}
                    {canComplete ? (
                        <Button title="Mark as done" variant="primary" block bubbleIcon="Camera" loading={actionLoading} onPress={handleComplete} />
                    ) : null}
                    {canRelease ? (
                        <Button title="Release payment" variant="secondary" block bubbleIcon="Wallet" loading={actionLoading} onPress={handleRelease} />
                    ) : null}
                    {canCancel ? (
                        <Button title="Cancel errand" destructive block bubbleIcon="X" loading={actionLoading} onPress={handleCancel} />
                    ) : null}
                </View>
            ) : null}
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
    muted: { ...TYPE.body, color: COLORS.inkSecondary },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.full,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginTop: SPACING.sm,
        marginBottom: SPACING.md,
    },
    chipText: { ...TYPE.chip, color: COLORS.ink },
    title: { ...TYPE.title, color: COLORS.ink },
    description: { ...TYPE.body, color: COLORS.inkSecondary, marginTop: SPACING.sm },
    location: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
    locationText: { ...TYPE.bodySm, color: COLORS.inkSecondary, flex: 1 },
    bounty: { marginTop: SPACING.lg, gap: 2 },
    overline: { ...TYPE.overline, color: COLORS.inkSecondary },
    amountXl: { ...TYPE.amountXl, color: COLORS.ink },
    fee: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    section: { ...TYPE.heading, color: COLORS.ink, marginTop: SPACING.xl, marginBottom: SPACING.sm + 2 },
    card: { marginBottom: SPACING.md },
    person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    personName: { ...TYPE.cardTitle, color: COLORS.ink, flexShrink: 1 },
    rating: { ...TYPE.caption, color: COLORS.inkSecondary },
    divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 8 },
    proof: { width: '100%', height: 200, borderRadius: RADIUS.tile, marginTop: SPACING.sm },
    actions: {
        padding: SPACING.lg,
        paddingTop: SPACING.md,
        gap: SPACING.sm + 4,
        backgroundColor: COLORS.surface,
        ...SHADOW.sheet,
    },
}));
