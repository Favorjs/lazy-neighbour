import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Input } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE } from '../../constants/config';
import { formatNaira, CURRENCY_SYMBOL } from '../../utils/format';

const QUICK = [1000, 2000, 5000, 10000];
const MIN = 100;
const MAX = 1000000;

// Add money, step 1 of 3: how much?
export default function AddMoneyAmount() {
    const router = useRouter();
    const { returnTo } = useLocalSearchParams();
    const [amount, setAmount] = useState('');

    const value = parseFloat(amount) || 0;
    const error = amount && (value < MIN || value > MAX) ? `Enter between ${formatNaira(MIN)} and ${formatNaira(MAX)}` : null;
    const valid = value >= MIN && value <= MAX;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <StepHeader title="Add money" step={1} total={3} />

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.hero}>How much do you want to add?</Text>

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

                    <View style={styles.chips}>
                        {QUICK.map((q) => (
                            <Pressable key={q} style={styles.chip} onPress={() => setAmount(String(q))}>
                                <Text style={styles.chipText}>{formatNaira(q)}</Text>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.bottom}>
                    <Button
                        title="Continue"
                        variant="primary"
                        block
                        disabled={!valid}
                        onPress={() => router.push({ pathname: '/money/add-review', params: { amount: String(value), returnTo } })}
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
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.lg },
    chip: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingVertical: 10, paddingHorizontal: 16 },
    chipText: { ...TYPE.chip, color: COLORS.ink },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
