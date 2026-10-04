import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, CATEGORIES, SPACING, RADIUS } from '../../constants/config';

export const CategoryPicker = ({
    selected,
    onSelect,
    style,
}) => {
    const categories = Object.entries(CATEGORIES);

    const handleSelect = (key) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(key);
    };

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {categories.map(([key, category]) => {
                    const isSelected = selected === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => handleSelect(key)}
                            activeOpacity={0.7}
                            style={[
                                styles.categoryItem,
                                isSelected && { backgroundColor: `${category.color}20`, borderColor: category.color },
                            ]}
                        >
                            <Text style={styles.icon}>{category.icon}</Text>
                            <Text
                                style={[
                                    styles.categoryLabel,
                                    isSelected && { color: category.color },
                                ]}
                            >
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
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
        marginBottom: SPACING.sm,
    },
    scrollContent: {
        gap: SPACING.sm,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.bgElevated,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    icon: {
        fontSize: 24,
    },
    categoryLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default CategoryPicker;
