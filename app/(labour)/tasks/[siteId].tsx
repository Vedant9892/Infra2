import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL, LABOUR_ENDPOINTS } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import { LabourCard } from '../../../components/LabourCard';

interface Task {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
}

export default function LabourTasksScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!siteId || !user?.id) return;
    try {
      // Use existing task API
      const res = await fetch(`${API_BASE_URL}/api/tasks?userId=${user.id}&role=labour&siteId=${siteId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: any) => ({
          _id: t.id?.toString() || t._id?.toString() || '',
          id: t.id?.toString(),
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.date,
        })));
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [siteId, user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const markComplete = async (taskId: string) => {
    if (!taskId) return;
    setUpdating(taskId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await fetchTasks();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText} allowFontScaling={false}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} allowFontScaling={false}>My Assigned Tasks</Text>
        <View style={styles.back} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={DESIGN.colors.primary} />
            <Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText} allowFontScaling={false}>No tasks assigned</Text>
            <Text style={styles.emptyHint} allowFontScaling={false}>Daily assigned work will appear here</Text>
          </View>
        ) : (
          tasks.map((t) => (
            <LabourCard key={t._id || t.id}>
              <Text style={styles.taskTitle} allowFontScaling={false}>{t.title}</Text>
              {t.description ? (
                <Text style={styles.taskDesc} allowFontScaling={false} numberOfLines={2}>{t.description}</Text>
              ) : null}
              <View style={styles.taskRow}>
                <View style={[styles.badge, t.status === 'completed' && styles.badgeDone]}>
                  <Text style={styles.badgeText} allowFontScaling={false}>{t.status}</Text>
                </View>
                {t.status !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, updating === (t._id || t.id) && styles.btnDisabled]}
                    onPress={() => markComplete(t._id || t.id || '')}
                    disabled={!!updating}
                  >
                    {updating === (t._id || t.id) ? (
                      <ActivityIndicator size="small" color={DESIGN.colors.surface} />
                    ) : (
                      <Text style={styles.btnText} allowFontScaling={false}>Mark complete</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </LabourCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DESIGN.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.BASE_PADDING,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  back: { minWidth: 72 },
  backText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.primary },
  title: { fontSize: DESIGN.typography.subtitle, fontWeight: '700', color: DESIGN.colors.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: DESIGN.BASE_PADDING, paddingVertical: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.xl * 3 },
  loading: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary },
  empty: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  emptyText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.sm },
  emptyHint: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary },
  taskTitle: { fontSize: DESIGN.typography.subtitle, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.xs },
  taskDesc: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: DESIGN.spacing.sm },
  badge: {
    paddingHorizontal: DESIGN.spacing.sm,
    paddingVertical: DESIGN.spacing.xs,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: '#FEF3C7',
  },
  badgeDone: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: DESIGN.colors.text.primary },
  btn: {
    borderRadius: DESIGN.radius.sm,
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.sm,
    minHeight: DESIGN.button.min,
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: DESIGN.colors.surface },
});
