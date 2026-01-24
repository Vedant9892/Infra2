/** Labour Tasks – mock API only. No backend. */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getTasks, updateTaskStatus, onDataChange } from '../../../lib/mock-api';

export default function LabourTasksScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [tasks, setTasks] = useState<{ id: string; title: string; description?: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const fetchTasks = useCallback(() => {
    if (!siteId) return;
    const list = getTasks(siteId);
    setTasks(list.map((t) => ({ id: t.id, title: t.title, description: t.description, status: t.status })));
    setLoading(false);
    setRefreshing(false);
  }, [siteId]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
    // Auto-refresh when data changes
    const unsubscribe = onDataChange(() => {
      fetchTasks();
    });
    return unsubscribe;
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
    forceUpdate((n) => n + 1);
    setTimeout(() => setRefreshing(false), 400);
  };

  const markComplete = (taskId: string) => {
    if (!taskId) return;
    setUpdating(taskId);
    try {
      updateTaskStatus(taskId, 'completed');
      fetchTasks();
      forceUpdate((n) => n + 1);
      Alert.alert('Success', 'Task marked complete');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
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
        <Text style={styles.title}>My Assigned Tasks</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={DESIGN.colors.primary} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks assigned</Text>
          </View>
        ) : (
          tasks.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <View style={[styles.badge, t.status === 'completed' && styles.badgeDone]}>
                  <Text style={styles.badgeText}>{t.status}</Text>
                </View>
              </View>
              {t.description ? <Text style={styles.taskDesc} numberOfLines={2}>{t.description}</Text> : null}
              {t.status !== 'completed' ? (
                <TouchableOpacity
                  style={[styles.completeBtn, updating === t.id && styles.completeBtnDisabled]}
                  onPress={() => markComplete(t.id)}
                  disabled={!!updating}
                >
                  {updating === t.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.completeBtnText}>Mark complete</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
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
  loading: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: 14, color: DESIGN.colors.text.secondary },
  empty: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  emptyText: { fontSize: 14, color: DESIGN.colors.text.secondary },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: DESIGN.colors.text.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FEF3C7' },
  badgeDone: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: DESIGN.colors.text.primary },
  taskDesc: { fontSize: 14, color: DESIGN.colors.text.secondary, marginBottom: 12 },
  completeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: DESIGN.radius.sm,
  },
  completeBtnDisabled: { opacity: 0.6 },
  completeBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: { backgroundColor: DESIGN.colors.primary, paddingHorizontal: DESIGN.spacing.xl, paddingVertical: DESIGN.spacing.md, borderRadius: DESIGN.radius.sm },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
