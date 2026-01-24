import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../contexts/UserContext';
import { API_BASE_URL } from '../../constants/api';

type Site = {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  address: string;
  projectType: string;
  status: 'active' | 'completed' | 'on-hold';
  workersCount: number;
  progress: number;
  budget: string;
  startDate: Date;
};

export default function Sites() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sites from database
  const fetchSites = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/sites/owner/${user.id}`);
      const data = await response.json();

      console.log('📡 Sites API Response:', JSON.stringify(data, null, 2));

      if (data.success && data.sites) {
        console.log(`✅ Loaded ${data.sites.length} sites`);
        setSites(data.sites);
      } else {
        console.error('❌ Failed to load sites:', data.message || 'Unknown error');
        Alert.alert('Error', data.message || 'Failed to load sites');
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSites();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#8B5CF6';
      case 'on-hold':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'residential':
        return 'home';
      case 'commercial':
        return 'business';
      case 'industrial':
        return 'construct';
      case 'infrastructure':
        return 'git-network';
      default:
        return 'hammer';
    }
  };

  const handleSitePress = (site: Site) => {
    // Navigate to site dashboard
    router.push(`/(owner)/site/${site.id}`);
  };

  const handleAddSite = () => {
    router.push('/(owner)/create-site');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtitle} allowFontScaling={false}>Construction Sites</Text>
            <Text style={styles.headerTitle} allowFontScaling={false}>My Sites</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/(owner)/profile')}
            >
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddSite}>
              <Ionicons name="add" size={24} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{sites.length}</Text>
            <Text style={styles.statLabel}>Total Sites</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {sites.filter(s => s.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {sites.reduce((sum, s) => sum + s.workersCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sites List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Sites Yet</Text>
            <Text style={styles.emptyText}>
              Register your first construction site to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddSite}>
              <Text style={styles.emptyButtonText}>Register Site</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sites.map((site) => (
            <TouchableOpacity
              key={site.id}
              style={styles.siteCard}
              onPress={() => handleSitePress(site)}
              activeOpacity={0.7}
            >
              {/* Site Header */}
              <View style={styles.siteHeader}>
                <View style={styles.siteIconContainer}>
                  <Ionicons
                    name={getProjectTypeIcon(site.projectType) as any}
                    size={24}
                    color="#8B5CF6"
                  />
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.siteLocation}>{site.location}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(site.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(site.status) },
                    ]}
                  >
                    {getStatusText(site.status)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressPercent}>{site.progress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${site.progress}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Site Stats */}
              <View style={styles.siteStats}>
                <View style={styles.siteStat}>
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text style={styles.siteStatText}>
                    {site.workersCount} Workers
                  </Text>
                </View>
                <View style={styles.siteStat}>
                  <Ionicons name="cash" size={16} color="#6B7280" />
                  <Text style={styles.siteStatText}>{site.budget}</Text>
                </View>
                <View style={styles.siteStat}>
                  <Ionicons name="navigate" size={16} color="#6B7280" />
                  <Text style={styles.siteStatText}>{site.radius}m Radius</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/(owner)/stock/${site.id}`)}
                >
                  <Ionicons name="cube-outline" size={18} color="#8B5CF6" />
                  <Text style={styles.actionButtonText}>Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/(owner)/bills/${site.id}`)}
                >
                  <Ionicons name="receipt-outline" size={18} color="#8B5CF6" />
                  <Text style={styles.actionButtonText}>Bills</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Workers', 'View all workers')}
                >
                  <Ionicons name="people-outline" size={18} color="#8B5CF6" />
                  <Text style={styles.actionButtonText}>Workers</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {sites.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddSite}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#E9D5FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  siteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  siteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  siteStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  siteStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  siteStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
