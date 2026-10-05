import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, ScreenHeader, Sheet } from '../components/ui';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE } from '../constants/config';
import api from '../services/api';

const POPULAR_BANKS = [
    'Access Bank', 'GTBank', 'Zenith Bank', 'UBA', 'First Bank', 'Opay',
    'Kuda', 'Moniepoint', 'Palmpay', 'Fidelity Bank', 'Sterling Bank', 'Wema Bank',
];

export default function AddBankScreen() {
    const router = useRouter();
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const filled = bankName.trim() !== '' && accountNumber.length === 10 && accountName.trim() !== '';

    const validate = () => {
        const next = {};
        if (!bankName.trim()) next.bankName = 'Choose or type your bank';
        if (!/^\d{10}$/.test(accountNumber)) next.accountNumber = 'Account numbers have 10 digits';
        if (!accountName.trim()) next.accountName = 'Enter the name on the account';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const save = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await api.addBankAccount({
                bankName: bankName.trim(),
                accountNumber,
                accountName: accountName.trim(),
            });
            router.back();
        } catch (error) {
            Sheet.alert('Could not save it', error.message || 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScreenHeader title="Add bank account" />

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.label}>Pick your bank</Text>
                    <View style={styles.chips}>
                        {POPULAR_BANKS.map((b) => {
                            const on = bankName === b;
                            return (
                                <Pressable key={b} style={[styles.chip, on && styles.chipOn]} onPress={() => setBankName(b)}>
                                    <Text style={[styles.chipText, on && { color: COLORS.white }]}>{b}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Input
                        label="Bank name"
                        placeholder="Or type it here"
                        value={bankName}
                        onChangeText={setBankName}
                        autoCapitalize="words"
                        error={errors.bankName}
                        leftIcon="Landmark"
                    />
                    <Input
                        label="Account number"
                        placeholder="10 digits"
                        value={accountNumber}
                        onChangeText={(t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 10))}
                        keyboardType="numeric"
                        error={errors.accountNumber}
                        leftIcon="CreditCard"
                    />
                    <Input
                        label="Account name"
                        placeholder="As it appears on the account"
                        value={accountName}
                        onChangeText={setAccountName}
                        autoCapitalize="words"
                        error={errors.accountName}
                        leftIcon="User"
                    />

                    <Text style={styles.note}>
                        Double-check the number. Withdrawals go to exactly this account.
                    </Text>
                </ScrollView>

                <View style={styles.bottom}>
                    <Button title="Save bank account" variant="primary" block disabled={!filled} loading={loading} onPress={save} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    label: { ...TYPE.heading, color: COLORS.ink, marginBottom: SPACING.sm + 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
    chip: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.full, paddingVertical: 8, paddingHorizontal: 14 },
    chipOn: { backgroundColor: COLORS.ink },
    chipText: { ...TYPE.chip, color: COLORS.ink },
    note: { ...TYPE.caption, color: COLORS.inkSecondary },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
