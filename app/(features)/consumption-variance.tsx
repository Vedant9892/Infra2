/** Consumption Variance – Desirable. Frontend-only, mock. */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { getConsumptionVariance } from '../../lib/mock-api';

export default function ConsumptionVarianceScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const list = getConsumptionVariance();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const statusColor = (s: string) => (s === 'alert' ? DESIGN.colors.danger : s === 'warning' ? DESIGN.colors.warning : DESIGN.colors.success);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Consumption Variance</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theoretical vs actual</Text>
          <Text style={styles.hint}>Wastage alerts when variance % is high</Text>
          {list.map((v) => (
            <View key={v.id} style={[styles.card, { borderLeftColor: statusColor(v.status) }]}>
              <View style={styles.row}>
                <Text style={styles.name}>{v.materialName}</Text>
                <View style={[styles.badge, { backgroundColor: `${statusColor(v.status)}20` }]}>
                  <Text style={[styles.badgeText, { color: statusColor(v.status) }]}>{v.status}</Text>
                </View>
              </View>
              <View style={styles.stats}>
                <Text style={styles.stat}>Theoretical: {v.theoreticalQty} {v.unit}</Text>
                <Text style={styles.stat}>Actual: {v.actualQty} {v.unit}</Text>
              </View>
              <Text style={[styles.variance, { color: statusColor(v.status) }]}>
                Variance: {v.variance > 0 ? '+' : ''}{v.variance} ({v.variancePercent}%)
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  scroll: { flex: 1 },
  section: { paddingHorizontal: DESIGN.spacing.lg, paddingTop: DESIGN.spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.secondary, marginBottom: 4 },
  hint: { fontSize: 12, color: DESIGN.colors.text.tertiary, marginBottom: DESIGN.spacing.md },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  stat: { fontSize: 12, color: DESIGN.colors.text.secondary },
  variance: { fontSize: 13, fontWeight: '600' },
});
