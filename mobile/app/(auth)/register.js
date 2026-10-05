import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, IconButton, Sheet, KeyboardAware } from '../../components/ui';
import { COLORS, SPACING, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import api from '../../services/api';

export default function RegisterScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    // Phone is optional; every other field has to be filled
    const filled = name.trim() !== '' && email.trim() !== '' && password !== '' && confirmPassword !== '';

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'What should your neighbours call you?';
        if (!email.trim()) newErrors.email = 'Enter your email';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'That email does not look right';
        if (!password) newErrors.password = 'Choose a password';
        else if (password.length < 6) newErrors.password = 'Use at least 6 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await api.register(email.toLowerCase(), password, name, phone);
            router.replace('/(tabs)/feed');
        } catch (error) {
            Sheet.alert('Could not create your account', error.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAware lift style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Join your neighbours</Text>
                        <Text style={styles.subtitle}>Get help with errands, or earn by running them.</Text>
                    </View>

                    <Input
                        label="Full name"
                        placeholder="Tolu Adeyemi"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        error={errors.name}
                        leftIcon="User"
                    />
                    <Input
                        label="Email"
                        placeholder="you@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        error={errors.email}
                        leftIcon="Mail"
                    />
                    <Input
                        label="Phone (optional)"
                        placeholder="Your number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        leftIcon="Phone"
                    />
                    <Input
                        label="Password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        error={errors.password}
                        leftIcon="Lock"
                    />
                    <Input
                        label="Confirm password"
                        placeholder="Type it again"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        error={errors.confirmPassword}
                        leftIcon="Lock"
                    />

                    <Text style={styles.terms}>
                        By signing up you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </ScrollView>

                <View style={styles.bottom}>
                    <Button title="Create account" variant="primary" block disabled={!filled} loading={loading} onPress={handleRegister} />
                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>Already have an account?</Text>
                        <Button title="Sign in" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
                    </View>
                </View>
            </KeyboardAware>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.md },
    header: { marginTop: SPACING.lg, marginBottom: SPACING.lg, gap: 8 },
    title: { ...TYPE.title, color: COLORS.ink },
    subtitle: { ...TYPE.body, color: COLORS.inkSecondary },
    terms: { ...TYPE.caption, color: COLORS.inkSecondary, textAlign: 'center', marginTop: SPACING.sm },
    bottom: { padding: SPACING.lg, gap: SPACING.md },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    switchText: { ...TYPE.bodySm, color: COLORS.inkSecondary },
}));
