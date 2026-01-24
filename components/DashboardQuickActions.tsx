import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../constants/designSystem';

export interface QuickAction {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress?: () => void;
}

export interface DashboardQuickActionsProps {
  title?: string;
  actions: QuickAction[];
  rightElement?: React.ReactNode;
}

export function DashboardQuickActions({
  title = 'Quick Actions',
  actions,
  rightElement,
}: DashboardQuickActionsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightElement ?? null}
      </View>
      <View style={styles.grid}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.card, { borderLeftColor: a.color }]}
            onPress={a.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${a.color}20` }]}>
              <Ionicons name={a.icon as any} size={26} color={a.color} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{a.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>{a.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN.spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    ...DESIGN.shadow.sm,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
  },
});
