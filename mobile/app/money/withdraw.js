import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE } from '../../constants/config';
import { formatNaira, CURRENCY_SYMBOL } from '../../utils/format';
import api from '../../services/api';

const MIN = 500;

// Withdraw, step 1 of 4: how much?
export default function WithdrawAmount() {
    const router = useRouter();
    const [balance, setBalance] = useState(null);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        api.getWallet().then((w) => setBalance(w.balance)).catch(() => setBalance(0));
    }, []);

    const value = parseFloat(amount) || 0;
    const error = !amount
        ? null
        : value < MIN
            ? `The smallest withdrawal is ${formatNaira(MIN)}`
            : balance !== null && value > balance
                ? 'That is more than you have in your wallet'
                : null;
    const valid = balance !== null && value >= MIN && value <= balance;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <StepHeader title="Withdraw" step={1} total={4} />

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.hero}>How much do you want to withdraw?</Text>

                    <View style={styles.row}>
                        <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
                        <Input
                            placeholder="0"
                            value={amount}
                            onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ''))}
                            keyboardType="numeric"
                            error={error}
                            style={{ flex: 1, marginBottom: 0 }}
                            inputStyle={styles.amountInput}
                        />
                    </View>

                    {balance === null ? (
                        <Skeleton width={180} height={16} style={{ marginTop: SPACING.md }} />
                    ) : (
                        <View style={styles.availableRow}>
                            <Text style={styles.available}>Available: {formatNaira(balance)}</Text>
                            {balance >= MIN ? (
                                <Pressable style={styles.chip} onPress={() => setAmount(String(balance))}>
                                    <Text style={styles.chipText}>Withdraw all</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    )}
                </ScrollView>

                <View style={styles.bottom}>
                    <Button
                        title="Continue"
                        variant="primary"
                        block
                        disabled={!valid}
                        onPress={() => router.push({ pathname: '/money/withdraw-bank', params: { amount: String(value) } })}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
    hero: { ...TYPE.hero, color: COLORS.ink, marginBottom: SPACING.lg },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    currency: { ...TYPE.amountXl, color: COLORS.ink },
    amountInput: { ...TYPE.amountXl, color: COLORS.ink, paddingVertical: 10 },
    availableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
    available: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    chip: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingVertical: 8, paddingHorizontal: 14 },
    chipText: { ...TYPE.chip, color: COLORS.ink },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
