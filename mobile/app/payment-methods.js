import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Button, Icon, ScreenHeader, Sheet } from '../components/ui';
import { Skeleton } from '../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, TYPE, makeStyles, useThemeVersion } from '../constants/config';
import { formatNaira } from '../utils/format';
import api from '../services/api';

export default function PaymentMethodsScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const [wallet, banks] = await Promise.all([api.getWallet(), api.getBankAccounts()]);
            setBalance(wallet.balance);
            setAccounts(banks.accounts || []);
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'We could not load your payment methods.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    const makeDefault = async (account) => {
        try {
            await api.setDefaultBankAccount(account.id);
            load();
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'Please try again.');
        }
    };

    const remove = async (account) => {
        try {
            await api.removeBankAccount(account.id);
            load();
        } catch (error) {
            Sheet.alert('Something went wrong', error.message || 'Please try again.');
        }
    };

    const manage = (account) => {
        const buttons = [];
        if (!account.isDefault) buttons.push({ text: 'Make default', onPress: () => makeDefault(account) });
        buttons.push({ text: 'Remove account', style: 'destructive', onPress: () => remove(account) });
        buttons.push({ text: 'Cancel', style: 'cancel' });

        Sheet.alert(
            account.bankName,
            `${account.accountName}\nAccount ending ${account.accountNumber.slice(-4)}`,
            buttons
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader title="Payment methods" />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.section}>Pay with</Text>

                {loading ? (
                    <Skeleton height={76} radius={RADIUS.card} />
                ) : (
                    <Pressable style={styles.method} onPress={() => router.push('/wallet')}>
                        <View style={[styles.disc, { backgroundColor: COLORS.ink }]}>
                            <Icon name="Wallet" size={22} color={COLORS.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>Lazy Neighbour wallet</Text>
                            <Text style={styles.sub}>Balance {formatNaira(balance)}</Text>
                        </View>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Default</Text>
                        </View>
                    </Pressable>
                )}

                <View style={[styles.method, { opacity: 0.6, marginTop: SPACING.sm }]}>
                    <View style={styles.disc}>
                        <Icon name="CreditCard" size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>Debit or credit card</Text>
                        <Text style={styles.sub}>Coming soon</Text>
                    </View>
                </View>

                <Text style={[styles.section, { marginTop: SPACING.xl }]}>Get paid to</Text>

                {loading ? (
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
                        <Text style={styles.emptyText}>Add one so you can withdraw what you earn from running errands.</Text>
                    </View>
                ) : (
                    accounts.map((a) => (
                        <Pressable key={a.id} style={[styles.method, { marginBottom: SPACING.sm }]} onPress={() => manage(a)}>
                            <View style={styles.disc}>
                                <Icon name="Landmark" size={22} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{a.bankName}</Text>
                                <Text style={styles.sub}>
                                    {a.accountName} · {a.accountNumber.slice(-4).padStart(10, '*')}
                                </Text>
                            </View>
                            {a.isDefault ? (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>Default</Text>
                                </View>
                            ) : (
                                <Icon name="ChevronRight" size={20} color={COLORS.grey} />
                            )}
                        </Pressable>
                    ))
                )}

                <Button
                    title="Add bank account"
                    variant="primary"
                    block
                    bubbleIcon="Plus"
                    onPress={() => router.push('/add-bank')}
                    style={{ marginTop: SPACING.lg }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    section: { ...TYPE.heading, color: COLORS.ink, marginTop: SPACING.md, marginBottom: SPACING.sm + 2 },
    method: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: COLORS.line,
        padding: SPACING.md,
    },
    disc: {
        width: 46,
        height: 46,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: { ...TYPE.cardTitle, color: COLORS.ink },
    sub: { ...TYPE.caption, color: COLORS.inkSecondary },
    tag: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 10 },
    tagText: { ...TYPE.badge, color: COLORS.ink },
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
    emptyText: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center', paddingHorizontal: SPACING.lg },
}));
