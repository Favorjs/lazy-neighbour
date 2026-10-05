import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, Sheet } from '../../components/ui';
import { COLORS, SPACING, TYPE, FONT } from '../../constants/config';
import api from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const filled = email.trim() !== '' && password !== '';

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Enter your email';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'That email does not look right';
        if (!password) newErrors.password = 'Enter your password';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await api.login(email.toLowerCase(), password);
            router.replace('/(tabs)/feed');
        } catch (error) {
            Sheet.alert('Could not sign in', error.message || 'Please check your details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.brand}>Lazy Neighbour</Text>

                    <View style={styles.header}>
                        <Text style={styles.hero}>Welcome back</Text>
                        <Text style={styles.subtitle}>Sign in to send errands or run them for a bounty.</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="you@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            leftIcon="Mail"
                        />

                        <Input
                            label="Password"
                            placeholder="Your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            error={errors.password}
                            leftIcon="Lock"
                        />

                        <Button title="Forgot password?" variant="ghost" onPress={() => {}} />
                    </View>
                </ScrollView>

                <View style={styles.bottom}>
                    <Button title="Sign in" variant="primary" block disabled={!filled} loading={loading} onPress={handleLogin} />
                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>New to the street?</Text>
                        <Button title="Create an account" variant="ghost" onPress={() => router.push('/(auth)/register')} />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scrollContent: { flexGrow: 1, padding: SPACING.lg, paddingTop: SPACING.xl },
    brand: { fontFamily: FONT.bold, fontSize: 18, color: COLORS.ink },
    header: { marginTop: SPACING.xxl, marginBottom: SPACING.xl, gap: 8 },
    hero: { ...TYPE.hero, color: COLORS.ink },
    subtitle: { ...TYPE.body, color: COLORS.inkSecondary },
    form: { gap: 4 },
    bottom: { padding: SPACING.lg, gap: SPACING.md },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    switchText: { ...TYPE.bodySm, color: COLORS.inkSecondary },
});
