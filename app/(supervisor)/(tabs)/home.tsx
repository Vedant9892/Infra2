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
import { API_BASE_URL } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';

export default function SupervisorHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [showPendingAttendanceModal, setShowPendingAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending attendance for supervisor approval
  const fetchPendingAttendance = useCallback(async () => {
    if (!user?.id || !user?.currentSiteId) {
      setPendingAttendance([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/attendance/pending?siteId=${user.currentSiteId}&supervisorId=${user.id}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setPendingAttendance(data.pending || []);
      } else {
        setPendingAttendance([]);
      }
    } catch (error) {
      console.error('Fetch pending attendance error:', error);
      setPendingAttendance([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.currentSiteId]);

  useEffect(() => {
    fetchPendingAttendance();
  }, [fetchPendingAttendance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingAttendance();
  };

  // Approve or reject attendance
  const handleApproveAttendance = async (attendanceId: number, approved: boolean) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/${attendanceId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: approved,
          supervisorId: Number(user.id),
          reason: approved ? undefined : 'Rejected by supervisor',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', data.message || (approved ? 'Attendance approved' : 'Attendance rejected'));
        fetchPendingAttendance(); // Refresh list
      } else {
        Alert.alert('Error', data.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Approve attendance error:', error);
      Alert.alert('Error', 'Failed to update attendance. Please try again.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const features = [
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
      id: 'assign',
      icon: 'people',
      title: 'Assign Tasks',
      subtitle: 'Delegate to labour',
      color: '#10B981',
      onPress: () => {
        router.push('/(supervisor)/(tabs)/tasks');
      },
    },
    {
      id: 'approve',
      icon: 'document-text',
      title: 'Approve Work',
      subtitle: 'Site photos & documentation',
      color: '#3B82F6',
      onPress: () => {
        Alert.alert('Coming Soon', 'Work approval feature will be available soon');
      },
    },
    {
      id: 'access',
      icon: 'shield-checkmark',
      title: 'Access Control',
      subtitle: 'Manage permissions',
      color: '#EF4444',
      onPress: () => {
        Alert.alert('Coming Soon', 'Access control feature will be available soon');
      },
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </Text>
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Supervisor'}</Text>
              <Text style={styles.role}>Site Supervisor</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.statValue}>{pendingAttendance.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="clipboard" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[styles.featureCard, { borderLeftColor: feature.color }]}
                onPress={feature.onPress}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                  <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {pendingAttendance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No pending attendance requests</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {pendingAttendance.slice(0, 3).map((attendance: any) => (
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
                      Worker ID: {attendance.userId} • {format(new Date(attendance.date), 'MMM dd, hh:mm a')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pending Attendance Modal */}
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
                        {attendance.photoUri && (
                          <Image source={{ uri: attendance.photoUri }} style={styles.attendancePhoto} />
                        )}
                        <View style={styles.requestDetails}>
                          <Text style={styles.requestMaterial}>Worker ID: {attendance.userId}</Text>
                          <Text style={styles.requestQuantity}>
                            {format(new Date(attendance.date), 'MMM dd, hh:mm a')}
                          </Text>
                          {attendance.shiftSlot && (
                            <Text style={styles.metaText}>Shift: {attendance.shiftSlot}</Text>
                          )}
                          {attendance.gpsLat && attendance.gpsLon && (
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.md,
    paddingBottom: DESIGN.spacing.lg,
    backgroundColor: DESIGN.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.md,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: DESIGN.colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginBottom: 2,
  },
  role: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    gap: DESIGN.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginTop: DESIGN.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
    marginTop: DESIGN.spacing.xs,
  },
  featuresContainer: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginBottom: DESIGN.spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN.spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
  },
  activityContainer: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    paddingBottom: DESIGN.spacing.xl,
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
    color: DESIGN.colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    color: DESIGN.colors.textSecondary,
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
    color: DESIGN.colors.text,
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
    color: DESIGN.colors.text,
    marginBottom: 4,
  },
  requestQuantity: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11,
    color: DESIGN.colors.textSecondary,
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
