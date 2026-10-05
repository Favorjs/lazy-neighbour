import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { COLORS, FONT, makeStyles } from '../../constants/config';

// A panda is black and white in either appearance
const PANDA = { white: '#FFFFFF', ink: '#000000', charcoal: '#333333', cheek: '#E8E8E8' };

// The Lazy Neighbour mascot: a panda fast asleep. Flat, geometric, black / white / grey.
// The head breathes slowly and little "z"s drift up and fade.
const ZEDS = [
    { char: 'z', size: 22, x: 0, delay: 0 },
    { char: 'z', size: 30, x: 14, delay: 700 },
    { char: 'Z', size: 38, x: 30, delay: 1400 },
];

const Zed = ({ char, size, x, delay, travel = 46, top = 40 }) => {
    const t = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(t, { toValue: 1, duration: 2100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
                Animated.delay(Math.max(0, 2100 - delay)),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [t, delay]);

    return (
        <Animated.Text
            style={[
                styles.zed,
                {
                    fontSize: size,
                    top,
                    left: x,
                    opacity: t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 0.9, 0] }),
                    transform: [
                        { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] }) },
                        { rotate: '-10deg' },
                    ],
                },
            ]}
        >
            {char}
        </Animated.Text>
    );
};

export const SleepingPanda = ({ size = 220, compact = false }) => {
    const breathe = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [breathe]);

    return (
        <View style={{ width: size, height: size }}>
            <Animated.View
                style={{
                    transform: [
                        { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
                        { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
                    ],
                }}
            >
                <Svg width={size} height={size} viewBox="0 0 200 200">
                    {/* soft backdrop */}
                    <Circle cx="100" cy="108" r="92" fill={COLORS.surfaceMuted} />

                    {/* shoulders */}
                    <Path d="M26 186 C26 150 58 138 100 138 C142 138 174 150 174 186 Z" fill={PANDA.ink} />
                    <Path d="M70 142 Q100 156 130 142" stroke={PANDA.charcoal} strokeWidth="4" strokeLinecap="round" fill="none" />

                    {/* head, tilted as it dozes */}
                    <G rotation="-7" origin="100, 100">
                        {/* ears */}
                        <Circle cx="46" cy="60" r="21" fill={PANDA.ink} />
                        <Circle cx="154" cy="60" r="21" fill={PANDA.ink} />
                        <Circle cx="46" cy="60" r="9" fill={PANDA.charcoal} />
                        <Circle cx="154" cy="60" r="9" fill={PANDA.charcoal} />

                        {/* face */}
                        <Ellipse cx="100" cy="98" rx="62" ry="56" fill={PANDA.white} stroke={PANDA.ink} strokeWidth="4" />

                        {/* eye patches */}
                        <Ellipse cx="72" cy="98" rx="16" ry="21" fill={PANDA.ink} rotation="22" origin="72, 98" />
                        <Ellipse cx="128" cy="98" rx="16" ry="21" fill={PANDA.ink} rotation="-22" origin="128, 98" />

                        {/* closed eyes */}
                        <Path d="M62 100 Q72 110 82 100" stroke={PANDA.white} strokeWidth="4" strokeLinecap="round" fill="none" />
                        <Path d="M118 100 Q128 110 138 100" stroke={PANDA.white} strokeWidth="4" strokeLinecap="round" fill="none" />

                        {/* cheeks */}
                        <Circle cx="56" cy="127" r="7" fill={PANDA.cheek} />
                        <Circle cx="144" cy="127" r="7" fill={PANDA.cheek} />

                        {/* nose and a sleepy smile */}
                        <Ellipse cx="100" cy="118" rx="10" ry="7" fill={PANDA.ink} />
                        <Path d="M91 129 Q100 136 109 129" stroke={PANDA.ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    </G>
                </Svg>
            </Animated.View>

            {/* drifting z's */}
            <View style={[styles.zone, compact && styles.zoneCompact]} pointerEvents="none">
                {compact ? (
                    <Zed char="z" size={11} x={0} delay={0} travel={10} top={10} />
                ) : (
                    ZEDS.map((z) => <Zed key={z.delay} {...z} />)
                )}
            </View>
        </View>
    );
};

const styles = makeStyles(() => ({
    zone: { position: 'absolute', top: 6, right: 6, width: 80, height: 100 },
    zoneCompact: { top: -4, right: -10, width: 20, height: 26 },
    zed: {
        position: 'absolute',
        fontFamily: FONT.extrabold,
        color: COLORS.ink,
    },
}));

export default SleepingPanda;

// Loading indicator for buttons: the panda, small, fast asleep
export const PandaSpinner = ({ size = 34 }) => <SleepingPanda size={size} compact />;
