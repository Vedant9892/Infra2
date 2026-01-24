import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../constants/designSystem';

export interface DashboardYourTasksProps {
  title?: string;
  pendingLabel?: string;
  showPendingTag?: boolean;
  pendingCount?: number;
  children: React.ReactNode;
}

export function DashboardYourTasks({
  title = 'Your Tasks',
  pendingLabel = 'Pending',
  showPendingTag = true,
  pendingCount,
  children,
}: DashboardYourTasksProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showPendingTag ? (
          <View style={styles.pendingTag}>
            <Ionicons name="time-outline" size={14} color={DESIGN.colors.primary} />
            <Text style={styles.pendingText}>
              {pendingLabel}
              {typeof pendingCount === 'number' ? ` ${pendingCount}` : ''}
            </Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingBottom: DESIGN.spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.lg,
    gap: DESIGN.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN.colors.primary,
  },
});
