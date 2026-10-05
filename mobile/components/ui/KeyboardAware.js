import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Two ways to treat the keyboard, chosen per screen:
//
//  <KeyboardAware lift>   Full-screen pages with a button pinned to the bottom (login, Add money, chat).
//                         The content rises above the keyboard. The offset is the safe-area top inset,
//                         which is how far the view really sits below the top of the screen. That is what
//                         React Native's KeyboardAvoidingView needs to avoid over-pushing the content.
//
//  <KeyboardAware>        Pop-up (modal) forms. Nothing moves, so the layout never jumps or leaves a gap.
//                         Put `automaticallyAdjustKeyboardInsets` on the ScrollView inside so the field you
//                         are typing in scrolls into view.
export const KeyboardAware = ({ children, style, lift = false }) => {
    const insets = useSafeAreaInsets();

    if (lift) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={insets.top}
                style={style}
            >
                {children}
            </KeyboardAvoidingView>
        );
    }

    return <View style={style}>{children}</View>;
};

export default KeyboardAware;
