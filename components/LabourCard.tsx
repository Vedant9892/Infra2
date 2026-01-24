import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { DESIGN } from '../constants/designSystem';

interface LabourCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function LabourCard({ children, style }: LabourCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    ...(Platform.OS === 'android' ? { elevation: 2 } : DESIGN.shadow.sm),
  },
});
