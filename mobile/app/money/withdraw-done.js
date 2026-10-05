import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Icon } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import { formatNaira } from '../../utils/format';

// Withdraw, step 4 of 4: requested
export default function WithdrawDone() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const { amount, balance, bank } = useLocalSearchParams();

    return (
        <SafeAreaView style={styles.container}>
            <StepHeader title="Withdraw" step={4} total={4} />

            <View style={styles.center}>
                <View style={styles.disc}>
                    <Icon name="Check" size={44} color={COLORS.white} strokeWidth={3} />
                </View>
                <Text style={styles.title}>Withdrawal requested</Text>
                <Text style={styles.sub}>
                    {formatNaira(amount)} is on its way{bank ? ` to ${bank}` : ''}. It shows as pending until it is paid out.
                </Text>
                <Text style={[styles.sub, { marginTop: SPACING.md }]}>Wallet balance</Text>
                <Text style={styles.balance}>{formatNaira(balance)}</Text>
            </View>

            <View style={styles.bottom}>
                <Button title="Done" variant="primary" block onPress={() => router.dismissTo('/wallet')} />
            </View>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 6 },
    disc: {
        width: 96,
        height: 96,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    title: { ...TYPE.title, color: COLORS.ink, textAlign: 'center' },
    sub: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center' },
    balance: { ...TYPE.amountXl, color: COLORS.ink },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
}));
