import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/config';
import api from '../services/api';

export default function SplashScreen() {
    const router = useRouter();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));

    useEffect(() => {
        // Animate logo
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Check auth status after animation
        const checkAuth = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Min splash duration

            await api.init();
            const user = await api.getStoredUser();

            if (user) {
                router.replace('/(tabs)/feed');
            } else {
                router.replace('/(auth)/login');
            }
        };

        checkAuth();
    }, []);

    return (
        <LinearGradient
            colors={[COLORS.bgDark, '#1a1040', COLORS.primaryDark]}
            style={styles.container}
        >
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Text style={styles.emoji}>😴</Text>
                <Text style={styles.title}>Lazy</Text>
                <Text style={styles.subtitle}>Neighbour</Text>
            </Animated.View>

            <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
                Let your neighbours run your errands
            </Animated.Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.white,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 32,
        fontWeight: '300',
        color: COLORS.primaryLight,
        marginTop: -8,
    },
    tagline: {
        position: 'absolute',
        bottom: 60,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
});
