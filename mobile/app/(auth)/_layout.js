import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/config';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.surface } }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
