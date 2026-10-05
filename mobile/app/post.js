import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Button, Input, Card, IconButton, Icon, Sheet } from '../components/ui';
import { CategoryPicker } from '../components/errand/CategoryPicker';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE, MIN_BOUNTY } from '../constants/config';
import { formatNaira, CURRENCY_SYMBOL } from '../utils/format';
import { getSavedLocation } from '../services/locationStore';
import api from '../services/api';

const FEE_PERCENT = 10;

export default function PostErrandScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('QUICK');
    const [bounty, setBounty] = useState('');
    const [address, setAddress] = useState(() => getSavedLocation()?.label || '');
    const [location, setLocation] = useState(() => {
        const saved = getSavedLocation();
        return saved ? { lat: saved.latitude, lng: saved.longitude } : null;
    });
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [walletBalance, setWalletBalance] = useState(null);

    // Refresh the balance whenever this screen is shown (e.g. coming back from adding money)
    useFocusEffect(
        useCallback(() => {
            api.getWallet()
                .then((w) => setWalletBalance(w.balance))
                .catch(() => {});
        }, [])
    );

    const getLocation = async () => {
        setGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Sheet.alert('Location is off', 'We need your location so runners can find you.');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

            const [place] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });

            if (place) {
                setAddress([place.street, place.city, place.region].filter(Boolean).join(', '));
            }
        } catch (error) {
            console.error('Location error:', error);
            Sheet.alert('Something went wrong', 'We could not get your location.');
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return Sheet.alert('One more thing', 'Tell us what you need done.');
        if (!description.trim()) return Sheet.alert('One more thing', 'Add a few details for your runner.');
        if (!bounty || parseFloat(bounty) < MIN_BOUNTY) return Sheet.alert('One more thing', `The bounty must be at least ${formatNaira(MIN_BOUNTY)}.`);
        if (!location) return Sheet.alert('One more thing', 'Set your location so runners can find you.');

        setLoading(true);
        try {
            await api.createErrand({
                title: title.trim(),
                description: description.trim(),
                category,
                bountyAmount: parseFloat(bounty),
                locationLat: location.lat,
                locationLng: location.lng,
                address,
            });

            Sheet.alert('Errand sent', 'Runners nearby can see it now.', [
                { text: 'Nice', onPress: () => router.back() },
            ]);
        } catch (error) {
            if (error.code === 'INSUFFICIENT_FUNDS') {
                Sheet.alert('Top up your wallet', error.message, [
                    { text: 'Add money', onPress: () => router.push({ pathname: '/money/add', params: { returnTo: 'post' } }) },
                    { text: 'Not now', style: 'cancel' },
                ]);
            } else {
                Sheet.alert('Something went wrong', error.message || 'We could not post your errand.');
            }
        } finally {
            setLoading(false);
        }
    };

    const amount = parseFloat(bounty) || 0;
    const filled = title.trim() !== '' && description.trim() !== '' && amount > 0 && !!location;
    const serviceFee = (amount * FEE_PERCENT) / 100;
    const total = amount + serviceFee;
    const short = walletBalance !== null && total > walletBalance;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <IconButton icon="X" label="Close" onPress={() => router.back()} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>What do you need done?</Text>

                    <Input
                        placeholder="Pick up my parcel from the depot"
                        value={title}
                        onChangeText={setTitle}
                        autoCapitalize="sentences"
                        style={{ marginTop: SPACING.md }}
                    />

                    <Input
                        label="Details"
                        placeholder="Anything your runner should know: addresses, who to ask for"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        autoCapitalize="sentences"
                    />

                    <CategoryPicker selected={category} onSelect={setCategory} />

                    <Text style={styles.label}>Where should it happen?</Text>
                    <Pressable style={styles.location} onPress={getLocation} disabled={gettingLocation}>
                        <Icon name="MapPin" size={20} />
                        <Text style={[styles.locationText, !address && { color: COLORS.grey }]} numberOfLines={1}>
                            {gettingLocation ? 'Finding you...' : address || 'Use my current location'}
                        </Text>
                        {location ? <Icon name="Check" size={20} color={COLORS.green} /> : null}
                    </Pressable>

                    <Text style={[styles.label, { marginTop: SPACING.lg }]}>Your bounty</Text>
                    <View style={styles.bountyRow}>
                        <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
                        <Input
                            placeholder="1,000"
                            value={bounty}
                            onChangeText={setBounty}
                            keyboardType="numeric"
                            style={{ flex: 1, marginBottom: 0 }}
                            inputStyle={styles.bountyText}
                        />
                    </View>
                    <Text style={styles.hint}>A fair bounty gets picked up faster.</Text>

                    {walletBalance !== null ? (
                        <Pressable style={[styles.wallet, short && styles.walletShort]} onPress={() => router.push({ pathname: '/money/add', params: { returnTo: 'post' } })}>
                            <Icon name="Wallet" size={20} color={short ? COLORS.clay : COLORS.ink} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.walletLabel}>Wallet balance</Text>
                                <Text style={[styles.walletValue, short && { color: COLORS.clay }]}>{formatNaira(walletBalance)}</Text>
                            </View>
                            <Text style={styles.walletAction}>{short ? 'Add money' : 'View'}</Text>
                        </Pressable>
                    ) : null}

                    {amount > 0 ? (
                        <Card style={styles.breakdown}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Bounty</Text>
                                <Text style={styles.rowValue}>{formatNaira(amount)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Service fee ({FEE_PERCENT}%)</Text>
                                <Text style={styles.rowValue}>{formatNaira(serviceFee)}</Text>
                            </View>
                            <View style={[styles.row, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>{formatNaira(total)}</Text>
                            </View>
                        </Card>
                    ) : null}
                </ScrollView>

                <View style={styles.bottom}>
                    <Button title="Send errand" variant="primary" block bubbleIcon="Send" disabled={!filled} loading={loading} onPress={handleSubmit} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, flexDirection: 'row' },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    title: { ...TYPE.hero, color: COLORS.ink },
    label: { ...TYPE.heading, color: COLORS.ink, marginBottom: SPACING.sm + 2 },
    location: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.tile,
        paddingVertical: 16,
        paddingHorizontal: SPACING.md,
    },
    locationText: { ...TYPE.body, color: COLORS.ink, flex: 1 },
    bountyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    currency: { ...TYPE.amountXl, color: COLORS.ink },
    bountyText: { ...TYPE.amountXl, color: COLORS.ink, paddingVertical: 10 },
    hint: { ...TYPE.caption, color: COLORS.inkSecondary, marginTop: SPACING.xs },
    wallet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.tile,
        padding: SPACING.md,
        marginTop: SPACING.lg,
    },
    walletShort: { backgroundColor: COLORS.clayTint },
    walletLabel: { ...TYPE.caption, color: COLORS.inkSecondary },
    walletValue: { ...TYPE.cardTitle, color: COLORS.ink },
    walletAction: { ...TYPE.chip, color: COLORS.ink, textDecorationLine: 'underline' },
    breakdown: { marginTop: SPACING.lg, gap: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    rowLabel: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    rowValue: { ...TYPE.bodySm, color: COLORS.ink },
    totalRow: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10, marginTop: 2 },
    totalLabel: { ...TYPE.cardTitle, color: COLORS.ink },
    totalValue: { ...TYPE.amount, color: COLORS.ink },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
