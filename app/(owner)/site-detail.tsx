import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SiteCodeManagement from '../../mobile-components/SiteCodeManagement';

type Worker = {
  id: string;
  name: string;
  phone: string;
  role: string;
  enrolledAt: string;
  verified: boolean;
  photoUri?: string;
};

type PendingEnrollment = {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerRole: string;
  enrolledAt: string;
  enrollmentCode: string;
};

export default function SiteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'pending' | 'settings'>('overview');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sample site data (fetch from API in production)
  const site = {
    id,
    name: 'Mumbai Residential Complex',
    location: 'Andheri West, Mumbai',
    status: 'active',
    progress: 67,
    workersCount: 45,
    budget: '₹2.5 Cr',
  };

  useEffect(() => {
    fetchSiteData();
  }, [id]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      
      // Fetch workers
      const workersRes = await fetch(`http://localhost:3000/api/sites/${id}/workers`);
      if (workersRes.ok) {
        const data = await workersRes.json();
        setWorkers(data.workers);
      }

      // Fetch pending enrollments
      const pendingRes = await fetch(`http://localhost:3000/api/enrollment/site/${id}/pending`);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingEnrollments(data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching site data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSiteData();
    setRefreshing(false);
  };

  const handleVerifyEnrollment = async (enrollmentId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/enrollment/verify/${enrollmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        Alert.alert('Success', 'Worker verified successfully');
        fetchSiteData(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to verify worker');
      }
    } catch (error) {
      console.error('Verify error:', error);
      Alert.alert('Error', 'Failed to verify worker');
    }
  };

  const handleRejectEnrollment = async (enrollmentId: string, workerId: string) => {
    Alert.alert(
      'Reject Enrollment',
      'Are you sure you want to reject this worker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch('http://localhost:3000/api/enrollment/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  workerId,
                  siteId: id,
                  reason: 'Rejected during verification',
                }),
              });

              if (response.ok) {
                Alert.alert('Success', 'Enrollment rejected');
                fetchSiteData();
              }
            } catch (error) {
              console.error('Reject error:', error);
              Alert.alert('Error', 'Failed to reject enrollment');
            }
          },
        },
      ]
    );
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Site Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#8B5CF6" />
          <Text style={styles.statValue}>{site.workersCount}</Text>
          <Text style={styles.statLabel}>Workers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
          <Text style={styles.statValue}>{site.progress}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{site.budget}</Text>
          <Text style={styles.statLabel}>Budget</Text>
        </View>
      </View>

      {/* Enrollment Code Management */}
      <SiteCodeManagement siteId={id} siteName={site.name} />

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="cube" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Materials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="images" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="bar-chart" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderWorkers = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>All Workers ({workers.length})</Text>
      {workers.map((worker) => (
        <View key={worker.id} style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            {worker.photoUri ? (
              <Image source={{ uri: worker.photoUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={32} color="#8B5CF6" />
            )}
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerRole}>{worker.role}</Text>
            <Text style={styles.workerPhone}>{worker.phone}</Text>
          </View>
          {worker.verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={20} color="#F59E0B" />
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderPendingEnrollments = () => (
    <View style={styles.tabContent}>
      <View style={styles.pendingHeader}>
        <Text style={styles.sectionTitle}>
          Pending Verifications ({pendingEnrollments.length})
        </Text>
        {pendingEnrollments.length > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingEnrollments.length}</Text>
          </View>
        )}
      </View>

      {pendingEnrollments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>No pending enrollments to review</Text>
        </View>
      ) : (
        pendingEnrollments.map((enrollment) => (
          <View key={enrollment.id} style={styles.enrollmentCard}>
            <View style={styles.enrollmentHeader}>
              <View>
                <Text style={styles.enrollmentName}>{enrollment.workerName}</Text>
                <Text style={styles.enrollmentRole}>{enrollment.workerRole}</Text>
                <Text style={styles.enrollmentPhone}>{enrollment.workerPhone}</Text>
                <Text style={styles.enrollmentDate}>
                  Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.enrollmentCodeBadge}>
                <Text style={styles.enrollmentCode}>{enrollment.enrollmentCode}</Text>
              </View>
            </View>

            <View style={styles.enrollmentActions}>
              <TouchableOpacity
                style={[styles.enrollmentButton, styles.verifyButton]}
                onPress={() => handleVerifyEnrollment(enrollment.id)}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.enrollmentButton, styles.rejectButton]}
                onPress={() => handleRejectEnrollment(enrollment.id, enrollment.workerId)}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Site Settings</Text>
      
      <View style={styles.settingCard}>
        <Ionicons name="location" size={24} color="#8B5CF6" />
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Site Location</Text>
          <Text style={styles.settingValue}>{site.location}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingCard}>
        <Ionicons name="business" size={24} color="#8B5CF6" />
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Project Status</Text>
          <Text style={styles.settingValue}>{site.status}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingCard}>
        <Ionicons name="people" size={24} color="#8B5CF6" />
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Manage Workers</Text>
          <Text style={styles.settingValue}>Add, remove, or update workers</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dangerButton}>
        <Ionicons name="trash" size={20} color="#EF4444" />
        <Text style={styles.dangerButtonText}>Delete Site</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{site.name}</Text>
          <Text style={styles.headerSubtitle}>{site.location}</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="home"
            size={20}
            color={activeTab === 'overview' ? '#8B5CF6' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'workers' && styles.tabActive]}
          onPress={() => setActiveTab('workers')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'workers' ? '#8B5CF6' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'workers' && styles.tabTextActive]}>
            Workers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <View>
            <Ionicons
              name="time"
              size={20}
              color={activeTab === 'pending' ? '#8B5CF6' : '#9CA3AF'}
            />
            {pendingEnrollments.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingEnrollments.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#8B5CF6' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'workers' && renderWorkers()}
        {activeTab === 'pending' && renderPendingEnrollments()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  actionsSection: {
    marginTop: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  workerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  workerRole: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 2,
  },
  workerPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  enrollmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  enrollmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  enrollmentRole: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  enrollmentPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  enrollmentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  enrollmentCodeBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
  },
  enrollmentCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 2,
  },
  enrollmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  enrollmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
