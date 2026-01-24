import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import { LabourCard } from '../../../components/LabourCard';
import { LabourDashboardHeader } from '../../../components/LabourDashboardHeader';

interface Site {
  _id: string;
  name: string;
  role?: string;
  address?: string;
  isActive?: boolean;
}

export default function LabourProjectsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSites = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setSites([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/sites/labour/${user.id}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.sites)) {
        setSites(data.sites.map((s: any) => ({
          _id: s.id,
          name: s.name,
          address: s.address,
          isActive: s.status === 'active',
        })));
      } else {
        setSites([]);
      }
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSites();
    }, [fetchSites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSites();
  };

  const current = sites.filter((s) => s.isActive !== false);
  const past = sites.filter((s) => s.isActive === false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LabourDashboardHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={DESIGN.colors.primary} />
            <Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
          </View>
        ) : (
          <>
            {current.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle} allowFontScaling={false}>Current Projects</Text>
                {current.map((site) => (
                  <LabourCard key={site._id}>
                    <Text style={styles.siteName} allowFontScaling={false}>{site.name}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.badge, styles.badgeActive]}>
                        <Text style={styles.badgeText} allowFontScaling={false}>Active</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => router.push(`/(labour)/manage-site/${site._id}`)}
                    >
                      <Text style={styles.manageBtnText} allowFontScaling={false}>Open / Manage Site</Text>
                    </TouchableOpacity>
                  </LabourCard>
                ))}
              </View>
            )}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle} allowFontScaling={false}>Past Projects</Text>
                {past.map((site) => (
                  <LabourCard key={site._id}>
                    <Text style={styles.siteName} allowFontScaling={false}>{site.name}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.badge, styles.badgePast]}>
                        <Text style={styles.badgeTextPast} allowFontScaling={false}>Completed</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.manageBtn}
                      onPress={() => router.push(`/(labour)/manage-site/${site._id}`)}
                    >
                      <Text style={styles.manageBtnText} allowFontScaling={false}>Open / Manage Site</Text>
                    </TouchableOpacity>
                  </LabourCard>
                ))}
              </View>
            )}
            {current.length === 0 && past.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText} allowFontScaling={false}>No projects yet</Text>
                <Text style={styles.emptyHint} allowFontScaling={false}>
                  Connect to a site from Home to see your projects
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DESIGN.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: DESIGN.BASE_PADDING, paddingVertical: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.xl * 3 },
  loading: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary },
  section: { marginBottom: DESIGN.spacing.xl },
  sectionTitle: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  siteName: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
  },
  statusRow: { marginBottom: DESIGN.spacing.md },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DESIGN.spacing.sm,
    paddingVertical: DESIGN.spacing.xs,
    borderRadius: DESIGN.radius.sm,
  },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgePast: { backgroundColor: '#E5E7EB' },
  badgeText: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: '#059669' },
  badgeTextPast: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: DESIGN.colors.text.secondary },
  manageBtn: {
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.sm,
    paddingVertical: DESIGN.spacing.md,
    alignItems: 'center',
    minHeight: DESIGN.button.min,
    justifyContent: 'center',
  },
  manageBtnText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.surface },
  empty: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  emptyText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.sm },
  emptyHint: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary, textAlign: 'center' },
});
