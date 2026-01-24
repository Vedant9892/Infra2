/** Tool Library Check-Out – Desirable. Frontend-only, mock. */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { getTools, getToolRequests, requestTool, returnTool } from '../../lib/mock-api';

const SITE_ID = 's1';
const DURATIONS = ['30m', '1h', '2h'];

export default function ToolLibraryScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{ id: string; name: string } | null>(null);
  const [duration, setDuration] = useState('1h');
  const [, forceUpdate] = useState(0);
  const tools = getTools(SITE_ID);
  const requests = getToolRequests(SITE_ID, user?.id ?? 'u1');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); forceUpdate((n) => n + 1); }, 400);
  }, []);

  const request = () => {
    if (!modal) return;
    requestTool(modal.id, SITE_ID, user?.id ?? 'u1', duration);
    setModal(null);
    forceUpdate((n) => n + 1);
    Alert.alert('Requested', `${modal.name} – ${duration}`);
  };

  const statusColor = (s: string) =>
    s === 'issued' ? DESIGN.colors.success : s === 'returned' ? DESIGN.colors.info : s === 'rejected' ? DESIGN.colors.danger : DESIGN.colors.warning;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Tool Library</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available tools</Text>
          <View style={styles.grid}>
            {tools.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.toolCard}
                onPress={() => setModal({ id: t.id, name: t.name })}
              >
                <Ionicons name="construct" size={28} color={DESIGN.colors.primary} />
                <Text style={styles.toolName}>{t.name}</Text>
                <Text style={styles.toolHint}>Tap to request</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My requests</Text>
          {requests.length === 0 ? (
            <Text style={styles.empty}>No requests yet.</Text>
          ) : (
            requests.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.cardTitle}>{r.toolName}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(r.status)}20` }]}>
                    <Text style={[styles.badgeText, { color: statusColor(r.status) }]}>{r.status}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{r.requestedDuration} • {new Date(r.requestedAt).toLocaleString()}</Text>
                {r.status === 'issued' ? (
                  <TouchableOpacity style={styles.returnBtn} onPress={() => { returnTool(r.id); forceUpdate((n) => n + 1); }}>
                    <Text style={styles.returnBtnText}>Return tool</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={!!modal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModal(null)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request {modal?.name}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durChip, duration === d && styles.durChipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.durText, duration === d && styles.durTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={request}>
              <Text style={styles.submitBtnText}>Submit request</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DESIGN.spacing.md },
  toolCard: {
    width: '47%',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: DESIGN.colors.primary,
  },
  toolName: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary, marginTop: 8 },
  toolHint: { fontSize: 11, color: DESIGN.colors.primary, marginTop: 4 },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12, color: DESIGN.colors.text.secondary, marginBottom: 8 },
  returnBtn: { backgroundColor: DESIGN.colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  returnBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: DESIGN.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: DESIGN.spacing.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  modalLabel: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.secondary, marginBottom: 8 },
  durationRow: { flexDirection: 'row', gap: DESIGN.spacing.sm, marginBottom: DESIGN.spacing.xl },
  durChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6' },
  durChipActive: { backgroundColor: DESIGN.colors.primary },
  durText: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.primary },
  durTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: DESIGN.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
