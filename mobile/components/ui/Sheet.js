import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    Pressable,
    Animated,
    Easing,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { COLORS, RADIUS, SHADOW, SPACING, TYPE } from '../../constants/config';

// ---------------------------------------------------------------------------
// BottomModal: the sliding sheet shell (backdrop, grabber, safe-area padding).
// Used by Sheet.alert below and by detail views such as a notification.
// ---------------------------------------------------------------------------
export const BottomModal = ({ visible, onClose, children, onClosed }) => {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const slide = useRef(new Animated.Value(0)).current;
    const [mounted, setMounted] = useState(visible);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            slide.setValue(0);
            Animated.timing(slide, {
                toValue: 1,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else if (mounted) {
            Animated.timing(slide, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setMounted(false);
                onClosed?.();
            });
        }
    }, [visible]);

    if (!mounted) return null;

    return (
        <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.root}>
                <Animated.View style={[styles.backdrop, { opacity: slide }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm,
                            maxHeight: height * 0.88,
                            transform: [
                                { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) },
                            ],
                        },
                    ]}
                >
                    <View style={styles.grabber} />
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
};

// ---------------------------------------------------------------------------
// Sheet.alert: same call shape as Alert.alert, shown as a scrollable bottom sheet
//   Sheet.alert('Title', 'Message', [{ text, style, onPress }])
//   style: 'default' (black pill) | 'cancel' (grey pill) | 'destructive' (grey pill, clay label)
// ---------------------------------------------------------------------------
let listener = null;
const queue = [];

const present = (config) => {
    if (listener) listener(config);
    else queue.push(config);
};

export const Sheet = {
    alert(title, message, buttons) {
        present({ title, message, buttons });
    },
};

export const SheetHost = () => {
    const { height } = useWindowDimensions();
    const [current, setCurrent] = useState(null);
    const [visible, setVisible] = useState(false);
    const pending = useRef([]);
    const afterClose = useRef(null);

    const open = (config) => {
        setCurrent(config);
        setVisible(true);
    };

    useEffect(() => {
        listener = (config) => {
            if (current) pending.current.push(config);
            else open(config);
        };
        while (queue.length) listener(queue.shift());
        return () => {
            listener = null;
        };
    });

    const close = (callback) => {
        afterClose.current = callback || null;
        setVisible(false);
    };

    const handleClosed = () => {
        setCurrent(null);
        const cb = afterClose.current;
        afterClose.current = null;
        cb?.();
        const next = pending.current.shift();
        if (next) setTimeout(() => open(next), 60);
    };

    if (!current) return null;

    const buttons = current.buttons?.length ? current.buttons : [{ text: 'Got it' }];
    // The first non-cancel button is the main action; the rest are soft pills
    const mainIndex = buttons.findIndex((b) => b.style !== 'cancel' && b.style !== 'destructive');

    return (
        <BottomModal visible={visible} onClose={() => close()} onClosed={handleClosed}>
            {current.title ? <Text style={styles.title}>{current.title}</Text> : null}

            {current.message ? (
                <ScrollView
                    style={{ maxHeight: height * 0.45 }}
                    contentContainerStyle={styles.messageContent}
                    showsVerticalScrollIndicator
                    bounces
                >
                    <Text style={styles.message}>{current.message}</Text>
                </ScrollView>
            ) : null}

            <View style={styles.buttons}>
                {buttons.map((b, i) => (
                    <Button
                        key={`${b.text}-${i}`}
                        title={b.text}
                        block
                        variant={i === mainIndex ? 'primary' : 'soft'}
                        destructive={b.style === 'destructive'}
                        bubbleIcon={i === mainIndex ? 'ArrowRight' : 'X'}
                        onPress={() => close(b.onPress)}
                    />
                ))}
            </View>
        </BottomModal>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.sheet,
        borderTopRightRadius: RADIUS.sheet,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        ...SHADOW.sheet,
    },
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.surfacePressed,
        marginBottom: SPACING.md,
    },
    title: { ...TYPE.title, color: COLORS.ink },
    messageContent: { paddingVertical: SPACING.sm },
    message: { ...TYPE.body, color: COLORS.inkSecondary },
    buttons: { gap: 12, marginTop: SPACING.md },
});

export default Sheet;
