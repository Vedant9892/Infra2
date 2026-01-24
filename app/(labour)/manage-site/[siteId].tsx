import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL, LABOUR_ENDPOINTS } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

interface DashboardData {
  role?: string;
  tasks?: { total: number; completed: number; pending: number };
  attendance?: { markedToday: boolean; totalCount: number };
  messages?: { unread: number };
}

interface TaskItem {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
}

interface MessageItem {
  _id: string;
  message: string;
  senderId?: { name?: string };
  timestamp: string;
}

interface TodayAttendance {
  checkInTime?: string;
  timestamp?: string;
}

export default function ManageSiteScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!siteId || !user?.id) return;
    setTasksLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks?userId=${user.id}&role=labour&siteId=${siteId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: any) => ({
          _id: t.id?.toString() || '',
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
      setTasksLoading(false);
    }
  }, [siteId, user?.id]);

  const fetchTodayAttendance = useCallback(async () => {
    if (!siteId || !user?.id) return;
    setAttendanceLoading(true);
    try {
      // Use existing attendance API
      const res = await fetch(`${API_BASE_URL}/api/attendance/pending?siteId=${siteId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.pending) && data.pending.length > 0) {
        const todayRecord = data.pending.find((a: any) => {
          const recordDate = new Date(a.date);
          const today = new Date();
          return recordDate.toDateString() === today.toDateString();
        });
        if (todayRecord) {
          setTodayAttendance({ checkInTime: new Date(todayRecord.date).toLocaleTimeString() });
        } else {
          setTodayAttendance(null);
        }
      } else {
        setTodayAttendance(null);
      }
    } catch {
      setTodayAttendance(null);
    } finally {
      setAttendanceLoading(false);
    }
  }, [siteId, user?.id]);

  const fetchMessages = useCallback(async () => {
    // Messages - placeholder for now
    setMessages([]);
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchTodayAttendance(), fetchMessages()]);
    setRefreshing(false);
  }, [fetchTasks, fetchTodayAttendance, fetchMessages]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
    fetchTodayAttendance();
    fetchMessages();
  }, [fetchTasks, fetchTodayAttendance, fetchMessages]);

  const onRefresh = () => {
    refreshAll();
  };

  const handleMarkAttendance = async () => {
    if (!siteId || !user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera access is required for attendance');
      return;
    }
    const locStatus = await Location.requestForegroundPermissionsAsync();
    if (!locStatus.granted) {
      Alert.alert('Permission', 'Location is required for attendance');
      return;
    }
    setMarkingAttendance(true);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) {
        setMarkingAttendance(false);
        return;
      }
      const photoUrl = result.assets[0].uri;
      const res = await fetch(`${API_BASE_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          siteId: siteId,
          photoUri: photoUrl,
          gpsLat: location.coords.latitude,
          gpsLon: location.coords.longitude,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to mark attendance');
      Alert.alert('Success', 'Attendance marked');
      await fetchTodayAttendance();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleMarkTaskComplete = async (taskId: string) => {
    if (!taskId) return;
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await fetchTasks();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleUploadTaskImage = async (taskId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera access required');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      Alert.alert('Success', 'Image uploaded (task image upload endpoint to be implemented)');
      await fetchTasks();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || !siteId || !user?.id || sendingMessage) return;
    setSendingMessage(true);
    setChatInput('');
    try {
      // Message API to be implemented
      Alert.alert('Info', 'Message feature coming soon');
      await fetchMessages();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Send failed');
      setChatInput(text);
    } finally {
      setSendingMessage(false);
    }
  };

  const loadingOverall = loading && !dashboard;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText} allowFontScaling={false}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} allowFontScaling={false}>Manage Site</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {loadingOverall ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={DESIGN.colors.primary} />
            <Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* 1. Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Stats</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue} allowFontScaling={false}>{completedTasks}</Text>
                  <Text style={styles.statLabel} allowFontScaling={false}>Tasks completed</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue} allowFontScaling={false}>{pendingTasks}</Text>
                  <Text style={styles.statLabel} allowFontScaling={false}>Pending tasks</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue} allowFontScaling={false}>{todayAttendance ? 1 : 0}</Text>
                  <Text style={styles.statLabel} allowFontScaling={false}>Today attendance</Text>
                </View>
              </View>
            </View>

            {/* 2. Tasks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Tasks</Text>
              {tasksLoading ? (
                <View style={styles.sectionLoading}>
                  <ActivityIndicator color={DESIGN.colors.primary} />
                </View>
              ) : tasks.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText} allowFontScaling={false}>No tasks assigned</Text>
                </View>
              ) : (
                tasks.map((task) => (
                  <View key={task._id || task.id} style={styles.taskCard}>
                    <View style={styles.taskRow}>
                      <Text style={styles.taskTitle} allowFontScaling={false} numberOfLines={1}>{task.title}</Text>
                      <View style={[styles.badge, task.status === 'completed' && styles.badgeDone]}>
                        <Text style={styles.badgeText} allowFontScaling={false}>{task.status}</Text>
                      </View>
                    </View>
                    {task.description ? (
                      <Text style={styles.taskDesc} allowFontScaling={false} numberOfLines={2}>{task.description}</Text>
                    ) : null}
                    <View style={styles.taskActions}>
                      {task.status !== 'completed' && (
                        <TouchableOpacity
                          style={[styles.smallBtn, updatingTaskId === (task._id || task.id) && styles.btnDisabled]}
                          onPress={() => handleMarkTaskComplete(task._id || task.id || '')}
                          disabled={!!updatingTaskId}
                        >
                          {updatingTaskId === (task._id || task.id) ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.smallBtnText} allowFontScaling={false}>Mark complete</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.smallBtn, styles.smallBtnOutline]}
                        onPress={() => handleUploadTaskImage(task._id || task.id || '')}
                      >
                        <Text style={styles.smallBtnTextOutline} allowFontScaling={false}>Upload image</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 3. Attendance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Attendance</Text>
              {attendanceLoading ? (
                <View style={styles.sectionLoading}>
                  <ActivityIndicator color={DESIGN.colors.primary} />
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.attendanceStatus} allowFontScaling={false}>
                    Today: {todayAttendance ? `Marked at ${todayAttendance.checkInTime ?? '—'}` : 'Not marked'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, markingAttendance && styles.btnDisabled]}
                    onPress={handleMarkAttendance}
                    disabled={markingAttendance}
                  >
                    {markingAttendance ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText} allowFontScaling={false}>Mark attendance</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 4. Chat - Simplified for now */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Chat</Text>
              <View style={styles.empty}>
                <Text style={styles.emptyText} allowFontScaling={false}>Chat feature coming soon</Text>
              </View>
            </View>
          </>
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
  backBtn: { padding: DESIGN.spacing.sm },
  backText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.primary },
  title: { fontSize: DESIGN.typography.title, fontWeight: '700', color: DESIGN.colors.text.primary },
  headerSpacer: { width: 56 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: DESIGN.BASE_PADDING, paddingVertical: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.xl * 3 },
  loadingWrap: { flex: 1, paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary },
  section: { marginBottom: DESIGN.spacing.xl },
  sectionTitle: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  sectionLoading: { paddingVertical: DESIGN.spacing.xl, alignItems: 'center' },
  empty: { paddingVertical: DESIGN.spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.tertiary },
  statsRow: { flexDirection: 'row', gap: DESIGN.spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    ...(Platform.OS === 'android' ? { elevation: 2 } : DESIGN.shadow.sm),
  },
  statValue: { fontSize: 20, fontWeight: '700', color: DESIGN.colors.primary },
  statLabel: { fontSize: DESIGN.typography.caption, color: DESIGN.colors.text.secondary, marginTop: DESIGN.spacing.xs },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    ...(Platform.OS === 'android' ? { elevation: 2 } : DESIGN.shadow.sm),
  },
  taskCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    ...(Platform.OS === 'android' ? { elevation: 2 } : DESIGN.shadow.sm),
  },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.spacing.sm },
  taskTitle: { flex: 1, fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.text.primary },
  taskDesc: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DESIGN.spacing.sm,
    paddingVertical: DESIGN.spacing.xs,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: '#FEF3C7',
  },
  badgeDone: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: DESIGN.colors.text.primary },
  taskActions: { flexDirection: 'row', gap: DESIGN.spacing.sm, flexWrap: 'wrap' },
  smallBtn: {
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.colors.primary,
  },
  smallBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: DESIGN.colors.primary },
  smallBtnText: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: DESIGN.colors.surface },
  smallBtnTextOutline: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: DESIGN.colors.primary },
  btn: {
    borderRadius: DESIGN.radius.sm,
    paddingVertical: DESIGN.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: DESIGN.button.min,
  },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.surface },
  attendanceStatus: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
});
