import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// Party colours stay the same in light and dark mode
const COLORS_POOL = ['#FFC83D', '#5ED28E', '#9B8AFB', '#FF8A5B', '#4DA3FF', '#FF6FA8', '#2B2B2B'];

const rand = (min, max) => min + Math.random() * (max - min);

// One burst of confetti falling from the top, then it clears. Pure Animated, no extra libraries.
export const Confetti = ({ count = 48 }) => {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }).map((_, i) => ({
                key: i,
                x: rand(0, W),
                drift: rand(-70, 70),
                size: rand(7, 13),
                round: Math.random() < 0.35,
                color: COLORS_POOL[i % COLORS_POOL.length],
                delay: rand(0, 600),
                duration: rand(2200, 3800),
                spins: rand(1, 4) * (Math.random() < 0.5 ? -1 : 1),
                value: new Animated.Value(0),
            })),
        [count]
    );

    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        pieces.forEach((p) => {
            Animated.timing(p.value, {
                toValue: 1,
                duration: p.duration,
                delay: p.delay,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            }).start();
        });
    }, [pieces]);

    return (
        <View style={styles.layer} pointerEvents="none">
            {pieces.map((p) => (
                <Animated.View
                    key={p.key}
                    style={{
                        position: 'absolute',
                        top: -30,
                        left: p.x,
                        width: p.size,
                        height: p.round ? p.size : p.size * 1.7,
                        borderRadius: p.round ? p.size / 2 : 2,
                        backgroundColor: p.color,
                        opacity: p.value.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                        transform: [
                            { translateY: p.value.interpolate({ inputRange: [0, 1], outputRange: [0, H + 60] }) },
                            { translateX: p.value.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                            { rotate: p.value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spins * 360}deg`] }) },
                        ],
                    }}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    layer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
});

export default Confetti;
