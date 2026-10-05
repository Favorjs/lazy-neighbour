import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { COLORS, RADIUS, SPACING, TYPE } from '../../constants/config';

const time = (d) =>
    d ? new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

// Steps finished for each status; the next one is the live step
const DONE_COUNT = { PENDING: 1, ACTIVE: 1, COMPLETED: 3, RELEASED: 4, DISPUTED: 2, CANCELLED: 1 };

// Full journey of one errand: done steps black, the live step a ringed disc, upcoming dashed grey.
export const StatusTimeline = ({ errand, isRequester }) => {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    const doneCount = DONE_COUNT[errand.status] ?? 1;
    const cancelled = errand.status === 'CANCELLED';
    const disputed = errand.status === 'DISPUTED';
    const runnerName = errand.runner?.name || 'Your runner';

    const steps = [
        {
            icon: 'Send',
            name: 'Errand posted',
            time: time(errand.createdAt),
            note: 'Live on the radar for your neighbours',
        },
        {
            icon: 'Footprints',
            name: errand.status === 'PENDING' ? 'Waiting for a runner' : 'Running your errand',
            time: time(errand.acceptedAt),
            note: errand.runner ? `${runnerName} picked it up` : 'A neighbour will pick it up soon',
        },
        {
            icon: 'CircleCheck',
            name: 'Errand done',
            time: time(errand.completedAt),
            note: 'Your runner sends a photo as proof',
        },
        {
            icon: 'Wallet',
            name: isRequester ? 'Release payment' : 'Get paid',
            time: time(errand.releasedAt),
            note: isRequester ? 'Happy with it? Pay your runner' : 'Paid out once the requester approves',
        },
    ];

    return (
        <View style={styles.wrap}>
            {steps.map((step, i) => {
                const done = i < doneCount;
                const isLive = !cancelled && !disputed && i === doneCount;
                const upcoming = !done && !isLive;
                const last = i === steps.length - 1;

                return (
                    <View key={step.name} style={styles.step}>
                        <View style={styles.rail}>
                            {isLive ? (
                                <Animated.View
                                    style={[
                                        styles.halo,
                                        { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                                    ]}
                                />
                            ) : null}
                            <View style={[styles.node, done && styles.nodeDone, isLive && styles.nodeLive]}>
                                <Icon
                                    name={done ? 'Check' : step.icon}
                                    size={18}
                                    color={done ? COLORS.white : isLive ? COLORS.ink : COLORS.grey}
                                />
                            </View>
                            {!last ? <View style={[styles.line, done ? styles.lineDone : styles.lineDashed]} /> : null}
                        </View>
                        <View style={styles.body}>
                            <View style={styles.row}>
                                <Text style={[styles.name, upcoming && { color: COLORS.inkSecondary }]}>{step.name}</Text>
                                {step.time && (done || isLive) ? <Text style={styles.time}>{step.time}</Text> : null}
                            </View>
                            <Text style={styles.note}>{step.note}</Text>
                        </View>
                    </View>
                );
            })}

            {disputed || cancelled ? (
                <View style={styles.alert}>
                    <Icon name={disputed ? 'CircleAlert' : 'CircleX'} size={18} color={COLORS.clay} />
                    <Text style={styles.alertText}>
                        {disputed ? 'This errand is disputed. Our team will take a look.' : 'This errand was cancelled.'}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { paddingTop: 4 },
    step: { flexDirection: 'row', gap: 14, minHeight: 64 },
    rail: { width: 40, alignItems: 'center' },
    node: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.grey,
        zIndex: 1,
    },
    nodeDone: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
    nodeLive: { borderWidth: 3, borderColor: COLORS.ink, backgroundColor: COLORS.white },
    halo: {
        position: 'absolute',
        top: -5,
        width: 50,
        height: 50,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfacePressed,
    },
    line: { flex: 1, width: 0, borderLeftWidth: 2, marginTop: 2, marginBottom: 2 },
    lineDone: { borderLeftColor: COLORS.ink },
    lineDashed: { borderLeftColor: COLORS.grey, borderStyle: 'dashed' },
    body: { flex: 1, paddingTop: 2, paddingBottom: SPACING.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    name: { ...TYPE.cardTitle, fontFamily: TYPE.heading.fontFamily, fontSize: 15, lineHeight: 22, color: COLORS.ink },
    time: { ...TYPE.caption, color: COLORS.inkSecondary },
    note: { ...TYPE.bodySm, fontSize: 13, lineHeight: 18, color: COLORS.inkSecondary, marginTop: 2 },
    alert: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.clayTint,
        borderRadius: RADIUS.tile,
        padding: SPACING.md,
        marginTop: SPACING.sm,
    },
    alertText: { ...TYPE.bodySm, color: COLORS.clay, flex: 1 },
});

export default StatusTimeline;
