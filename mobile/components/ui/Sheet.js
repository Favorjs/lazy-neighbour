import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { COLORS, RADIUS, SHADOW, SPACING, TYPE, makeStyles, useThemeVersion } from '../../constants/config';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

// ---------------------------------------------------------------------------
// BottomModal: the sliding sheet shell.
//  - tap the dimmed area outside it, or swipe it down, and it goes
//  - GestureHandlerRootView lives INSIDE the Modal (the app-level one does not reach into a
//    Modal's own native window) and the drag uses Gesture.Pan, which, unlike PanResponder,
//    is reliable inside a Modal
// ---------------------------------------------------------------------------
export const BottomModal = ({ visible, onClose, children, onClosed }) => {
    useThemeVersion();
    const insets = useSafeAreaInsets();
    const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [mounted, setMounted] = useState(visible);

    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    // Drag the notch (or the sheet's top edge) down: past 100px, or a quick flick, dismisses it
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (e.translationY > 0) slide.setValue(e.translationY);
        })
        .onEnd((e) => {
            if (e.translationY > 100 || e.velocityY > 900) {
                closeRef.current?.();
            } else {
                Animated.spring(slide, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 40,
                    stiffness: 400,
                    mass: 1,
                    overshootClamping: true,
                }).start();
            }
        })
        .runOnJS(true);

    const tapOutside = Gesture.Tap()
        .maxDuration(300)
        .onEnd((_e, success) => {
            if (success) closeRef.current?.();
        })
        .runOnJS(true);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Animated.spring(slide, {
                toValue: 0,
                useNativeDriver: true,
                damping: 50,
                stiffness: 500,
                mass: 1.2,
                overshootClamping: true,
            }).start();
        } else if (mounted) {
            Animated.timing(slide, {
                toValue: SCREEN_HEIGHT,
                duration: 260,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setMounted(false);
                    onClosed?.();
                }
            });
        }
    }, [visible]);

    // Start fully off-screen again next time it opens
    useEffect(() => {
        if (!mounted) slide.setValue(SCREEN_HEIGHT);
    }, [mounted]);

    if (!mounted) return null;

    return (
        <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.root}>
                    {/* Dimmed area: fades with the sheet's position, and a tap on it closes the sheet */}
                    <GestureDetector gesture={tapOutside}>
                        <Animated.View
                            accessibilityLabel="Dismiss"
                            style={[
                                styles.backdrop,
                                {
                                    opacity: slide.interpolate({
                                        inputRange: [0, SCREEN_HEIGHT * 0.6],
                                        outputRange: [0.45, 0],
                                        extrapolate: 'clamp',
                                    }),
                                },
                            ]}
                        />
                    </GestureDetector>

                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm,
                                maxHeight: SCREEN_HEIGHT - insets.top,
                                transform: [{ translateY: slide }],
                            },
                        ]}
                    >
                        <GestureDetector gesture={panGesture}>
                            <View style={styles.notchHitArea}>
                                <View style={styles.notch} />
                            </View>
                        </GestureDetector>

                        {children}
                    </Animated.View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

// ---------------------------------------------------------------------------
// Sheet.alert: same call shape as Alert.alert, shown as a scrollable bottom sheet
//   Sheet.alert('Title', 'Message', [{ text, style, onPress }])
//   style: 'default' (black pill) | 'destructive' (grey pill, clay label) | 'cancel' (not shown: swipe or tap outside)
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
    useThemeVersion();
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

    // Cancel buttons are gone: swiping the sheet down (or tapping outside) is how you back out.
    const allButtons = current.buttons || [];
    const buttons = allButtons.filter((b) => b.style !== 'cancel');
    const dismissHint = allButtons.some((b) => b.style === 'cancel') ? '' : 'Swipe down to close';
    // The first non-destructive button is the main action; the rest are soft pills
    const mainIndex = buttons.findIndex((b) => b.style !== 'destructive');

    return (
        <BottomModal visible={visible} onClose={() => close()} onClosed={handleClosed}>
            <View style={styles.content}>
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

                {buttons.length > 0 ? (
                    <View style={styles.buttons}>
                        {buttons.map((b, i) => (
                            <Button
                                key={`${b.text}-${i}`}
                                title={b.text}
                                block
                                variant={i === mainIndex ? 'primary' : 'soft'}
                                destructive={b.style === 'destructive'}
                                bubbleIcon={i === mainIndex ? 'ArrowRight' : 'Trash'}
                                onPress={() => close(b.onPress)}
                            />
                        ))}
                    </View>
                ) : null}

                <Text style={styles.hint}>{dismissHint}</Text>
            </View>
        </BottomModal>
    );
};

const styles = makeStyles(() => ({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
    sheet: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.sheet,
        borderTopRightRadius: RADIUS.sheet,
        paddingHorizontal: SPACING.lg,
        ...SHADOW.sheet,
    },
    // A generous drag target, like a handle: easy to grab with a thumb
    notchHitArea: {
        width: '100%',
        paddingTop: 14,
        paddingBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notch: {
        height: 5,
        width: 44,
        borderRadius: 3,
        backgroundColor: COLORS.surfacePressed,
    },
    content: { width: '100%' },
    title: { ...TYPE.title, color: COLORS.ink },
    messageContent: { paddingVertical: SPACING.sm },
    message: { ...TYPE.body, color: COLORS.inkSecondary },
    buttons: { gap: 12, marginTop: SPACING.md },
    hint: { ...TYPE.caption, color: COLORS.grey, textAlign: 'center', marginTop: SPACING.md },
}));

export default Sheet;
