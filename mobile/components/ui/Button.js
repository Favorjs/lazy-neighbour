import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { PandaSpinner } from '../brand/SleepingPanda';
import { COLORS, RADIUS, TYPE, makeStyles } from '../../constants/config';
import { useSingleFlight } from '../../utils/singleFlight';

// Flat pill buttons (no shadow); they dim slightly while pressed.
// primary: black (the one main action per screen) · secondary: green (Release payment only)
// soft: grey (default) · ghost: underlined text link
export const Button = ({
    title,
    onPress,
    variant = 'soft', // primary | secondary | soft | ghost
    size = 'md', // sm (40) | md (56)
    block = false, // full width: label left, round bubble right
    icon, // Lucide name, leading icon
    bubbleIcon = 'ArrowRight', // Lucide name for the end bubble on block buttons
    loading = false,
    destructive = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;
    const filled = variant === 'primary' || variant === 'secondary';
    const small = size === 'sm';

    const fill = isDisabled
        ? COLORS.surfaceMuted
        : variant === 'primary' ? COLORS.black
        : variant === 'secondary' ? COLORS.green
        : variant === 'ghost' ? 'transparent'
        : COLORS.surfaceMuted;

    const labelColor = isDisabled
        ? COLORS.grey
        : filled ? COLORS.white
        : destructive ? COLORS.clay
        : COLORS.ink;

    const bubbleIconColor = variant === 'secondary' ? COLORS.green : COLORS.ink;

    // A second tap while the first is still running (or just after) is ignored
    const handlePress = useSingleFlight(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return onPress?.();
    });

    if (variant === 'ghost') {
        return (
            <Pressable onPress={handlePress} disabled={isDisabled} hitSlop={8} style={[styles.ghost, style]}>
                <Text
                    style={[
                        styles.ghostText,
                        isDisabled && { color: COLORS.grey },
                        destructive && { color: COLORS.clay, textDecorationColor: COLORS.clay },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={handlePress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                small ? styles.sm : styles.md,
                block && styles.block,
                block && { paddingRight: small ? 4 : 8 },
                { backgroundColor: fill },
                filled && !isDisabled && pressed && { opacity: 0.85 },
                !filled && pressed && !isDisabled && { backgroundColor: COLORS.surfacePressed },
                style,
            ]}
        >
            <View style={[styles.labelRow, block && { flex: 1, justifyContent: 'flex-start' }]}>
                {loading ? (
                    <PandaSpinner size={small ? 30 : 38} />
                ) : (
                    <>
                        {icon ? <Icon name={icon} size={small ? 16 : 20} color={labelColor} /> : null}
                        <Text style={[small ? styles.textSm : styles.text, { color: labelColor }, textStyle]} numberOfLines={1}>
                            {title}
                        </Text>
                    </>
                )}
            </View>
            {block && !loading && !isDisabled ? (
                <View style={[styles.bubble, small && styles.bubbleSm]}>
                    <Icon name={bubbleIcon} size={20} color={bubbleIconColor} />
                </View>
            ) : null}
        </Pressable>
    );
};

// 48px grey circle (call, chat)
export const IconButton = ({ icon, onPress, label, size = 48, style }) => {
    const press = useSingleFlight(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return onPress?.();
    }, 350);

    return (
    <Pressable
        accessibilityLabel={label}
        onPress={press}
        style={({ pressed }) => [
            {
                width: size,
                height: size,
                borderRadius: RADIUS.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? COLORS.surfacePressed : COLORS.surfaceMuted,
            },
            style,
        ]}
    >
        <Icon name={icon} size={20} />
    </Pressable>
    );
};

// 60px black circle with a white plus, on the press ledge: Send an errand
export const Fab = ({ onPress, icon = 'Plus', label = 'Send an errand', style }) => {
    const press = useSingleFlight(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return onPress?.();
    }, 600);

    return (
    <Pressable
        accessibilityLabel={label}
        onPress={press}
        style={({ pressed }) => [
            styles.fab,
            pressed && { opacity: 0.85 },
            style,
        ]}
    >
        <Icon name={icon} size={26} color={COLORS.white} />
    </Pressable>
    );
};

const styles = makeStyles(() => ({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.full,
        alignSelf: 'flex-start',
    },
    md: { minHeight: 56, paddingHorizontal: 28 },
    sm: { minHeight: 40, paddingHorizontal: 18 },
    block: { alignSelf: 'stretch', paddingLeft: 28 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    text: { ...TYPE.button },
    textSm: { ...TYPE.label, fontFamily: TYPE.button.fontFamily },
    bubble: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubbleSm: { width: 32, height: 32 },
    ghost: { alignSelf: 'flex-start', paddingVertical: 4 },
    ghostText: {
        ...TYPE.button,
        color: COLORS.ink,
        textDecorationLine: 'underline',
        textDecorationColor: COLORS.ink,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

export default Button;
