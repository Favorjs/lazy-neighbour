import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Sheet } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE } from '../../constants/config';
import { formatNaira } from '../../utils/format';
import api from '../../services/api';

// Withdraw, step 3 of 4: check it and confirm
export default function WithdrawReview() {
    const router = useRouter();
    const { amount, bankId } = useLocalSearchParams();
    const value = parseFloat(amount) || 0;
    const [bank, setBank] = useState(null);
    const [balance, setBalance] = useState(null);
    const [working, setWorking] = useState(false);

    useEffect(() => {
        Promise.all([api.getBankAccounts(), api.getWallet()])
            .then(([b, w]) => {
                setBank(b.accounts.find((a) => a.id === bankId) || null);
                setBalance(w.balance);
            })
            .catch(() => {});
    }, [bankId]);

    const confirm = async () => {
        setWorking(true);
        try {
            const res = await api.withdrawFromWallet(value, bankId);
            router.replace({
                pathname: '/money/withdraw-done',
                params: { amount: String(value), balance: String(res.balance), bank: bank?.bankName || '' },
            });
        } catch (error) {
            Sheet.alert('Could not withdraw', error.message || 'Please try again.');
        } finally {
            setWorking(false);
        }
    };

    const loading = !bank || balance === null;

    return (
        <SafeAreaView style={styles.container}>
            <StepHeader title="Withdraw" step={3} total={4} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.hero}>Check and confirm</Text>

                <Card style={styles.card}>
                    <Row label="You are withdrawing" value={formatNaira(value)} strong />
                    {loading ? (
                        <Skeleton height={44} />
                    ) : (
                        <>
                            <Row label="To" value={bank.bankName} />
                            <Row label="Account" value={`${bank.accountName} · ${bank.accountNumber.slice(-4).padStart(10, '*')}`} />
                        </>
                    )}
                    <Row label="Fee" value={formatNaira(0)} />
                    <View style={styles.divider} />
                    {balance !== null ? <Row label="Balance after" value={formatNaira(balance - value)} strong /> : <Skeleton height={24} />}
                </Card>

                <View style={styles.note}>
                    <Text style={styles.noteText}>
                        Withdrawals show as pending in your activity until they are paid out. Check the account details are right: we send it to exactly this account.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.bottom}>
                <Button
                    title={`Withdraw ${formatNaira(value)}`}
                    variant="primary"
                    block
                    bubbleIcon="Check"
                    disabled={loading}
                    loading={working}
                    onPress={confirm}
                />
            </View>
        </SafeAreaView>
    );
}

const Row = ({ label, value, strong }) => (
    <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
    hero: { ...TYPE.hero, color: COLORS.ink, marginBottom: SPACING.lg },
    card: { gap: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    rowLabel: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    rowValue: { ...TYPE.cardTitle, fontFamily: TYPE.label.fontFamily, color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
    rowStrong: { ...TYPE.amount, fontSize: 18 },
    divider: { height: 1, backgroundColor: COLORS.line },
    note: { marginTop: SPACING.md, backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.tile, padding: SPACING.md },
    noteText: { ...TYPE.caption, color: COLORS.inkSecondary },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
