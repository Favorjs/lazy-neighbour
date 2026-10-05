import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Platform,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, Icon, ScreenHeader, Sheet, KeyboardAware } from '../components/ui';
import { COLORS, SPACING, RADIUS, TYPE, THEME, applyTheme, makeStyles, useThemeVersion } from '../constants/config';
import api from '../services/api';

const APPEARANCE = [
    { key: 'system', label: 'System', icon: 'Smartphone', hint: 'Match my phone' },
    { key: 'light', label: 'Light', icon: 'Sun', hint: 'Always bright' },
    { key: 'dark', label: 'Dark', icon: 'Moon', hint: 'Easy on the eyes' },
];

export default function SettingsScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [password, setPassword] = useState('');
    const [working, setWorking] = useState(false);

    useEffect(() => {
        api.getStoredUser().then(setUser).catch(() => {});
    }, []);

    // Appearance changes instantly: every screen re-renders in the new look, no restart
    const chooseAppearance = (key) => {
        if (key === THEME.pref) return;
        applyTheme(key);
    };

    const signOut = () => {
        Sheet.alert('Sign out', 'You can sign back in any time.', [
            {
                text: 'Sign out',
                onPress: async () => {
                    await api.clearAuth();
                    router.replace('/(auth)/login');
                },
            },
            { text: 'Stay signed in', style: 'cancel' },
        ]);
    };

    const confirmDelete = () => {
        if (!password) {
            return Sheet.alert('Enter your password', 'We need your password to delete your account.');
        }

        Sheet.alert(
            'Delete your account?',
            'This permanently removes your profile, chats and history. It cannot be undone.\n\nYou can only delete your account when you have no open errands and nothing left in your wallet.',
            [
                {
                    text: 'Delete my account',
                    style: 'destructive',
                    onPress: async () => {
                        setWorking(true);
                        try {
                            await api.deleteAccount(password);
                            router.replace('/(auth)/login');
                        } catch (error) {
                            Sheet.alert('We could not delete your account', error.message || 'Please try again.');
                        } finally {
                            setWorking(false);
                        }
                    },
                },
                { text: 'Keep my account', style: 'cancel' },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAware style={{ flex: 1 }}>
                <ScreenHeader title="Settings" />

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
                    {/* Appearance */}
                    <Text style={styles.section}>Appearance</Text>
                    <View style={styles.tiles}>
                        {APPEARANCE.map((a) => {
                            const on = a.key === THEME.pref;
                            return (
                                <Pressable
                                    key={a.key}
                                    onPress={() => chooseAppearance(a.key)}
                                    accessibilityState={{ selected: on }}
                                    style={[styles.tile, on && styles.tileOn]}
                                >
                                    <View style={[styles.tileDisc, on && { backgroundColor: COLORS.white }]}>
                                        <Icon name={a.icon} size={24} color={COLORS.ink} />
                                    </View>
                                    <Text style={[styles.tileLabel, on && { color: COLORS.white }]}>{a.label}</Text>
                                    <Text style={[styles.tileHint, on && { color: COLORS.surfacePressed }]} numberOfLines={1}>
                                        {a.hint}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Account */}
                    <Text style={[styles.section, { marginTop: SPACING.xl }]}>Account</Text>
                    <View style={styles.card}>
                        <View style={styles.accountRow}>
                            <View style={styles.disc}>
                                <Icon name="Mail" size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowLabel}>Signed in as</Text>
                                <Text style={styles.rowValue} numberOfLines={1}>{user?.email || '...'}</Text>
                            </View>
                        </View>
                    </View>

                    <Button
                        title="Sign out"
                        block
                        bubbleIcon="LogOut"
                        onPress={signOut}
                        style={{ marginTop: SPACING.md }}
                    />

                    {/* Danger zone */}
                    <Text style={[styles.section, { marginTop: SPACING.xl }]}>Danger zone</Text>
                    {!deleting ? (
                        <Pressable style={styles.deleteRow} onPress={() => setDeleting(true)}>
                            <View style={[styles.disc, { backgroundColor: COLORS.clayTint }]}>
                                <Icon name="Trash" size={20} color={COLORS.clay} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowValue, { color: COLORS.clay }]}>Delete account</Text>
                                <Text style={styles.rowLabel}>Permanently remove your account and data</Text>
                            </View>
                            <Icon name="ChevronRight" size={20} color={COLORS.grey} />
                        </Pressable>
                    ) : (
                        <View style={styles.deletePanel}>
                            <Text style={styles.deleteTitle}>Delete your account</Text>
                            <Text style={styles.deleteText}>
                                This cannot be undone. Finish or cancel open errands and withdraw your wallet balance first.
                            </Text>
                            <Input
                                label="Your password"
                                placeholder="Enter it to confirm"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                leftIcon="Lock"
                                style={{ marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                            />
                            <Button
                                title="Delete account"
                                destructive
                                block
                                bubbleIcon="Trash"
                                disabled={!password}
                                loading={working}
                                onPress={confirmDelete}
                            />
                            <Button
                                title="Never mind"
                                variant="ghost"
                                onPress={() => {
                                    setDeleting(false);
                                    setPassword('');
                                }}
                                style={{ alignSelf: 'center', marginTop: SPACING.sm }}
                            />
                        </View>
                    )}

                    <Text style={styles.version}>Lazy Neighbour 1.0.0</Text>
                </ScrollView>
            </KeyboardAware>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    section: { ...TYPE.heading, color: COLORS.ink, marginTop: SPACING.md, marginBottom: SPACING.sm + 2 },
    tiles: { flexDirection: 'row', gap: 10 },
    tile: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 4,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tileOn: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
    tileDisc: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileLabel: { ...TYPE.chip, color: COLORS.ink },
    tileHint: { ...TYPE.caption, fontSize: 11, color: COLORS.inkSecondary },
    card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.line, padding: SPACING.md },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    disc: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: { ...TYPE.caption, color: COLORS.inkSecondary },
    rowValue: { ...TYPE.cardTitle, color: COLORS.ink },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: COLORS.line,
        padding: SPACING.md,
    },
    deletePanel: {
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        padding: SPACING.md,
        gap: 4,
    },
    deleteTitle: { ...TYPE.heading, color: COLORS.clay },
    deleteText: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    version: { ...TYPE.caption, color: COLORS.inkSecondary, textAlign: 'center', marginTop: SPACING.xl },
}));
