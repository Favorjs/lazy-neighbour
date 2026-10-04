import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING } from '../../constants/config';

export const Button = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, outline, ghost
    size = 'md', // sm, md, lg
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
}) => {
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };

    const sizeStyles = {
        sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, fontSize: 14 },
        md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, fontSize: 16 },
        lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, fontSize: 18 },
    };

    const isDisabled = disabled || loading;

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={handlePress}
                disabled={isDisabled}
                activeOpacity={0.8}
                style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
            >
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.button,
                        { paddingVertical: sizeStyles[size].paddingVertical, paddingHorizontal: sizeStyles[size].paddingHorizontal },
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            {icon}
                            <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }, textStyle]}>
                                {title}
                            </Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantStyles = {
        secondary: {
            button: { backgroundColor: COLORS.accent },
            text: { color: COLORS.white },
        },
        outline: {
            button: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary },
            text: { color: COLORS.primary },
        },
        ghost: {
            button: { backgroundColor: 'transparent' },
            text: { color: COLORS.primary },
        },
    };

    const currentVariant = variantStyles[variant] || variantStyles.secondary;

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={isDisabled}
            activeOpacity={0.7}
            style={[
                styles.button,
                currentVariant.button,
                { paddingVertical: sizeStyles[size].paddingVertical, paddingHorizontal: sizeStyles[size].paddingHorizontal },
                { opacity: isDisabled ? 0.6 : 1 },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={currentVariant.text.color} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, currentVariant.text, { fontSize: sizeStyles[size].fontSize }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.lg,
        gap: SPACING.sm,
    },
    text: {
        color: COLORS.white,
        fontWeight: '600',
    },
});

export default Button;
