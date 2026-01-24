/** Tools Diary – mock API only. No backend. */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getTools, getToolRequests, requestTool, returnTool, onDataChange } from '../../../lib/mock-api';

type Tool = { id: string; name: string; description?: string };
type ToolRequest = {
  id: string;
  toolId: string;
  toolName: string;
  status: 'pending' | 'issued' | 'returned' | 'rejected';
  requestedDuration: string;
  requestedAt: string;
  issuedAt?: string | null;
  returnedAt?: string | null;
};

const DURATIONS = [
  { label: '30 min', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '2 hours', value: '2h' },
  { label: 'Custom', value: 'custom' },
];

export default function ToolsDiaryScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [tools, setTools] = useState<Tool[]>([]);
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requestModal, setRequestModal] = useState<{ tool: Tool } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [submitting, setSubmitting] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const loadData = useCallback(() => {
    if (!siteId) return;
    const sid = siteId;
    const uid = user?.id ?? 'u1';
    setTools(getTools(sid).map((t) => ({ id: t.id, name: t.name, description: t.description })));
    setRequests(
      getToolRequests(sid, uid).map((r) => ({
        id: r.id,
        toolId: r.toolId,
        toolName: r.toolName,
        status: r.status,
        requestedDuration: r.requestedDuration,
        requestedAt: r.requestedAt,
        issuedAt: r.issuedAt,
        returnedAt: r.returnedAt,
      }))
    );
  }, [siteId, user?.id]);

  useEffect(() => {
    loadData();
    // Auto-refresh when data changes
    const unsubscribe = onDataChange(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    forceUpdate((n) => n + 1);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleRequest = () => {
    if (!requestModal || !user?.id || !siteId) return;
    setSubmitting(true);
    try {
      requestTool(requestModal.tool.id, siteId, user.id, selectedDuration);
      setRequestModal(null);
      setSelectedDuration('1h');
      loadData();
      forceUpdate((n) => n + 1);
      Alert.alert('Success', 'Tool request submitted');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = (requestId: string) => {
    if (!requestId) return;
    setReturningId(requestId);
    try {
      returnTool(requestId);
      loadData();
      forceUpdate((n) => n + 1);
      Alert.alert('Success', 'Tool returned successfully');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Return failed');
    } finally {
      setReturningId(null);
    }
  };

  const getStatusColor = (s: string) => {
    if (s === 'issued') return '#10B981';
    if (s === 'returned') return '#3B82F6';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
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
        <Text style={styles.title}>Tools Diary</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available tools</Text>
          {tools.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="construct-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No tools for this site</Text>
            </View>
          ) : (
            <View style={styles.toolGrid}>
              {tools.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.toolCard}
                  onPress={() => setRequestModal({ tool: t })}
                >
                  <View style={styles.toolIcon}>
                    <Ionicons name="hammer" size={24} color={DESIGN.colors.primary} />
                  </View>
                  <Text style={styles.toolName}>{t.name}</Text>
                  {t.description ? (
                    <Text style={styles.toolDesc} numberOfLines={1}>{t.description}</Text>
                  ) : null}
                  <Text style={styles.requestHint}>Tap to request</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My requests</Text>
          {requests.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No requests yet</Text>
            </View>
          ) : (
            <View style={styles.requestList}>
              {requests.map((r) => (
                <View key={r.id} style={styles.requestCard}>
                  <View style={styles.requestRow}>
                    <Text style={styles.requestTool}>{r.toolName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(r.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestMeta}>
                    {r.requestedDuration} • {r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '—'}
                  </Text>
                  {r.status === 'issued' ? (
                    <TouchableOpacity
                      style={styles.returnBtn}
                      onPress={() => handleReturn(r.id)}
                      disabled={!!returningId}
                    >
                      <Ionicons name="arrow-undo" size={18} color="#fff" />
                      <Text style={styles.returnBtnText}>Return tool</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={!!requestModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRequestModal(null)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request {requestModal?.tool.name}</Text>
              <TouchableOpacity onPress={() => setRequestModal(null)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.durationChip, selectedDuration === d.value && styles.durationChipActive]}
                  onPress={() => setSelectedDuration(d.value)}
                >
                  <Text style={[styles.durationText, selectedDuration === d.value && styles.durationTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleRequest}
              disabled={submitting}
            >
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.md },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DESIGN.spacing.md },
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
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  toolName: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: 2 },
  toolDesc: { fontSize: 12, color: DESIGN.colors.text.secondary, marginBottom: 4 },
  requestHint: { fontSize: 11, color: DESIGN.colors.primary, fontWeight: '600' },
  empty: { paddingVertical: DESIGN.spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: DESIGN.colors.text.secondary },
  requestList: { gap: DESIGN.spacing.md },
  requestCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.sm,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  requestTool: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  requestMeta: { fontSize: 12, color: DESIGN.colors.text.secondary, marginBottom: 8 },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.sm,
    paddingVertical: 10,
  },
  returnBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  bottomSpacer: { height: 120 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: { backgroundColor: DESIGN.colors.primary, paddingHorizontal: DESIGN.spacing.xl, paddingVertical: DESIGN.spacing.md, borderRadius: DESIGN.radius.sm },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: DESIGN.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: DESIGN.spacing.xl,
    paddingBottom: DESIGN.spacing.xl * 2,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: DESIGN.colors.text.primary },
  modalLabel: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.sm },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: DESIGN.spacing.sm, marginBottom: DESIGN.spacing.xl },
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6' },
  durationChipActive: { backgroundColor: DESIGN.colors.primary },
  durationText: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.primary },
  durationTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.md,
    paddingVertical: DESIGN.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: DESIGN.button.min,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
