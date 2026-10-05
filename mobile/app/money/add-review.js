import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Sheet } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import { formatNaira } from '../../utils/format';
import { newIdempotencyKey } from '../../utils/singleFlight';
import api from '../../services/api';

// Add money, step 2 of 3: check it and confirm
export default function AddMoneyReview() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const { amount, returnTo } = useLocalSearchParams();
    const value = parseFloat(amount) || 0;
    const [balance, setBalance] = useState(null);
    const [testMode, setTestMode] = useState(true);
    const [working, setWorking] = useState(false);
    const attemptKey = useRef(newIdempotencyKey()).current;

    useEffect(() => {
        api.getWallet()
            .then((w) => {
                setBalance(w.balance);
                setTestMode(w.topupMode === 'test');
            })
            .catch(() => setBalance(0));
    }, []);

    const confirm = async () => {
        setWorking(true);
        try {
            const res = await api.topUpWallet(value, attemptKey);
            router.replace({
                pathname: '/money/add-done',
                params: { amount: String(value), balance: String(res.balance), returnTo },
            });
        } catch (error) {
            Sheet.alert('Could not add money', error.message || 'Please try again.');
        } finally {
            setWorking(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StepHeader title="Add money" step={2} total={3} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.hero}>Check and confirm</Text>

                <Card style={styles.card}>
                    <Row label="You are adding" value={formatNaira(value)} strong />
                    <Row label="Into" value="Lazy Neighbour wallet" />
                    <Row label="Fee" value={formatNaira(0)} />
                    <View style={styles.divider} />
                    {balance === null ? (
                        <Skeleton height={24} />
                    ) : (
                        <>
                            <Row label="Balance now" value={formatNaira(balance)} />
                            <Row label="Balance after" value={formatNaira(balance + value)} strong />
                        </>
                    )}
                </Card>

                {testMode ? (
                    <View style={styles.note}>
                        <Text style={styles.noteText}>
                            Test mode: this adds practice money straight away. Real card payments are coming soon.
                        </Text>
                    </View>
                ) : null}
            </ScrollView>

            <View style={styles.bottom}>
                <Button title={`Add ${formatNaira(value)}`} variant="primary" block bubbleIcon="Check" loading={working} onPress={confirm} />
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

const styles = makeStyles(() => ({
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
}));
