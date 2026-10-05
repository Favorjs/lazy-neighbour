import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Icon } from './Icon';
import { COLORS, RADIUS, SPACING, TYPE } from '../../constants/config';

// Filled field: grey at rest, white with a 2px black ring when focused, clay with an error.
// leftIcon / rightIcon are Lucide names.
export const Input = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    error,
    leftIcon,
    rightIcon,
    multiline = false,
    numberOfLines = 1,
    pill = false,
    style,
    inputStyle,
}) => {
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);

    return (
        <View style={[styles.container, style]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View
                style={[
                    styles.box,
                    pill && { borderRadius: RADIUS.full },
                    focused && styles.boxFocused,
                    error && styles.boxError,
                    multiline && { alignItems: 'flex-start', minHeight: 24 * numberOfLines + 28 },
                ]}
            >
                {leftIcon ? <Icon name={leftIcon} size={20} color={COLORS.inkSecondary} /> : null}

                <RNTextInput
                    style={[styles.input, multiline && { textAlignVertical: 'top' }, inputStyle]}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.grey}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !visible}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    selectionColor={COLORS.ink}
                />

                {secureTextEntry ? (
                    <Pressable
                        onPress={() => setVisible(!visible)}
                        hitSlop={10}
                        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
                    >
                        <Icon name={visible ? 'EyeOff' : 'Eye'} size={20} color={COLORS.inkSecondary} />
                    </Pressable>
                ) : rightIcon ? (
                    <Icon name={rightIcon} size={20} color={COLORS.inkSecondary} />
                ) : null}
            </View>

            {error ? (
                <View style={styles.errorRow}>
                    <Icon name="CircleAlert" size={14} color={COLORS.clay} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: SPACING.md },
    label: { ...TYPE.label, color: COLORS.ink, marginBottom: 6 },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.tile,
        borderWidth: 2,
        borderColor: 'transparent',
        paddingHorizontal: SPACING.md,
    },
    boxFocused: { borderColor: COLORS.focusRing, backgroundColor: COLORS.surface },
    boxError: { borderColor: COLORS.clay },
    input: { flex: 1, ...TYPE.body, color: COLORS.ink, paddingVertical: 14, minWidth: 0 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    errorText: { ...TYPE.caption, color: COLORS.clay },
});

export default Input;
