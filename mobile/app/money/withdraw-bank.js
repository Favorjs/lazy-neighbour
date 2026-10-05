import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Button, Icon } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE } from '../../constants/config';
import { formatNaira } from '../../utils/format';
import api from '../../services/api';

// Withdraw, step 2 of 4: where should it go?
export default function WithdrawBank() {
    const router = useRouter();
    const { amount } = useLocalSearchParams();
    const [accounts, setAccounts] = useState(null);
    const [bankId, setBankId] = useState(null);

    // Reload when coming back from adding a bank account
    useFocusEffect(
        useCallback(() => {
            api.getBankAccounts()
                .then((d) => {
                    setAccounts(d.accounts || []);
                    setBankId((cur) => cur || d.accounts?.find((a) => a.isDefault)?.id || d.accounts?.[0]?.id || null);
                })
                .catch(() => setAccounts([]));
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            <StepHeader title="Withdraw" step={2} total={4} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.hero}>Where should we send {formatNaira(amount)}?</Text>

                {accounts === null ? (
                    <View style={{ gap: SPACING.sm }}>
                        <Skeleton height={76} radius={RADIUS.card} />
                        <Skeleton height={76} radius={RADIUS.card} />
                    </View>
                ) : accounts.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyDisc}>
                            <Icon name="Landmark" size={28} />
                        </View>
                        <Text style={styles.emptyTitle}>No bank account yet</Text>
                        <Text style={styles.emptyText}>Add the account you want your money sent to.</Text>
                    </View>
                ) : (
                    accounts.map((b) => {
                        const on = b.id === bankId;
                        return (
                            <Pressable key={b.id} style={[styles.bank, on && styles.bankOn]} onPress={() => setBankId(b.id)}>
                                <Icon name="Landmark" size={22} color={on ? COLORS.white : COLORS.ink} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.bankName, on && { color: COLORS.white }]}>{b.bankName}</Text>
                                    <Text style={[styles.bankSub, on && { color: COLORS.surfacePressed }]}>
                                        {b.accountName} · {b.accountNumber.slice(-4).padStart(10, '*')}
                                    </Text>
                                </View>
                                {on ? <Icon name="Check" size={20} color={COLORS.white} /> : null}
                            </Pressable>
                        );
                    })
                )}

                <Button
                    title="Add a bank account"
                    icon="Plus"
                    onPress={() => router.push('/add-bank')}
                    style={{ marginTop: SPACING.md }}
                />
            </ScrollView>

            <View style={styles.bottom}>
                <Button
                    title="Continue"
                    variant="primary"
                    block
                    disabled={!bankId}
                    onPress={() => router.push({ pathname: '/money/withdraw-review', params: { amount, bankId } })}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.sm },
    hero: { ...TYPE.hero, fontSize: 30, lineHeight: 38, color: COLORS.ink, marginBottom: SPACING.md },
    bank: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
    },
    bankOn: { backgroundColor: COLORS.ink },
    bankName: { ...TYPE.cardTitle, color: COLORS.ink },
    bankSub: { ...TYPE.caption, color: COLORS.inkSecondary },
    empty: { alignItems: 'center', paddingVertical: SPACING.lg, gap: 6 },
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
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
