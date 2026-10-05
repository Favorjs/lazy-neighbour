import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Avatar, IconButton, Icon, Sheet, KeyboardAware } from '../../components/ui';
import { ChatSkeleton } from '../../components/ui/Skeleton';
import { PandaSpinner } from '../../components/brand/SleepingPanda';
import { COLORS, SPACING, RADIUS, TYPE, makeStyles, useThemeVersion } from '../../constants/config';
import api from '../../services/api';

export default function ChatScreen() {
    const themeVersion = useThemeVersion();
    const router = useRouter();
    const { errandId } = useLocalSearchParams();
    const flatListRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [user, setUser] = useState(null);
    const [errand, setErrand] = useState(null);

    useEffect(() => {
        fetchData();
        // Poll for new messages (in a real app, use WebSocket)
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [errandId]);

    const fetchData = async () => {
        try {
            const [messagesData, userData, errandData] = await Promise.all([
                api.getMessages(errandId),
                api.getMe(),
                api.getErrand(errandId),
            ]);
            setMessages(messagesData.messages || []);
            setUser(userData.user);
            setErrand(errandData.errand);
        } catch (error) {
            console.error('Failed to fetch chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await api.getMessages(errandId);
            setMessages(data.messages || []);
        } catch (error) {
            // Silently fail on polling
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const { message } = await api.sendMessage(errandId, newMessage.trim());
            setMessages((prev) => [...prev, message]);
            setNewMessage('');
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            if (error.code === 'CHAT_CLOSED') {
                setErrand((e) => (e ? { ...e, status: 'RELEASED' } : e));
                Sheet.alert('Chat is closed', error.message);
            } else {
                console.error('Failed to send message:', error);
            }
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) =>
        new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const renderMessage = ({ item }) => {
        const own = item.senderId === user?.id;

        return (
            <View style={[styles.messageRow, own && styles.ownRow]}>
                {!own ? (
                    <Avatar
                        source={item.sender?.avatarUrl ? { uri: item.sender.avatarUrl } : null}
                        name={item.sender?.name}
                        size={32}
                    />
                ) : null}
                <View style={[styles.bubble, own ? styles.ownBubble : styles.otherBubble]}>
                    {!own ? <Text style={styles.senderName}>{item.sender?.name}</Text> : null}
                    <Text style={[styles.messageText, own && { color: COLORS.white }]}>{item.content}</Text>
                    <Text style={[styles.time, own && { color: COLORS.surfacePressed }]}>{formatTime(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />
                    <View style={styles.headerInfo} />
                    <View style={{ width: 48 }} />
                </View>
                <ChatSkeleton />
            </SafeAreaView>
        );
    }

    const canSend = newMessage.trim() && !sending;

    // Chat is only open while the errand is in progress (until the requester pays)
    const chatOpen = !errand || ['ACTIVE', 'COMPLETED'].includes(errand.status);
    const partner = errand ? (errand.requesterId === user?.id ? errand.runner : errand.requester) : null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <IconButton icon="ChevronLeft" label="Back" onPress={() => router.back()} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{partner?.name || 'Chat'}</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {errand ? errand.title : `${messages.length} messages`}
                    </Text>
                </View>
                <View style={{ width: 48 }} />
            </View>

            <FlatList
                extraData={themeVersion}
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.list}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyDisc}>
                            <Icon name="MessageCircle" size={28} />
                        </View>
                        <Text style={styles.emptyTitle}>Say hello</Text>
                        <Text style={styles.emptyText}>Sort out the details of this errand here.</Text>
                    </View>
                }
            />

            <KeyboardAware lift>
                {chatOpen ? (
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Write a message"
                        placeholderTextColor={COLORS.grey}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={500}
                        selectionColor={COLORS.ink}
                    />
                    <Pressable
                        style={[styles.send, !canSend && styles.sendOff]}
                        onPress={handleSend}
                        disabled={!canSend}
                        accessibilityLabel="Send message"
                    >
                        {sending ? (
                            <PandaSpinner size={34} />
                        ) : (
                            <Icon name="Send" size={20} color={canSend ? COLORS.white : COLORS.grey} />
                        )}
                    </Pressable>
                </View>
                ) : (
                    <View style={styles.closed}>
                        <Icon name="Lock" size={18} color={COLORS.inkSecondary} />
                        <Text style={styles.closedText}>
                            This chat is closed. It is only open while the errand is in progress.
                        </Text>
                    </View>
                )}
            </KeyboardAware>
        </SafeAreaView>
    );
}

const styles = makeStyles(() => ({
    container: { flex: 1, backgroundColor: COLORS.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.line,
    },
    headerInfo: { flex: 1, alignItems: 'center' },
    headerTitle: { ...TYPE.cardTitle, color: COLORS.ink },
    headerSub: { ...TYPE.caption, color: COLORS.inkSecondary },
    list: { padding: SPACING.md, flexGrow: 1 },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.md },
    ownRow: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '75%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.card },
    otherBubble: { backgroundColor: COLORS.surfaceMuted, borderBottomLeftRadius: 6 },
    ownBubble: { backgroundColor: COLORS.ink, borderBottomRightRadius: 6 },
    senderName: { ...TYPE.badge, color: COLORS.inkSecondary, marginBottom: 2 },
    messageText: { ...TYPE.body, fontSize: 15, lineHeight: 21, color: COLORS.ink },
    time: { ...TYPE.caption, fontSize: 10, color: COLORS.inkSecondary, alignSelf: 'flex-end', marginTop: 4 },
    empty: { alignItems: 'center', paddingTop: SPACING.xxl * 2, gap: 6 },
    emptyDisc: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    emptyTitle: { ...TYPE.heading, color: COLORS.ink },
    emptyText: { ...TYPE.bodySm, color: COLORS.inkSecondary },
    closed: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        margin: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
    },
    closedText: { ...TYPE.bodySm, color: COLORS.inkSecondary, flex: 1 },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.sm,
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.line,
    },
    input: {
        flex: 1,
        ...TYPE.body,
        color: COLORS.ink,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        maxHeight: 100,
    },
    send: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendOff: { backgroundColor: COLORS.surfaceMuted },
}));
