import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Button, Icon, ScreenHeader, Sheet } from '../components/ui';
import { WalletSkeleton } from '../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, TYPE } from '../constants/config';
import { formatNaira, timeAgo } from '../utils/format';
import api from '../services/api';

const TX_ICON = {
    TOPUP: 'ArrowDownLeft',
    EARNING: 'HandCoins',
    ESCROW_REFUND: 'ArrowDownLeft',
    ESCROW_HOLD: 'ArrowUpRight',
    WITHDRAWAL: 'Landmark',
};

export default function WalletScreen() {
    const router = useRouter();
    const [wallet, setWallet] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const [w, tx] = await Promise.all([api.getWallet(), api.getWalletTransactions()]);
            setWallet(w);
            setHistory(tx.transactions || []);
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'We could not load your wallet.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reload whenever we come back (e.g. after finishing Add money or Withdraw)
    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    const balance = wallet?.balance ?? 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader title="Wallet" />

            {loading ? (
                <WalletSkeleton />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scroll}
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
                >
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
                        <Text style={styles.balance}>{formatNaira(balance)}</Text>
                        <Text style={styles.balanceHint}>Used to pay runners. Earnings from errands land here too.</Text>

                        <View style={styles.actions}>
                            <Button title="Add money" icon="Plus" style={styles.actionBtn} onPress={() => router.push('/money/add')} />
                            <Button
                                title="Withdraw"
                                icon="Landmark"
                                style={styles.actionBtn}
                                onPress={() => router.push('/money/withdraw')}
                            />
                        </View>
                    </View>

                    <Text style={styles.section}>Activity</Text>
                    {history.length === 0 ? (
                        <View style={styles.empty}>
                            <View style={styles.emptyDisc}>
                                <Icon name="Wallet" size={28} />
                            </View>
                            <Text style={styles.emptyTitle}>No activity yet</Text>
                            <Text style={styles.emptyText}>Add money to send an errand, or run one to earn.</Text>
                        </View>
                    ) : (
                        history.map((t) => {
                            const positive = t.amount > 0;
                            return (
                                <View key={t.id} style={styles.txRow}>
                                    <View style={styles.txDisc}>
                                        <Icon name={TX_ICON[t.type] || 'Wallet'} size={20} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.txTitle} numberOfLines={1}>{t.description}</Text>
                                        <Text style={styles.txSub}>
                                            {timeAgo(t.createdAt)}
                                            {t.status === 'PENDING' ? ' · Pending' : ''}
                                        </Text>
                                    </View>
                                    <Text style={[styles.txAmount, positive && { color: COLORS.green }]}>
                                        {positive ? '+' : '-'}{formatNaira(Math.abs(t.amount))}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    balanceCard: { backgroundColor: COLORS.ink, borderRadius: RADIUS.card, padding: SPACING.lg, gap: 4 },
    balanceLabel: { ...TYPE.overline, color: COLORS.surfacePressed },
    balance: { ...TYPE.hero, color: COLORS.white },
    balanceHint: { ...TYPE.bodySm, color: COLORS.surfacePressed, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
    actionBtn: { flex: 1 },
    section: { ...TYPE.heading, color: COLORS.ink, marginTop: SPACING.xl, marginBottom: SPACING.sm },
    txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    txDisc: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txTitle: { ...TYPE.cardTitle, fontFamily: TYPE.label.fontFamily, color: COLORS.ink },
    txSub: { ...TYPE.caption, color: COLORS.inkSecondary },
    txAmount: { ...TYPE.cardTitle, color: COLORS.ink },
    empty: { alignItems: 'center', paddingVertical: SPACING.xl, gap: 6 },
    emptyDisc: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    emptyTitle: { ...TYPE.heading, color: COLORS.ink },
    emptyText: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center' },
});
