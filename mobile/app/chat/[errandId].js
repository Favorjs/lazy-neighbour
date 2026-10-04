import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Avatar } from '../../components/ui';
import { COLORS, SPACING, RADIUS } from '../../constants/config';
import api from '../../services/api';

export default function ChatScreen() {
    const router = useRouter();
    const { errandId } = useLocalSearchParams();
    const flatListRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchData();
        // Poll for new messages (in a real app, use WebSocket)
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [errandId]);

    const fetchData = async () => {
        try {
            const [messagesData, userData] = await Promise.all([
                api.getMessages(errandId),
                api.getMe(),
            ]);
            setMessages(messagesData.messages || []);
            setUser(userData.user);
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

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }) => {
        const isOwnMessage = item.senderId === user?.id;

        return (
            <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
                {!isOwnMessage && (
                    <Avatar
                        source={item.sender?.avatarUrl ? { uri: item.sender.avatarUrl } : null}
                        name={item.sender?.name}
                        size={32}
                    />
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.ownBubble : styles.otherBubble,
                    ]}
                >
                    {!isOwnMessage && (
                        <Text style={styles.senderName}>{item.sender?.name}</Text>
                    )}
                    <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Chat</Text>
                    <Text style={styles.headerSubtitle}>
                        {messages.length} messages
                    </Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>💬</Text>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>
                            Start the conversation!
                        </Text>
                    </View>
                }
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.textMuted}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Text style={styles.sendIcon}>↑</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bgElevated,
    },
    backButton: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: '300',
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    messagesList: {
        padding: SPACING.md,
        flexGrow: 1,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    ownMessageRow: {
        justifyContent: 'flex-end',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    otherBubble: {
        backgroundColor: COLORS.bgCard,
        borderBottomLeftRadius: SPACING.xs,
    },
    ownBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: SPACING.xs,
    },
    senderName: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    messageText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        lineHeight: 20,
    },
    ownMessageText: {
        color: COLORS.white,
    },
    messageTime: {
        color: COLORS.textMuted,
        fontSize: 10,
        marginTop: SPACING.xs,
        alignSelf: 'flex-end',
    },
    ownMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: SPACING.xxl * 2,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: SPACING.md,
    },
    emptyText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtext: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.bgElevated,
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        color: COLORS.textPrimary,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.bgElevated,
    },
    sendIcon: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '700',
    },
});
