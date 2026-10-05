import React from 'react';
import { Stack } from 'expo-router';
import { COLORS, useThemeVersion } from '../../constants/config';

export default function AuthLayout() {
    const themeVersion = useThemeVersion();
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.surface } }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
