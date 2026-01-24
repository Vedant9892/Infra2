/** Supervisor Projects – View projects and labour reports */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { getSitesForOwner, getWorkLogs, getWorkPhotos, getAttendancePending, onDataChange } from '../../lib/mock-api';

type Project = {
  id: string;
  name: string;
  address?: string;
  status: 'active' | 'completed';
  labourCount: number;
  pendingReports: number;
  lastActivity: Date;
};

type LabourReport = {
  id: string;
  labourName: string;
  labourId: string;
  type: 'work_log' | 'photo' | 'attendance';
  content: string;
  photoUrl?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
};

export default function SupervisorProjectsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<LabourReport[]>([]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const loadProjects = useCallback(() => {
    // Get all sites (supervisor can see all projects)
    const sites = getSitesForOwner(user?.id ?? 'owner1');
    
    const projectsData: Project[] = sites.map((site) => {
      const workLogs = getWorkLogs(site.id);
      const workPhotos = getWorkPhotos(site.id);
      const attendance = getAttendancePending(site.id);
      
      // Get unique labour IDs
      const labourIds = new Set([
        ...workLogs.map((w) => w.userId),
        ...workPhotos.map((p) => p.userId || ''),
        ...attendance.map((a) => a.userId),
      ]);
      labourIds.delete('');
      
      // Count pending reports
      const pendingCount = attendance.filter((a) => a.status === 'pending').length;
      
      // Get last activity
      const allTimestamps = [
        ...workLogs.map((w) => new Date(w.timestamp)),
        ...workPhotos.map((p) => new Date(p.timestamp)),
        ...attendance.map((a) => new Date(a.timestamp)),
      ];
      const lastActivity = allTimestamps.length > 0 
        ? new Date(Math.max(...allTimestamps.map((d) => d.getTime())))
        : new Date();
      
      return {
        id: site.id,
        name: site.name,
        address: site.address,
        status: site.status as 'active' | 'completed',
        labourCount: labourIds.size,
        pendingReports: pendingCount,
        lastActivity,
      };
    });
    
    setProjects(projectsData.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()));
  }, [user?.id]);

  const loadReports = useCallback((projectId: string) => {
    const workLogs = getWorkLogs(projectId);
    const workPhotos = getWorkPhotos(projectId);
    const attendance = getAttendancePending(projectId);
    
    const reportsData: LabourReport[] = [
      ...workLogs.map((log) => ({
        id: `log-${log.id}`,
        labourName: 'Worker',
        labourId: log.userId,
        type: 'work_log' as const,
        content: log.workDone,
        timestamp: new Date(log.timestamp),
        status: 'pending' as const,
      })),
      ...workPhotos.map((photo) => ({
        id: `photo-${photo.id}`,
        labourName: 'Worker',
        labourId: photo.userId || '',
        type: 'photo' as const,
        content: 'Site documentation photo',
        photoUrl: photo.photoUrl,
        timestamp: new Date(photo.timestamp),
        status: 'pending' as const,
      })),
      ...attendance.map((att) => ({
        id: `att-${att.id}`,
        labourName: 'Worker',
        labourId: att.userId,
        type: 'attendance' as const,
        content: `Attendance marked at ${att.address}`,
        timestamp: new Date(att.timestamp),
        status: att.status as 'pending' | 'approved' | 'rejected',
      })),
    ];
    
    setReports(reportsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, []);

  useEffect(() => {
    loadProjects();
    const unsubscribe = onDataChange(() => {
      loadProjects();
      if (selectedProject) {
        loadReports(selectedProject.id);
      }
    });
    return unsubscribe;
  }, [loadProjects, selectedProject]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProjects();
    if (selectedProject) {
      loadReports(selectedProject.id);
    }
    setTimeout(() => setRefreshing(false), 500);
  }, [loadProjects, selectedProject, loadReports]);

  const handleViewReports = (project: Project) => {
    setSelectedProject(project);
    loadReports(project.id);
    setShowReportsModal(true);
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    return true;
  });

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

  const typeIcon = (type: string) => {
    switch (type) {
      case 'work_log':
        return 'document-text';
      case 'photo':
        return 'image';
      case 'attendance':
        return 'location';
      default:
        return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>My Projects</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        {projects.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-outline" size={64} color={DESIGN.colors.text.tertiary} />
            <Text style={styles.emptyText}>No projects found</Text>
            <Text style={styles.emptySubtext}>Projects will appear here when labours join sites</Text>
          </View>
        ) : (
          projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, { borderLeftColor: project.status === 'active' ? DESIGN.colors.success : DESIGN.colors.text.tertiary }]}
              onPress={() => handleViewReports(project)}
              activeOpacity={0.7}
            >
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  {project.address && (
                    <Text style={styles.projectAddress}>
                      <Ionicons name="location" size={12} color={DESIGN.colors.text.secondary} /> {project.address}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: project.status === 'active' ? `${DESIGN.colors.success}20` : `${DESIGN.colors.text.tertiary}20` }]}>
                  <Text style={[styles.statusText, { color: project.status === 'active' ? DESIGN.colors.success : DESIGN.colors.text.tertiary }]}>
                    {project.status}
                  </Text>
                </View>
              </View>

              <View style={styles.projectStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color={DESIGN.colors.primary} />
                  <Text style={styles.statValue}>{project.labourCount}</Text>
                  <Text style={styles.statLabel}>Labours</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="document-text" size={16} color={DESIGN.colors.warning} />
                  <Text style={styles.statValue}>{project.pendingReports}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color={DESIGN.colors.text.secondary} />
                  <Text style={styles.statValue}>{format(project.lastActivity, 'MMM dd')}</Text>
                  <Text style={styles.statLabel}>Last Activity</Text>
                </View>
              </View>

              <View style={styles.viewReportsButton}>
                <Text style={styles.viewReportsText}>View Labour Reports</Text>
                <Ionicons name="chevron-forward" size={20} color={DESIGN.colors.primary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Reports Modal */}
      <Modal
        visible={showReportsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedProject?.name}</Text>
                <Text style={styles.modalSubtitle}>Labour Reports</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReportsModal(false)}>
                <Ionicons name="close" size={24} color={DESIGN.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              {(['all', 'pending', 'approved'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterTab, filter === f && styles.filterTabActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.reportsList}>
              {filteredReports.length === 0 ? (
                <View style={styles.emptyReports}>
                  <Ionicons name="document-outline" size={48} color={DESIGN.colors.text.tertiary} />
                  <Text style={styles.emptyReportsText}>No {filter === 'all' ? '' : filter} reports found</Text>
                </View>
              ) : (
                filteredReports.map((report) => (
                  <View
                    key={report.id}
                    style={[styles.reportCard, { borderLeftColor: statusColor(report.status) }]}
                  >
                    <View style={styles.reportHeader}>
                      <View style={styles.reportIcon}>
                        <Ionicons name={typeIcon(report.type) as any} size={20} color={statusColor(report.status)} />
                      </View>
                      <View style={styles.reportContent}>
                        <Text style={styles.reportType}>
                          {report.type === 'work_log' ? 'Work Log' : report.type === 'photo' ? 'Photo' : 'Attendance'}
                        </Text>
                        <Text style={styles.reportLabour}>{report.labourName}</Text>
                        <Text style={styles.reportTime}>{format(report.timestamp, 'MMM dd, yyyy • hh:mm a')}</Text>
                      </View>
                      <View style={[styles.reportBadge, { backgroundColor: `${statusColor(report.status)}20` }]}>
                        <Text style={[styles.reportBadgeText, { color: statusColor(report.status) }]}>
                          {report.status}
                        </Text>
                      </View>
                    </View>
                    {report.type === 'photo' && 
                     report.photoUrl && 
                     report.photoUrl !== '' && 
                     !report.photoUrl.startsWith('mock://') && (
                      <Image source={{ uri: report.photoUrl }} style={styles.reportImage} resizeMode="cover" />
                    )}
                    {report.type === 'work_log' && (
                      <Text style={styles.reportDescription} numberOfLines={3}>
                        {report.content}
                      </Text>
                    )}
                    {report.type === 'attendance' && (
                      <Text style={styles.reportDescription}>{report.content}</Text>
                    )}
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
  scroll: { flex: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    color: DESIGN.colors.text.tertiary,
    marginTop: DESIGN.spacing.xs,
  },
  projectCard: {
    backgroundColor: DESIGN.colors.surface,
    marginHorizontal: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderLeftWidth: 4,
    ...DESIGN.shadow.sm,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN.spacing.md,
  },
  projectInfo: { flex: 1 },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  projectAddress: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    marginTop: 4,
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
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: DESIGN.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DESIGN.colors.border,
    marginBottom: DESIGN.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
    marginTop: 2,
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.sm,
    backgroundColor: `${DESIGN.colors.primary}10`,
    borderRadius: DESIGN.radius.sm,
    gap: 4,
  },
  viewReportsText: {
    fontSize: 13,
    fontWeight: '600',
    color: DESIGN.colors.primary,
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
  modalSubtitle: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    gap: DESIGN.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: DESIGN.spacing.xs,
    paddingHorizontal: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.colors.background,
    alignItems: 'center',
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
  reportsList: {
    padding: DESIGN.spacing.lg,
    maxHeight: 500,
  },
  emptyReports: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl,
  },
  emptyReportsText: {
    fontSize: 14,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.md,
  },
  reportCard: {
    backgroundColor: DESIGN.colors.background,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.sm,
    borderLeftWidth: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.xs,
  },
  reportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DESIGN.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.sm,
  },
  reportContent: { flex: 1 },
  reportType: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    textTransform: 'capitalize',
  },
  reportLabour: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
    marginTop: 2,
  },
  reportTime: {
    fontSize: 10,
    color: DESIGN.colors.text.tertiary,
    marginTop: 2,
  },
  reportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reportBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportImage: {
    width: '100%',
    height: 150,
    borderRadius: DESIGN.radius.sm,
    marginTop: DESIGN.spacing.sm,
  },
  reportDescription: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.xs,
    lineHeight: 18,
  },
});
