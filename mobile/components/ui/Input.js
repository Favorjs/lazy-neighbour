import React, { useState } from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/config';

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
    style,
    inputStyle,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    multiline && { height: 24 * numberOfLines + SPACING.md * 2 },
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <RNTextInput
                    style={[
                        styles.input,
                        leftIcon && { paddingLeft: 0 },
                        rightIcon && { paddingRight: 0 },
                        multiline && { textAlignVertical: 'top' },
                        inputStyle,
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.rightIcon}
                    >
                        <Text style={styles.togglePassword}>
                            {isPasswordVisible ? '🙈' : '👁️'}
                        </Text>
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <View style={styles.rightIcon}>{rightIcon}</View>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgElevated,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: SPACING.md,
    },
    inputFocused: {
        borderColor: COLORS.primary,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    input: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 16,
        paddingVertical: SPACING.md,
    },
    leftIcon: {
        marginRight: SPACING.sm,
    },
    rightIcon: {
        marginLeft: SPACING.sm,
    },
    togglePassword: {
        fontSize: 18,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: SPACING.xs,
    },
});

export default Input;
