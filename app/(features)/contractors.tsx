/** Contractor Rating & Management – Full implementation with real API */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { contractorApi } from '../../lib/feature-api';

export default function ContractorsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContractors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contractorApi.getAll();
      setList(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading contractors:', error);
      Alert.alert('Error', error.message || 'Failed to load contractors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContractors();
    setRefreshing(false);
  }, [loadContractors]);

  const paymentColor = (p: string) => (p === 'release' ? DESIGN.colors.success : p === 'hold' ? DESIGN.colors.danger : DESIGN.colors.warning);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Contractor Rating</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1–10 rating, payment advice</Text>
          {loading ? (
            <Text style={styles.empty}>Loading contractors...</Text>
          ) : list.length === 0 ? (
            <Text style={styles.empty}>No contractors found</Text>
          ) : (
            list.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{c.name}</Text>
                <View style={styles.ratingWrap}>
                  <Ionicons name="star" size={16} color={DESIGN.colors.warning} />
                  <Text style={styles.rating}>{c.rating}</Text>
                </View>
              </View>
              <View style={styles.stats}>
                <Text style={styles.stat}>Deadlines: {c.deadlinesMet}/{c.totalProjects}</Text>
                <Text style={styles.stat}>Defects: {c.defectCount}</Text>
              </View>
              <View style={[styles.advice, { backgroundColor: `${paymentColor(c.paymentAdvice)}20` }]}>
                <Text style={[styles.adviceText, { color: paymentColor(c.paymentAdvice) }]}>Payment: {c.paymentAdvice}</Text>
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
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary },
  stats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  stat: { fontSize: 12, color: DESIGN.colors.text.secondary },
  advice: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  adviceText: { fontSize: 12, fontWeight: '600' },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary, textAlign: 'center', marginTop: 20 },
});
