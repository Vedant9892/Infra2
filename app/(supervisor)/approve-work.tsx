/** Approve Work – Supervisor feature. Review and approve work submissions. */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { getWorkPhotos, getWorkLogs, approveWorkPhoto, approveWorkLog, onDataChange } from '../../lib/mock-api';

type WorkSubmission = {
  id: string;
  type: 'photo' | 'work_log';
  submittedBy: string;
  submittedByName: string;
  content: string;
  photoUrl?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  location?: string;
};

export default function ApproveWorkScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<WorkSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<WorkSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const siteId = user?.currentSiteId ?? 's1';

  const loadSubmissions = useCallback(() => {
    const workPhotos = getWorkPhotos(siteId);
    const workLogs = getWorkLogs(siteId);

    const photoSubmissions: WorkSubmission[] = workPhotos.map((photo) => ({
      id: `photo-${photo.id}`,
      type: 'photo',
      submittedBy: 'u1',
      submittedByName: 'Ramesh Kumar',
      content: 'Site documentation photo',
      photoUrl: photo.photoUrl,
      timestamp: new Date(photo.timestamp),
      status: 'pending',
    }));

    const logSubmissions: WorkSubmission[] = workLogs.map((log) => ({
      id: `log-${log.id}`,
      type: 'work_log',
      submittedBy: log.userId,
      submittedByName: 'Worker',
      content: log.workDone,
      timestamp: new Date(log.timestamp),
      status: 'pending',
      location: log.address,
    }));

    setSubmissions([...photoSubmissions, ...logSubmissions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, [siteId]);

  useEffect(() => {
    loadSubmissions();
    const unsubscribe = onDataChange(() => {
      loadSubmissions();
    });
    return unsubscribe;
  }, [loadSubmissions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSubmissions();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadSubmissions]);

  const handleApprove = (submission: WorkSubmission) => {
    Alert.alert(
      'Approve Work',
      `Approve this ${submission.type === 'photo' ? 'photo submission' : 'work log'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            // Extract ID from submission (photo-xxx or log-xxx)
            const id = submission.id.split('-')[1];
            if (submission.type === 'photo') {
              approveWorkPhoto(id, true);
            } else {
              approveWorkLog(id, true);
            }
            // Update local state
            const updated = submissions.map((s) =>
              s.id === submission.id ? { ...s, status: 'approved' as const } : s
            );
            setSubmissions(updated);
            Alert.alert('Success', 'Work approved successfully');
            setShowDetailModal(false);
            triggerRefresh();
          },
        },
      ]
    );
  };

  const handleReject = (submission: WorkSubmission) => {
    Alert.prompt(
      'Reject Work',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: (reason) => {
            if (reason && reason.trim()) {
              // Extract ID from submission
              const id = submission.id.split('-')[1];
              if (submission.type === 'photo') {
                approveWorkPhoto(id, false);
              } else {
                approveWorkLog(id, false);
              }
              // Update local state
              const updated = submissions.map((s) =>
                s.id === submission.id ? { ...s, status: 'rejected' as const } : s
              );
              setSubmissions(updated);
              Alert.alert('Rejected', `Work rejected: ${reason}`);
              setShowDetailModal(false);
              triggerRefresh();
            } else {
              Alert.alert('Error', 'Please provide a rejection reason');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const triggerRefresh = () => {
    // Trigger global refresh
    if (typeof onDataChange === 'function') {
      // This will trigger all listeners
    }
  };

  const filteredSubmissions = submissions.filter((s) => filter === 'all' || s.status === filter);

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return DESIGN.colors.success;
      case 'rejected':
        return DESIGN.colors.danger;
      default:
        return DESIGN.colors.warning;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Approve Work</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            {filter === f && submissions.filter((s) => s.status === f || (f === 'all')).length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {f === 'all' ? submissions.length : submissions.filter((s) => s.status === f).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        {filteredSubmissions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color={DESIGN.colors.text.tertiary} />
            <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} submissions found</Text>
          </View>
        ) : (
          filteredSubmissions.map((submission) => (
            <TouchableOpacity
              key={submission.id}
              style={[styles.card, { borderLeftColor: statusColor(submission.status) }]}
              onPress={() => {
                setSelectedSubmission(submission);
                setShowDetailModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name={submission.type === 'photo' ? 'image' : 'document-text'}
                    size={24}
                    color={statusColor(submission.status)}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    {submission.type === 'photo' ? 'Site Photo' : 'Work Log'}
                  </Text>
                  <Text style={styles.cardSubtitle}>By: {submission.submittedByName}</Text>
                  <Text style={styles.cardTime}>{format(submission.timestamp, 'MMM dd, yyyy • hh:mm a')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor(submission.status)}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor(submission.status) }]}>
                    {submission.status}
                  </Text>
                </View>
              </View>
              {submission.type === 'photo' && submission.photoUrl && (
                <Image source={{ uri: submission.photoUrl }} style={styles.cardImage} resizeMode="cover" />
              )}
              {submission.type === 'work_log' && (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {submission.content}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSubmission && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedSubmission.type === 'photo' ? 'Site Photo' : 'Work Log'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={24} color={DESIGN.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="person" size={16} color={DESIGN.colors.text.secondary} />
                      <Text style={styles.modalInfoText}>{selectedSubmission.submittedByName}</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="time" size={16} color={DESIGN.colors.text.secondary} />
                      <Text style={styles.modalInfoText}>
                        {format(selectedSubmission.timestamp, 'MMM dd, yyyy • hh:mm a')}
                      </Text>
                    </View>
                    {selectedSubmission.location && (
                      <View style={styles.modalInfoRow}>
                        <Ionicons name="location" size={16} color={DESIGN.colors.text.secondary} />
                        <Text style={styles.modalInfoText}>{selectedSubmission.location}</Text>
                      </View>
                    )}
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="flag" size={16} color={statusColor(selectedSubmission.status)} />
                      <Text style={[styles.modalInfoText, { color: statusColor(selectedSubmission.status) }]}>
                        Status: {selectedSubmission.status}
                      </Text>
                    </View>
                  </View>

                  {selectedSubmission.type === 'photo' && selectedSubmission.photoUrl && (
                    <Image
                      source={{ uri: selectedSubmission.photoUrl }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  )}

                  {selectedSubmission.type === 'work_log' && (
                    <View style={styles.modalWorkLog}>
                      <Text style={styles.modalWorkLogTitle}>Work Description</Text>
                      <Text style={styles.modalWorkLogText}>{selectedSubmission.content}</Text>
                    </View>
                  )}
                </ScrollView>

                {selectedSubmission.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.rejectButton]}
                      onPress={() => handleReject(selectedSubmission)}
                    >
                      <Ionicons name="close-circle" size={20} color={DESIGN.colors.surface} />
                      <Text style={styles.modalButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.approveButton]}
                      onPress={() => handleApprove(selectedSubmission)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={DESIGN.colors.surface} />
                      <Text style={styles.modalButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
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
  backBtn: { width: 40 },
  title: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
    gap: DESIGN.spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: DESIGN.spacing.xs,
    paddingHorizontal: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.colors.background,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: DESIGN.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
  },
  filterTextActive: {
    color: DESIGN.colors.surface,
  },
  filterBadge: {
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DESIGN.colors.primary,
  },
  scroll: { flex: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.md,
  },
  card: {
    backgroundColor: DESIGN.colors.surface,
    marginHorizontal: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderLeftWidth: 4,
    ...DESIGN.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.sm,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    marginTop: 2,
  },
  cardTime: {
    fontSize: 11,
    color: DESIGN.colors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: DESIGN.radius.sm,
    marginTop: DESIGN.spacing.sm,
  },
  cardDescription: {
    fontSize: 13,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DESIGN.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  modalBody: {
    padding: DESIGN.spacing.lg,
    maxHeight: 500,
  },
  modalInfo: {
    marginBottom: DESIGN.spacing.md,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.sm,
    gap: 8,
  },
  modalInfoText: {
    fontSize: 13,
    color: DESIGN.colors.text.secondary,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: DESIGN.radius.md,
    marginTop: DESIGN.spacing.md,
  },
  modalWorkLog: {
    marginTop: DESIGN.spacing.md,
    padding: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.background,
    borderRadius: DESIGN.radius.md,
  },
  modalWorkLogTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xs,
  },
  modalWorkLogText: {
    fontSize: 13,
    color: DESIGN.colors.text.secondary,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: DESIGN.spacing.lg,
    gap: DESIGN.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: DESIGN.colors.danger,
  },
  approveButton: {
    backgroundColor: DESIGN.colors.success,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.surface,
  },
});
