/** Supervisor Tasks – mock API only. No backend. */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getTasks, onDataChange } from '../../../lib/mock-api';

export default function SupervisorTasksScreen() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const siteId = user?.currentSiteId ?? 's1';

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const list = getTasks(siteId);
    setTasks(
      list.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        location: t.description || '—',
        time: '—',
        assignedToLabourId: t.assignedTo,
      }))
    );
    setLoading(false);
    setRefreshing(false);
  }, [siteId]);

  useEffect(() => {
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
  };

  const handleAssignToLabour = (taskId: string) => {
    Alert.alert('Assign Task', 'Select a labourer to assign this task');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks (mock)</Text>
        <Text style={styles.headerSubtitle}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={DESIGN.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
        >
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Tasks Assigned</Text>
              <Text style={styles.emptyStateText}>Tasks from mock data will appear here</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {tasks.map((task) => (
                <View key={task.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskLocation}>📍 {task.location}</Text>
                      <Text style={styles.taskTime}>🕐 {task.time}</Text>
                    </View>
                    <View style={[styles.statusBadge, task.status === 'completed' && styles.statusBadgeCompleted]}>
                      <Text style={[styles.statusText, task.status === 'completed' && styles.statusTextCompleted]}>
                        {task.status}
                      </Text>
                    </View>
                  </View>
                  {!task.assignedToLabourId ? (
                    <TouchableOpacity
                      style={styles.assignButton}
                      onPress={() => handleAssignToLabour(task.id)}
                    >
                      <Ionicons name="person-add" size={18} color="#fff" />
                      <Text style={styles.assignButtonText}>Assign to Labour</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.assignedText}>Assigned to labour</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.background },
  header: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.md,
    paddingBottom: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: DESIGN.colors.text.secondary },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  list: { padding: DESIGN.spacing.lg },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    marginBottom: DESIGN.spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: DESIGN.spacing.md },
  cardInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary },
  taskLocation: { fontSize: 13, color: DESIGN.colors.text.secondary, marginTop: 4 },
  taskTime: { fontSize: 13, color: DESIGN.colors.text.secondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FEF3C7' },
  statusBadgeCompleted: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: '600', color: DESIGN.colors.text.primary },
  statusTextCompleted: { color: DESIGN.colors.success },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DESIGN.colors.primary,
    paddingVertical: 12,
    borderRadius: DESIGN.radius.sm,
  },
  assignButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  assignedText: { fontSize: 13, color: DESIGN.colors.text.secondary, textAlign: 'center', paddingVertical: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: DESIGN.spacing.xl * 2 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary, marginTop: 16 },
  emptyStateText: { fontSize: 14, color: DESIGN.colors.text.secondary, textAlign: 'center', marginTop: 8 },
});
