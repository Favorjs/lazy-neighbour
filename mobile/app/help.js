import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, Icon, ScreenHeader, Sheet } from '../components/ui';
import { COLORS, SPACING, RADIUS, TYPE, SUPPORT_EMAIL } from '../constants/config';

// Plain-language answers, grouped by what people are trying to do
const FAQ = [
    {
        group: 'Getting started',
        icon: 'Sparkles',
        items: [
            {
                q: 'How does Lazy Neighbour work?',
                a: 'Post an errand with a bounty and a neighbour nearby picks it up. They run it, send a photo as proof, and you release payment. Or flip it around: pick up errands on the map and earn the bounty.',
            },
            {
                q: 'Can I both send and run errands?',
                a: 'Yes. There is nothing to switch. Send an errand any time, and pick up errands from the Run tab whenever you want to earn. It all uses the same wallet.',
            },
            {
                q: 'What kind of errands can I post?',
                a: 'Food and drinks, store runs, home help and quick tasks. Anything legal and safe is fine. We remove errands that are not.',
            },
        ],
    },
    {
        group: 'Wallet and payments',
        icon: 'Wallet',
        items: [
            {
                q: 'How do I add money to my wallet?',
                a: 'Open Wallet from your profile and tap Add money. Your balance is used to pay for errands. Card payments are coming soon.',
            },
            {
                q: 'When is my money taken?',
                a: 'When you send an errand, the bounty and service fee are held safely in escrow from your wallet. Your runner is only paid when you release payment.',
            },
            {
                q: 'What if I cancel an errand?',
                a: 'While it is still waiting for a runner, you can cancel and the full amount goes straight back to your wallet.',
            },
            {
                q: 'How do I withdraw what I earned?',
                a: 'Add a bank account under Payment methods, then use Withdraw in your wallet. Withdrawals show as pending until they are paid out.',
            },
            {
                q: 'What is the service fee?',
                a: 'A small percentage added to the bounty when you send an errand. Runners always receive the full bounty.',
            },
        ],
    },
    {
        group: 'Running errands',
        icon: 'Footprints',
        items: [
            {
                q: 'How do I find errands near me?',
                a: 'Open the Run tab. Turn on location and you will see errands within 5 km as pins on the map. Tap one to see the details, then accept.',
            },
            {
                q: 'How do I get paid?',
                a: 'Mark the errand as done with a photo. When the requester releases payment, the bounty lands in your wallet and you earn karma.',
            },
            {
                q: 'What is karma?',
                a: 'Points you earn for finishing errands and paying promptly. Higher levels build trust with your neighbours.',
            },
        ],
    },
    {
        group: 'Safety and problems',
        icon: 'ShieldCheck',
        items: [
            {
                q: 'Something went wrong with an errand',
                a: 'Open the errand and tap Dispute while it is in progress or just completed. The money stays held while our team looks into it.',
            },
            {
                q: 'How do I stay safe?',
                a: 'Keep chats inside the app, meet in public places when you can, and never share your password or card details with anyone.',
            },
        ],
    },
    {
        group: 'Your account',
        icon: 'User',
        items: [
            {
                q: 'How do I change how the app looks?',
                a: 'Go to Settings and pick System, Light or Dark under Appearance.',
            },
            {
                q: 'How do I delete my account?',
                a: 'Go to Settings, then Delete account. You will need your password, no open errands and an empty wallet. Withdraw any balance first.',
            },
        ],
    },
];

export default function HelpScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return FAQ;
        return FAQ
            .map((g) => ({ ...g, items: g.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) }))
            .filter((g) => g.items.length > 0);
    }, [query]);

    const contact = async () => {
        const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Lazy Neighbour support')}`;
        try {
            await Linking.openURL(url);
        } catch (error) {
            Sheet.alert('Email us', `Write to ${SUPPORT_EMAIL} and we will get back to you.`);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader title="Help and support" />

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.hero}>How can we help?</Text>
                <Input
                    placeholder="Search for an answer"
                    value={query}
                    onChangeText={setQuery}
                    leftIcon="Search"
                    pill
                    style={{ marginTop: SPACING.md }}
                />

                {/* Quick links */}
                {!query ? (
                    <View style={styles.quick}>
                        <Pressable style={styles.quickCard} onPress={() => router.push('/wallet')}>
                            <Icon name="Wallet" size={22} />
                            <Text style={styles.quickText}>My wallet</Text>
                        </Pressable>
                        <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/errands')}>
                            <Icon name="ListChecks" size={22} />
                            <Text style={styles.quickText}>My errands</Text>
                        </Pressable>
                        <Pressable style={styles.quickCard} onPress={() => router.push('/settings')}>
                            <Icon name="Lock" size={22} />
                            <Text style={styles.quickText}>Account</Text>
                        </Pressable>
                    </View>
                ) : null}

                {/* FAQ */}
                {filtered.map((group) => (
                    <View key={group.group} style={{ marginTop: SPACING.lg }}>
                        <View style={styles.groupHead}>
                            <Icon name={group.icon} size={18} />
                            <Text style={styles.group}>{group.group}</Text>
                        </View>
                        <View style={styles.card}>
                            {group.items.map((item, i) => {
                                const id = `${group.group}-${i}`;
                                const isOpen = open === id || !!query;
                                return (
                                    <View key={id} style={i > 0 && styles.divider}>
                                        <Pressable style={styles.question} onPress={() => setOpen(open === id ? null : id)}>
                                            <Text style={styles.qText}>{item.q}</Text>
                                            <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={20} color={COLORS.inkSecondary} />
                                        </Pressable>
                                        {isOpen ? <Text style={styles.answer}>{item.a}</Text> : null}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {filtered.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyDisc}>
                            <Icon name="Search" size={28} />
                        </View>
                        <Text style={styles.emptyTitle}>No answers for that</Text>
                        <Text style={styles.emptyText}>Try different words, or send us a message below.</Text>
                    </View>
                ) : null}

                {/* Contact */}
                <View style={styles.contact}>
                    <Text style={styles.contactTitle}>Still stuck?</Text>
                    <Text style={styles.contactText}>
                        Tell us what happened and include the errand title. We reply within a day.
                    </Text>
                    <Button title="Email support" variant="primary" block bubbleIcon="Mail" onPress={contact} style={{ marginTop: SPACING.md }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
    hero: { ...TYPE.hero, color: COLORS.ink, marginTop: SPACING.sm },
    quick: { flexDirection: 'row', gap: 10, marginTop: SPACING.sm },
    quickCard: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        paddingVertical: SPACING.md,
    },
    quickText: { ...TYPE.chip, color: COLORS.ink },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
    group: { ...TYPE.heading, color: COLORS.ink },
    card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
    divider: { borderTopWidth: 1, borderTopColor: COLORS.line },
    question: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md },
    qText: { ...TYPE.cardTitle, fontFamily: TYPE.label.fontFamily, color: COLORS.ink, flex: 1 },
    answer: { ...TYPE.bodySm, color: COLORS.inkSecondary, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, marginTop: -4 },
    empty: { alignItems: 'center', paddingVertical: SPACING.xl, gap: 6 },
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
    emptyText: { ...TYPE.bodySm, color: COLORS.inkSecondary, textAlign: 'center' },
    contact: {
        marginTop: SPACING.xl,
        backgroundColor: COLORS.surfaceMuted,
        borderRadius: RADIUS.card,
        padding: SPACING.lg,
    },
    contactTitle: { ...TYPE.title, color: COLORS.ink },
    contactText: { ...TYPE.bodySm, color: COLORS.inkSecondary, marginTop: 4 },
});
