import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
    useFonts,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { SheetHost } from '../components/ui/Sheet';
import { COLORS, IS_DARK } from '../constants/config';

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Poppins_800ExtraBold,
    });

    // Wait for Poppins so no screen flashes in the system font
    if (!fontsLoaded && !fontError) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.surface }}>
            <StatusBar style={IS_DARK ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.surface },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="errand/[id]"
                    options={{ presentation: 'card', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="post"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen name="chat/[errandId]" options={{ presentation: 'card' }} />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="wallet" />
                <Stack.Screen name="payment-methods" />
                <Stack.Screen
                    name="add-bank"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen name="settings" />
                <Stack.Screen
                    name="location"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen name="money/add" />
                <Stack.Screen name="money/add-review" />
                <Stack.Screen name="money/add-done" options={{ gestureEnabled: false }} />
                <Stack.Screen name="money/withdraw" />
                <Stack.Screen name="money/withdraw-bank" />
                <Stack.Screen name="money/withdraw-review" />
                <Stack.Screen name="money/withdraw-done" options={{ gestureEnabled: false }} />
                <Stack.Screen name="help" />
            </Stack>
            <SheetHost />
        </GestureHandlerRootView>
    );
}
