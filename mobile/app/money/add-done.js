import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Icon } from '../../components/ui';
import { StepHeader } from '../../components/ui/StepHeader';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE } from '../../constants/config';
import { formatNaira } from '../../utils/format';

// Add money, step 3 of 3: done
export default function AddMoneyDone() {
    const router = useRouter();
    const { amount, balance, returnTo } = useLocalSearchParams();

    const finish = () => router.dismissTo(returnTo === 'post' ? '/post' : '/wallet');

    return (
        <SafeAreaView style={styles.container}>
            <StepHeader title="Add money" step={3} total={3} />

            <View style={styles.center}>
                <View style={styles.disc}>
                    <Icon name="Check" size={44} color={COLORS.white} strokeWidth={3} />
                </View>
                <Text style={styles.title}>{formatNaira(amount)} added</Text>
                <Text style={styles.sub}>Your wallet now has</Text>
                <Text style={styles.balance}>{formatNaira(balance)}</Text>
            </View>

            <View style={styles.bottom}>
                <Button
                    title={returnTo === 'post' ? 'Back to my errand' : 'Done'}
                    variant="primary"
                    block
                    onPress={finish}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    title: { ...TYPE.title, color: COLORS.ink },
    sub: { ...TYPE.bodySm, color: COLORS.inkSecondary, marginTop: SPACING.sm },
    balance: { ...TYPE.amountXl, color: COLORS.ink },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.surface, ...SHADOW.sheet },
});
