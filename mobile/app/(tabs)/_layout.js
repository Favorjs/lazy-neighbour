import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { Fab, Icon } from '../../components/ui';
import { COLORS, SHADOW, TYPE } from '../../constants/config';

// ---------------------------------------------------------------------------
// iOS: native tab bar. On iOS 26 the system draws it as floating liquid glass;
// on older iOS it falls back to the standard translucent bar.
// ---------------------------------------------------------------------------
const GlassSendButton = ({ onPress }) => {
    const insets = useSafeAreaInsets();
    const glass = isLiquidGlassAvailable();

    return (
        <View style={[styles.floating, { bottom: insets.bottom + 78 }]} pointerEvents="box-none">
            {glass ? (
                <Pressable
                    accessibilityLabel="Send an errand"
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onPress();
                    }}
                >
                    <GlassView glassEffectStyle="regular" tintColor={COLORS.ink} isInteractive style={styles.glassFab}>
                        <Icon name="Plus" size={28} color={COLORS.white} />
                    </GlassView>
                </Pressable>
            ) : (
                <Fab onPress={onPress} label="Send an errand" />
            )}
        </View>
    );
};

function IosTabs() {
    const router = useRouter();

    return (
        <View style={{ flex: 1 }}>
            <NativeTabs tintColor={COLORS.ink} minimizeBehavior="onScrollDown">
                <NativeTabs.Trigger name="feed">
                    <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
                    <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="radar">
                    <NativeTabs.Trigger.Icon sf={{ default: 'figure.run', selected: 'figure.run' }} />
                    <NativeTabs.Trigger.Label>Run</NativeTabs.Trigger.Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="errands">
                    <NativeTabs.Trigger.Icon sf={{ default: 'checklist', selected: 'checklist' }} />
                    <NativeTabs.Trigger.Label>My errands</NativeTabs.Trigger.Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="profile">
                    <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
                    <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
                </NativeTabs.Trigger>
                {/* Android-only centre button route */}
                <NativeTabs.Trigger name="send" hidden />
            </NativeTabs>

            {/* One tap to send an errand from any tab */}
            <GlassSendButton onPress={() => router.push('/post')} />
        </View>
    );
}

// ---------------------------------------------------------------------------
// Android: the default tab bar, with the Send button raised in the centre.
// ---------------------------------------------------------------------------
const TabIcon = ({ icon, label, focused }) => (
    <View style={styles.tabIcon}>
        <Icon name={icon} size={24} color={focused ? COLORS.ink : COLORS.grey} />
        <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>{label}</Text>
    </View>
);

function DefaultTabs() {
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                tabBarActiveTintColor: COLORS.ink,
                tabBarInactiveTintColor: COLORS.grey,
            }}
        >
            <Tabs.Screen
                name="feed"
                options={{ tabBarIcon: ({ focused }) => <TabIcon icon="House" label="Home" focused={focused} /> }}
            />
            <Tabs.Screen
                name="radar"
                options={{ tabBarIcon: ({ focused }) => <TabIcon icon="Radar" label="Run" focused={focused} /> }}
            />
            <Tabs.Screen
                name="send"
                options={{
                    tabBarButton: () => (
                        <View style={styles.fabSlot}>
                            <Fab onPress={() => router.push('/post')} label="Send an errand" />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="errands"
                options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ListChecks" label="My errands" focused={focused} /> }}
            />
            <Tabs.Screen
                name="profile"
                options={{ tabBarIcon: ({ focused }) => <TabIcon icon="User" label="Profile" focused={focused} /> }}
            />
        </Tabs>
    );
}

export default function TabLayout() {
    return Platform.OS === 'ios' ? <IosTabs /> : <DefaultTabs />;
}

const styles = StyleSheet.create({
    floating: { position: 'absolute', right: 20 },
    glassFab: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 0,
        height: 84,
        paddingBottom: 20,
        paddingTop: 10,
        ...SHADOW.sheet,
    },
    tabIcon: { alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 64 },
    label: { ...TYPE.caption, fontSize: 11, color: COLORS.grey },
    labelFocused: { color: COLORS.ink, fontFamily: TYPE.badge.fontFamily },
    fabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', top: -18 },
});
