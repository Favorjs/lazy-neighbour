import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/config';

const TabIcon = ({ icon, label, focused }) => (
    <View style={styles.tabIcon}>
        <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
);

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
            }}
        >
            <Tabs.Screen
                name="feed"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🏠" label="Feed" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="radar"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📍" label="Radar" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="errands"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📋" label="My Tasks" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="👤" label="Profile" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.bgCard,
        borderTopWidth: 0,
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    tabIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    icon: {
        fontSize: 24,
        opacity: 0.6,
    },
    iconFocused: {
        opacity: 1,
    },
    label: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    labelFocused: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
