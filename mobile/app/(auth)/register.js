import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Button, Input } from '../../components/ui';
import { COLORS, SPACING } from '../../constants/config';
import api from '../../services/api';

export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('test@example.com');
    const [phone, setPhone] = useState('08012345678');
    const [password, setPassword] = useState('password123');
    const [confirmPassword, setConfirmPassword] = useState('password123');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await api.register(email.toLowerCase(), password, name, phone);
            Alert.alert('Welcome! 🎉', 'Your account has been created successfully');
            router.replace('/(tabs)/feed');
        } catch (error) {
            Alert.alert('Registration Failed', error.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>🚀</Text>
                        <Text style={styles.title}>Join Us!</Text>
                        <Text style={styles.subtitle}>
                            Create an account to start helping your neighbours
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            error={errors.name}
                            leftIcon={<Text>👤</Text>}
                        />

                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            leftIcon={<Text>📧</Text>}
                        />

                        <Input
                            label="Phone (Optional)"
                            placeholder="+1 234 567 8900"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            leftIcon={<Text>📱</Text>}
                        />

                        <Input
                            label="Password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            error={errors.password}
                            leftIcon={<Text>🔒</Text>}
                        />

                        <Input
                            label="Confirm Password"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            error={errors.confirmPassword}
                            leftIcon={<Text>🔒</Text>}
                        />

                        <Button
                            title="Create Account"
                            onPress={handleRegister}
                            loading={loading}
                            size="lg"
                            style={styles.button}
                        />
                    </View>

                    {/* Terms */}
                    <Text style={styles.terms}>
                        By signing up, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.lg,
    },
    emoji: {
        fontSize: 64,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    form: {
        marginBottom: SPACING.lg,
    },
    button: {
        marginTop: SPACING.md,
    },
    terms: {
        color: COLORS.textMuted,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        lineHeight: 18,
    },
    termsLink: {
        color: COLORS.primary,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: SPACING.xl,
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    loginLink: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
