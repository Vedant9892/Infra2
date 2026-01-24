import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';

export default function SupervisorAttendanceScreen() {
  const { user } = useUser();
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingAttendance = useCallback(async () => {
    if (!user?.id || !user?.currentSiteId) {
      setPendingAttendance([]);
      setLoading(false);
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
        fetchPendingAttendance();
      } else {
        Alert.alert('Error', data.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Approve attendance error:', error);
      Alert.alert('Error', 'Failed to update attendance. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Approval</Text>
        <Text style={styles.headerSubtitle}>
          {pendingAttendance.length} pending request{pendingAttendance.length !== 1 ? 's' : ''}
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
          {pendingAttendance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
              <Text style={styles.emptyStateText}>
                All attendance requests have been processed
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {pendingAttendance.map((attendance: any) => (
                <View key={attendance.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    {attendance.photoUri && (
                      <Image source={{ uri: attendance.photoUri }} style={styles.photo} />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.workerId}>Worker ID: {attendance.userId}</Text>
                      <Text style={styles.timestamp}>
                        {format(new Date(attendance.date), 'MMM dd, yyyy • hh:mm a')}
                      </Text>
                      {attendance.shiftSlot && (
                        <View style={styles.shiftBadge}>
                          <Text style={styles.shiftText}>{attendance.shiftSlot}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {attendance.gpsLat && attendance.gpsLon && (
                    <View style={styles.locationInfo}>
                      <Ionicons name="location" size={16} color={DESIGN.colors.textSecondary} />
                      <Text style={styles.locationText}>
                        {parseFloat(attendance.gpsLat).toFixed(4)}, {parseFloat(attendance.gpsLon).toFixed(4)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleApproveAttendance(attendance.id, false)}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApproveAttendance(attendance.id, true)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
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
    marginBottom: DESIGN.spacing.md,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: DESIGN.radius.sm,
    marginRight: DESIGN.spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  workerId: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.colors.text,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
    marginBottom: 8,
  },
  shiftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shiftText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.md,
    paddingTop: DESIGN.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  locationText: {
    fontSize: 12,
    color: DESIGN.colors.textSecondary,
    marginLeft: 4,
  },
  actions: {
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
