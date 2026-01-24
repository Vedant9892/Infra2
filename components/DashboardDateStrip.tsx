import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { format, addDays } from 'date-fns';
import { DESIGN } from '../constants/designSystem';

export interface DashboardDateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  numDays?: number;
  offset?: number;
}

const defaultOffset = 3;

export function DashboardDateStrip({
  selectedDate,
  onSelectDate,
  numDays = 7,
  offset = defaultOffset,
}: DashboardDateStripProps) {
  const start = addDays(new Date(), -offset);
  const dates = Array.from({ length: numDays }, (_, i) => addDays(start, i));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((d, i) => {
          const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onSelectDate(d)}
              style={[styles.dateCard, isSelected && styles.dateCardActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.day, isSelected && styles.dayActive]}>
                {format(d, 'EEE').slice(0, 3)}
              </Text>
              <Text style={[styles.num, isSelected && styles.numActive]}>
                {format(d, 'd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xl,
  },
  scrollContent: {
    paddingRight: DESIGN.spacing.lg,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: DESIGN.radius.lg,
    backgroundColor: DESIGN.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.md,
    ...DESIGN.shadow.md,
    elevation: 3,
  },
  dateCardActive: {
    backgroundColor: DESIGN.colors.primary,
  },
  day: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.text.tertiary,
  },
  dayActive: {
    color: '#fff',
  },
  num: {
    fontSize: 22,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginTop: DESIGN.spacing.xs,
  },
  numActive: {
    color: '#fff',
  },
});
