/** Supervisor Attendance – mock API only. No backend. */
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
import { format } from 'date-fns';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getAttendancePending, approveAttendance, onDataChange } from '../../../lib/mock-api';

export default function SupervisorAttendanceScreen() {
  const { user } = useUser();
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const siteId = user?.currentSiteId ?? 's1';

  const fetchPendingAttendance = useCallback(() => {
    setLoading(true);
    const list = getAttendancePending(siteId);
    setPendingAttendance(
      list.map((a) => ({
        id: a.id,
        userId: a.userId,
        address: a.address,
        timestamp: a.timestamp,
        date: a.timestamp,
        status: a.status,
      }))
    );
    setLoading(false);
    setRefreshing(false);
  }, [siteId]);

  useEffect(() => {
    fetchPendingAttendance();
    // Auto-refresh when data changes
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
        >
          {pendingAttendance.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
              <Text style={styles.emptyStateText}>All attendance requests have been processed</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {pendingAttendance.map((attendance: any) => (
                <View key={attendance.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.workerId}>Worker ID: {attendance.userId}</Text>
                      <Text style={styles.timestamp}>
                        {format(new Date(attendance.date ?? attendance.timestamp), 'MMM dd, yyyy • hh:mm a')}
                      </Text>
                      {attendance.address ? (
                        <Text style={styles.addressText}>📍 {attendance.address}</Text>
                      ) : null}
                    </View>
                  </View>
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
  cardHeader: { marginBottom: DESIGN.spacing.md },
  cardInfo: { flex: 1 },
  workerId: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary },
  timestamp: { fontSize: 14, color: DESIGN.colors.text.secondary, marginTop: 4 },
  addressText: { fontSize: 13, color: DESIGN.colors.text.tertiary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: DESIGN.spacing.md, marginTop: DESIGN.spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: DESIGN.radius.sm },
  rejectButton: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  approveButton: { backgroundColor: DESIGN.colors.primary },
  rejectButtonText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  approveButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: DESIGN.spacing.xl * 2 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary, marginTop: 16 },
  emptyStateText: { fontSize: 14, color: DESIGN.colors.text.secondary, textAlign: 'center', marginTop: 8 },
});
