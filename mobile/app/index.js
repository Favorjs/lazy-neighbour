import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SleepingPanda } from '../components/brand/SleepingPanda';
import { COLORS, FONT, TYPE, makeStyles, useThemeVersion } from '../constants/config';
import api from '../services/api';

export default function SplashScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [riseAnim] = useState(new Animated.Value(16));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(riseAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }),
        ]).start();

        // Check auth status after a short splash
        const checkAuth = async () => {
            await new Promise((resolve) => setTimeout(resolve, 2400));

            await api.init();
            const user = await api.getStoredUser();

            router.replace(user ? '/(tabs)/feed' : '/(auth)/login');
        };

        checkAuth();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: riseAnim }], alignItems: 'center' }}>
                <SleepingPanda size={230} />
                <View style={styles.words}>
                    <Text style={styles.wordmark}>Lazy</Text>
                    <Text style={styles.wordmark}>Neighbour</Text>
                </View>
            </Animated.View>
            <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
                Let your neighbours run your errands
            </Animated.Text>
        </View>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
    words: { alignItems: 'center', marginTop: 20 },
    wordmark: { fontFamily: FONT.extrabold, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: COLORS.ink },
    tagline: { ...TYPE.bodySm, position: 'absolute', bottom: 60, color: COLORS.inkSecondary },
}));
