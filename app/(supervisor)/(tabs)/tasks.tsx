import React, { useState, useEffect } from 'react';
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
import { API_BASE_URL } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';

export default function SupervisorTasksScreen() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    if (!user?.id || !user?.currentSiteId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tasks?userId=${user.id}&role=site_supervisor&siteId=${user.currentSiteId}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.id, user?.currentSiteId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleAssignToLabour = (taskId: string) => {
    Alert.alert('Assign Task', 'Select a labourer to assign this task to', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: () => {
          Alert.alert('Coming Soon', 'Task assignment feature will be available soon');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Tasks Assigned</Text>
              <Text style={styles.emptyStateText}>
                Tasks assigned by engineers will appear here
              </Text>
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

                  {!task.assignedToLabourId && (
                    <TouchableOpacity
                      style={styles.assignButton}
                      onPress={() => handleAssignToLabour(task.id)}
                    >
                      <Ionicons name="person-add" size={18} color={DESIGN.colors.primary} />
                      <Text style={styles.assignButtonText}>Assign to Labour</Text>
                    </TouchableOpacity>
                  )}

                  {task.assignedToLabourId && (
                    <View style={styles.assignedInfo}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.assignedText}>Assigned to Labour</Text>
                    </View>
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
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  header: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.md,
    paddingBottom: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DESIGN.colors.textSecondary,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  list: {
    padding: DESIGN.spacing.lg,
    gap: DESIGN.spacing.md,
  },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    marginBottom: DESIGN.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DESIGN.spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginBottom: 4,
  },
  taskLocation: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
    marginBottom: 2,
  },
  taskTime: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    textTransform: 'capitalize',
  },
  statusTextCompleted: {
    color: '#10B981',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    marginTop: DESIGN.spacing.sm,
    gap: 6,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.primary,
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DESIGN.spacing.sm,
    gap: 6,
  },
  assignedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginTop: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: DESIGN.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: DESIGN.spacing.xl,
  },
});
