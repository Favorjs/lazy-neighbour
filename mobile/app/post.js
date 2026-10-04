import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Button, Input, Card } from '../components/ui';
import { CategoryPicker } from '../components/errand/CategoryPicker';
import { COLORS, SPACING, RADIUS } from '../constants/config';
import api from '../services/api';

export default function PostErrandScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('QUICK');
    const [bounty, setBounty] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const getLocation = async () => {
        setGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLocation({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            });

            // Reverse geocode to get address
            const [place] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });

            if (place) {
                const addr = [place.street, place.city, place.region]
                    .filter(Boolean)
                    .join(', ');
                setAddress(addr);
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get location');
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Validation', 'Please enter a title');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Validation', 'Please enter a description');
            return;
        }
        if (!bounty || parseFloat(bounty) < 1) {
            Alert.alert('Validation', 'Bounty must be at least $1');
            return;
        }
        if (!location) {
            Alert.alert('Validation', 'Please set your location');
            return;
        }

        setLoading(true);
        try {
            await api.createErrand({
                title: title.trim(),
                description: description.trim(),
                category,
                bountyAmount: parseFloat(bounty),
                locationLat: location.lat,
                locationLng: location.lng,
                address,
            });

            Alert.alert(
                'Errand Posted! 🎉',
                'Your errand is now visible to Runners nearby.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to post errand');
        } finally {
            setLoading(false);
        }
    };

    const serviceFee = bounty ? (parseFloat(bounty) * 0.1).toFixed(2) : '0.00';
    const total = bounty ? (parseFloat(bounty) * 1.1).toFixed(2) : '0.00';

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Post an Errand</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Form */}
                    <Input
                        label="What do you need?"
                        placeholder="e.g., Pick up groceries from the store"
                        value={title}
                        onChangeText={setTitle}
                        autoCapitalize="sentences"
                    />

                    <Input
                        label="Details"
                        placeholder="Add any specific requirements, addresses, or instructions..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        autoCapitalize="sentences"
                    />

                    <CategoryPicker
                        selected={category}
                        onSelect={setCategory}
                    />

                    {/* Location */}
                    <View style={styles.locationSection}>
                        <Text style={styles.label}>Location</Text>
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={getLocation}
                            disabled={gettingLocation}
                        >
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.locationText}>
                                {gettingLocation
                                    ? 'Getting location...'
                                    : address || 'Tap to set your location'}
                            </Text>
                            {location && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Bounty */}
                    <View style={styles.bountySection}>
                        <Text style={styles.label}>Set Your Bounty</Text>
                        <View style={styles.bountyInputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <Input
                                placeholder="0"
                                value={bounty}
                                onChangeText={setBounty}
                                keyboardType="numeric"
                                style={styles.bountyInput}
                                inputStyle={styles.bountyInputText}
                            />
                        </View>
                        <Text style={styles.bountyHint}>
                            A fair bounty attracts Runners faster!
                        </Text>
                    </View>

                    {/* Cost Breakdown */}
                    {bounty && parseFloat(bounty) > 0 && (
                        <Card style={styles.breakdownCard}>
                            <Text style={styles.breakdownTitle}>Cost Breakdown</Text>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Bounty</Text>
                                <Text style={styles.breakdownValue}>${bounty}</Text>
                            </View>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Service Fee (10%)</Text>
                                <Text style={styles.breakdownValue}>${serviceFee}</Text>
                            </View>
                            <View style={[styles.breakdownRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${total}</Text>
                            </View>
                        </Card>
                    )}

                    {/* Submit Button */}
                    <Button
                        title="Post Errand"
                        onPress={handleSubmit}
                        loading={loading}
                        size="lg"
                        style={styles.submitButton}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    closeButton: {
        color: COLORS.textSecondary,
        fontSize: 24,
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    label: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: SPACING.sm,
    },
    locationSection: {
        marginBottom: SPACING.md,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgElevated,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
    },
    locationIcon: {
        fontSize: 18,
    },
    locationText: {
        flex: 1,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    checkmark: {
        color: COLORS.success,
        fontSize: 18,
    },
    bountySection: {
        marginBottom: SPACING.md,
    },
    bountyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        color: COLORS.accent,
        fontSize: 32,
        fontWeight: '700',
        marginRight: SPACING.sm,
    },
    bountyInput: {
        flex: 1,
        marginBottom: 0,
    },
    bountyInputText: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.accent,
    },
    bountyHint: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: SPACING.xs,
    },
    breakdownCard: {
        marginBottom: SPACING.lg,
    },
    breakdownTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.md,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    breakdownLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    breakdownValue: {
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.bgElevated,
        paddingTop: SPACING.sm,
        marginTop: SPACING.sm,
    },
    totalLabel: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    totalValue: {
        color: COLORS.accent,
        fontSize: 18,
        fontWeight: '800',
    },
    submitButton: {
        marginTop: SPACING.md,
        marginBottom: SPACING.xxl,
    },
});
