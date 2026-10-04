import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../constants/config';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.bgDark },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="errand/[id]"
                    options={{
                        presentation: 'card',
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="post"
                    options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen
                    name="chat/[errandId]"
                    options={{
                        presentation: 'card',
                    }}
                />
            </Stack>
        </GestureHandlerRootView>
    );
}
