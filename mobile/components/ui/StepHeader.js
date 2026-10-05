import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from './ScreenHeader';
import { COLORS, RADIUS, SPACING, TYPE } from '../../constants/config';

// Header for one page of a multi-page flow: back button, title, and "Step 2 of 3" with a progress bar
export const StepHeader = ({ title, step, total }) => (
    <View>
        <ScreenHeader title={title} />
        <View style={styles.wrap}>
            <Text style={styles.label}>STEP {step} OF {total}</Text>
            <View style={styles.bars}>
                {Array.from({ length: total }).map((_, i) => (
                    <View key={i} style={[styles.seg, i < step && styles.segOn]} />
                ))}
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    wrap: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: SPACING.sm, gap: 8 },
    label: { ...TYPE.overline, color: COLORS.inkSecondary },
    bars: { flexDirection: 'row', gap: 4 },
    seg: { flex: 1, height: 6, borderRadius: RADIUS.detail, backgroundColor: COLORS.surfacePressed },
    segOn: { backgroundColor: COLORS.ink },
});

export default StepHeader;
