/** GST Bills – Essential. Frontend-only, mock. */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { getGSTBills } from '../../lib/mock-api';

export default function GSTBillsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const bills = getGSTBills();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const statusColor = (s: string) => (s === 'paid' ? DESIGN.colors.success : s === 'sent' ? DESIGN.colors.info : '#94A3B8');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>GST Bills</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax-ready bills</Text>
          {bills.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.billNo}>{b.billNumber}</Text>
                <View style={[styles.badge, { backgroundColor: `${statusColor(b.status)}20` }]}>
                  <Text style={[styles.badgeText, { color: statusColor(b.status) }]}>{b.status}</Text>
                </View>
              </View>
              <Text style={styles.vendor}>{b.vendorName}</Text>
              <Text style={styles.gst}>GST: {b.vendorGST}</Text>
              <Text style={styles.total}>₹{b.grandTotal.toLocaleString()}</Text>
              <Text style={styles.meta}>{new Date(b.date).toLocaleDateString()} • {b.projectName ?? '—'}</Text>
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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  billNo: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  vendor: { fontSize: 13, color: DESIGN.colors.text.secondary },
  gst: { fontSize: 11, color: DESIGN.colors.text.tertiary, marginTop: 2 },
  total: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.primary, marginTop: 8 },
  meta: { fontSize: 11, color: DESIGN.colors.text.tertiary, marginTop: 4 },
});
