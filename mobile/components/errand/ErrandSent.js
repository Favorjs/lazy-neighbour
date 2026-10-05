import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button, Icon } from '../ui';
import { Confetti } from '../brand/Confetti';
import { COLORS, SPACING, RADIUS, SHADOW, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import { formatNaira } from '../../utils/format';

// Shown after an errand is sent: confetti, a big tick, and what happens next
export const ErrandSent = ({ errand, total, onView, onDone }) => {
    useThemeVersion();
    const pop = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Confetti />

            <View style={styles.center}>
                <Animated.View
                    style={[
                        styles.disc,
                        { transform: [{ scale: pop }, { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) }] },
                    ]}
                >
                    <Icon name="Check" size={52} color={COLORS.white} strokeWidth={3} />
                </Animated.View>

                <Text style={styles.title}>Errand sent!</Text>
                <Text style={styles.sub}>Runners nearby can see it now. We will let you know the moment someone picks it up.</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{errand?.title}</Text>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Bounty</Text>
                        <Text style={styles.rowValue}>{formatNaira(errand?.bountyAmount)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Held from your wallet</Text>
                        <Text style={styles.rowValue}>{formatNaira(total)}</Text>
                    </View>
                    <Text style={styles.note}>Your money is held safely and only goes to your runner when you release payment.</Text>
                </View>
            </View>

            <View style={styles.bottom}>
                <Button title="View my errand" variant="primary" block onPress={onView} />
                <Button title="Back to home" block bubbleIcon="House" onPress={onDone} />
            </View>
        </SafeAreaView>
    );
};

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, gap: 8 },
    disc: {
        width: 108,
        height: 108,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    title: { ...TYPE.hero, color: COLORS.ink, textAlign: 'center' },
    sub: { ...TYPE.body, color: COLORS.inkSecondary, textAlign: 'center' },
    card: {
        alignSelf: 'stretch',
        backgroundColor: COLORS.tint.yellow,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
        gap: 8,
        marginTop: SPACING.md,
    },
    cardTitle: { ...TYPE.heading, color: COLORS.ink },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { ...TYPE.bodySm, color: COLORS.ink, opacity: 0.75 },
    rowValue: { ...TYPE.cardTitle, color: COLORS.ink },
    note: { ...TYPE.caption, color: COLORS.ink, opacity: 0.75 },
    bottom: { padding: SPACING.lg, paddingTop: SPACING.md, gap: 12, backgroundColor: COLORS.surface, ...SHADOW.sheet },
}));

export default ErrandSent;
