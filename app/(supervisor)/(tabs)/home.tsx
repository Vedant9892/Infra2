import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { DashboardHeader } from '../../../components/DashboardHeader';
import { DashboardQuickActions, type QuickAction } from '../../../components/DashboardQuickActions';
import { DashboardDateStrip } from '../../../components/DashboardDateStrip';
import { DashboardYourTasks } from '../../../components/DashboardYourTasks';
import { getAttendancePending, approveAttendance, onDataChange } from '../../../lib/mock-api';

export default function SupervisorHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [showPendingAttendanceModal, setShowPendingAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const siteId = user?.currentSiteId ?? 's1';

  const fetchPendingAttendance = useCallback(() => {
    setLoading(true);
    const list = getAttendancePending(siteId);
    setPendingAttendance(list.map((a) => ({ id: a.id, userId: a.userId, address: a.address, timestamp: a.timestamp, date: a.timestamp, status: a.status })));
    setLoading(false);
    setRefreshing(false);
  }, [siteId]);

  // Auto-refresh when data changes (cross-dashboard communication)
  useEffect(() => {
    fetchPendingAttendance();
    const unsubscribe = onDataChange(() => {
      fetchPendingAttendance();
    });
    return unsubscribe;
  }, [fetchPendingAttendance]);

  useEffect(() => {
    fetchPendingAttendance();
    const unsubscribe = onDataChange(() => {
      fetchPendingAttendance();
    });
    return unsubscribe;
  }, [fetchPendingAttendance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingAttendance();
  };

  const handleApproveAttendance = (attendanceId: string, approved: boolean) => {
    try {
      approveAttendance(attendanceId, approved);
      Alert.alert('Success', approved ? 'Attendance approved' : 'Attendance rejected');
      fetchPendingAttendance();
    } catch {
      Alert.alert('Error', 'Failed to update attendance.');
    }
  };

  const actions: QuickAction[] = [
    {
      id: 'projects',
      icon: 'folder',
      title: 'My Projects',
      subtitle: 'View all projects',
      color: '#8B5CF6',
      onPress: () => router.push('/(supervisor)/projects'),
    },
    {
      id: 'approve',
      icon: 'document-text',
      title: 'Approve Work',
      subtitle: 'Site photos & documentation',
      color: '#3B82F6',
      onPress: () => router.push('/(supervisor)/approve-work'),
    },
    {
      id: 'assign',
      icon: 'people',
      title: 'Assigned Task',
      subtitle: 'Delegate to labour',
      color: '#10B981',
      onPress: () => router.push('/(supervisor)/(tabs)/tasks'),
    },
    {
      id: 'scan-qr',
      icon: 'qr-code',
      title: 'Scan Site QR',
      subtitle: 'Join site via QR code',
      color: '#F59E0B',
      onPress: () => router.push('/scan-qr'),
    },
    {
      id: 'access',
      icon: 'shield-checkmark',
      title: 'Access Control',
      subtitle: 'Manage permissions',
      color: '#EF4444',
      onPress: () => router.push('/(supervisor)/access-control'),
    },
    {
      id: 'face-attendance',
      icon: 'scan',
      title: 'Face Recognition',
      subtitle: 'Mark attendance',
      color: '#3B82F6',
      onPress: () => router.push(`/(supervisor)/face-attendance/${siteId}`),
    },
    {
      id: 'verify',
      icon: 'checkmark-circle',
      title: 'Verify Attendance',
      subtitle: `${pendingAttendance.length} pending`,
      color: '#8B5CF6',
      onPress: () => {
        setShowPendingAttendanceModal(true);
        fetchPendingAttendance();
      },
    },
    {
      id: 'stock',
      icon: 'cube',
      title: 'Stock Tracking',
      subtitle: 'Manage inventory',
      color: '#10B981',
      onPress: () => router.push(`/(supervisor)/stock/${siteId}`),
    },
    {
      id: 'bills',
      icon: 'receipt',
      title: 'GST Billing',
      subtitle: 'Track expenses',
      color: '#8B5CF6',
      onPress: () => router.push(`/(supervisor)/bills/${siteId}`),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <DashboardHeader
          name={user?.name || 'Supervisor'}
          role="SUPERVISOR"
          profilePhoto={user?.profilePhoto}
        />
        <DashboardQuickActions title="Quick Actions" actions={actions} />
        <DashboardDateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          numDays={7}
          offset={3}
        />
        <DashboardYourTasks
          title="Your Tasks"
          pendingLabel="Pending"
          showPendingTag={true}
          pendingCount={pendingAttendance.length}
        >
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={DESIGN.colors.primary} />
              <Text style={styles.emptyStateText}>Loading…</Text>
            </View>
          ) : pendingAttendance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No pending attendance requests</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {pendingAttendance.slice(0, 5).map((attendance: any) => (
                <TouchableOpacity
                  key={attendance.id}
                  style={styles.activityItem}
                  onPress={() => setShowPendingAttendanceModal(true)}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons name="time" size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Attendance Request</Text>
                    <Text style={styles.activitySubtitle}>
                      Worker ID: {attendance.userId} • {format(new Date(attendance.date ?? attendance.timestamp), 'MMM dd, hh:mm a')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </DashboardYourTasks>
      </ScrollView>

      <Modal
        visible={showPendingAttendanceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPendingAttendanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pending Attendance Approvals</Text>
              <TouchableOpacity onPress={() => setShowPendingAttendanceModal(false)}>
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {loading ? (
                <ActivityIndicator size="large" color={DESIGN.colors.primary} style={styles.loader} />
              ) : pendingAttendance.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No pending attendance requests</Text>
                </View>
              ) : (
                pendingAttendance.map((attendance: any) => (
                  <View key={attendance.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        {attendance.photoUri && 
                         attendance.photoUri !== '' && 
                         !attendance.photoUri.startsWith('mock://') && (
                          <Image source={{ uri: attendance.photoUri }} style={styles.attendancePhoto} />
                        )}
                        <View style={styles.requestDetails}>
                          <Text style={styles.requestMaterial}>Worker ID: {attendance.userId}</Text>
                          <Text style={styles.requestQuantity}>
                            {format(new Date(attendance.date ?? attendance.timestamp), 'MMM dd, hh:mm a')}
                          </Text>
                          {attendance.shiftSlot && (
                            <Text style={styles.metaText}>Shift: {attendance.shiftSlot}</Text>
                          )}
                          {attendance.gpsLat != null && attendance.gpsLon != null && (
                            <Text style={styles.metaText}>
                              📍 {parseFloat(attendance.gpsLat).toFixed(4)}, {parseFloat(attendance.gpsLon).toFixed(4)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleApproveAttendance(attendance.id, false)}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveAttendance(attendance.id, true)}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  activityList: {
    gap: DESIGN.spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    marginBottom: DESIGN.spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: DESIGN.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingBottom: DESIGN.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  modalBody: {
    padding: DESIGN.spacing.lg,
  },
  requestCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  requestHeader: {
    marginBottom: DESIGN.spacing.md,
  },
  requestInfo: {
    flexDirection: 'row',
  },
  attendancePhoto: {
    width: 60,
    height: 60,
    borderRadius: DESIGN.radius.sm,
    marginRight: DESIGN.spacing.md,
  },
  requestDetails: {
    flex: 1,
  },
  requestMaterial: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    marginBottom: 4,
  },
  requestQuantity: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
    marginTop: 2,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: DESIGN.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  approveButton: {
    backgroundColor: DESIGN.colors.primary,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loader: {
    paddingVertical: DESIGN.spacing.xl,
  },
});
