/** Stock Tracking – Essential. Frontend-only, mock. Low-bandwidth: skeleton first. */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { SkeletonBox } from '../../components/SkeletonBox';
import { getStock, stockInOut } from '../../lib/mock-api';

export default function StockScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [skeleton, setSkeleton] = useState(true);
  const [, forceUpdate] = useState(0);
  const items = getStock();

  useEffect(() => {
    const t = setTimeout(() => setSkeleton(false), 500);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); forceUpdate((n) => n + 1); }, 400);
  }, []);

  const statusColor = (s: string) => (s === 'critical' ? DESIGN.colors.danger : s === 'low' ? DESIGN.colors.warning : DESIGN.colors.success);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Stock Tracking</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In/Out inventory</Text>
          {skeleton ? (
            <>
              <SkeletonBox height={100} style={{ marginBottom: 12 }} />
              <SkeletonBox height={100} style={{ marginBottom: 12 }} />
              <SkeletonBox height={100} />
            </>
          ) : (
            items.map((s) => (
              <View key={s.id} style={[styles.card, { borderLeftColor: statusColor(s.status) }]}>
                <View style={styles.row}>
                  <Text style={styles.name}>{s.materialName}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(s.status)}20` }]}>
                    <Text style={[styles.badgeText, { color: statusColor(s.status) }]}>{s.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{s.quantity} {s.unit} • {s.location}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: DESIGN.colors.success }]} onPress={() => { stockInOut(s.id, 10, 'in'); forceUpdate((n) => n + 1); }}>
                    <Text style={styles.smallBtnText}>+10 In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: DESIGN.colors.warning }]} onPress={() => { stockInOut(s.id, 5, 'out'); forceUpdate((n) => n + 1); }}>
                    <Text style={styles.smallBtnText}>-5 Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
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
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12, color: DESIGN.colors.text.secondary, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
