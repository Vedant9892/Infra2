/** Labour Attendance – mock API only. No backend. */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getAttendanceApproved, markAttendance, onDataChange } from '../../../lib/mock-api';

export default function LabourAttendanceScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [todayMarked, setTodayMarked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<{ id: string; address: string; timestamp: string; status: string }[]>([]);

  const load = useCallback(() => {
    if (!siteId) return;
    const approved = getAttendanceApproved(siteId);
    setList(approved.map((a) => ({ id: a.id, address: a.address, timestamp: a.timestamp, status: a.status })));
  }, [siteId]);

  useEffect(() => {
    load();
    // Auto-refresh when data changes (cross-dashboard communication)
    const unsubscribe = onDataChange(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleMark = () => {
    if (!siteId) {
      Alert.alert('Error', 'Missing site');
      return;
    }
    setLoading(true);
    try {
      const uid = user?.id ?? 'u1';
      markAttendance(uid, 'photo://captured', 19.076, 72.8777, locationAddress || 'Andheri West, Mumbai', siteId);
      setTodayMarked(true);
      load();
      Alert.alert('Success', 'Attendance marked successfully. GPS and photo recorded.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!siteId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Missing site</Text>
          <TouchableOpacity style={styles.backBtnFull} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Mark Attendance</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <Text style={styles.hint}>GPS-fenced check-in. Tap below to mark your attendance.</Text>
        <TouchableOpacity
          style={[styles.markBtn, loading && styles.markBtnDisabled]}
          onPress={handleMark}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="location" size={24} color="#fff" />
              <Text style={styles.markBtnText}>Mark attendance</Text>
            </>
          )}
        </TouchableOpacity>
        {todayMarked ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={24} color={DESIGN.colors.success} />
            <Text style={styles.successText}>Marked today</Text>
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          {list.length === 0 ? (
            <Text style={styles.empty}>No records yet.</Text>
          ) : (
            list.slice(0, 5).map((a) => (
              <View key={a.id} style={styles.card}>
                <Text style={styles.cardMeta}>{a.address}</Text>
                <Text style={styles.cardTime}>{new Date(a.timestamp).toLocaleString()}</Text>
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
  content: { padding: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.xl * 2 },
  hint: { fontSize: 14, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.xl },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.md,
    paddingVertical: DESIGN.spacing.md,
    minHeight: DESIGN.button.min,
    marginBottom: DESIGN.spacing.xl,
  },
  markBtnDisabled: { opacity: 0.6 },
  markBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#D1FAE5',
    padding: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.xl,
  },
  successText: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.success },
  section: { marginTop: DESIGN.spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.md },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  cardMeta: { fontSize: 14, color: DESIGN.colors.text.secondary },
  cardTime: { fontSize: 12, color: DESIGN.colors.text.tertiary, marginTop: 4 },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: { backgroundColor: DESIGN.colors.primary, paddingHorizontal: DESIGN.spacing.xl, paddingVertical: DESIGN.spacing.md, borderRadius: DESIGN.radius.sm },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
