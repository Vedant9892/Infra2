/** Labour Projects – mock API only. No backend. */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { DashboardHeader } from '../../../components/DashboardHeader';
import { getSitesForLabour, onDataChange } from '../../../lib/mock-api';

export default function LabourProjectsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [sites, setSites] = useState<{ id: string; name: string; address?: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSites = useCallback(() => {
    const uid = user?.id ?? 'u1';
    const list = getSitesForLabour(uid);
    setSites(list);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSites();
      // Auto-refresh when data changes
      const unsubscribe = onDataChange(() => {
        fetchSites();
      });
      return unsubscribe;
    }, [fetchSites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSites();
  };

  const active = sites.filter((s) => s.status === 'active');
  const past = sites.filter((s) => s.status !== 'active');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />
        }
      >
        <DashboardHeader name={user?.name || 'Labour'} role="LABOUR" profilePhoto={user?.profilePhoto} />

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={DESIGN.colors.primary} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : (
            <>
              {active.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Active Projects</Text>
                  {active.map((site) => (
                    <TouchableOpacity
                      key={site.id}
                      style={styles.card}
                      onPress={() => router.push(`/(labour)/manage-site/${site.id}`)}
                    >
                      <View style={styles.cardTop}>
                        <View style={[styles.iconWrap, { backgroundColor: '#D1FAE5' }]}>
                          <Ionicons name="construct" size={24} color="#059669" />
                        </View>
                        <View style={[styles.badge, styles.badgeActive]}>
                          <Text style={styles.badgeText}>Active</Text>
                        </View>
                      </View>
                      <Text style={styles.siteName}>{site.name}</Text>
                      {site.address ? <Text style={styles.siteAddress} numberOfLines={1}>{site.address}</Text> : null}
                      <TouchableOpacity
                        style={styles.openBtn}
                        onPress={() => router.push(`/(labour)/manage-site/${site.id}`)}
                      >
                        <Text style={styles.openBtnText}>Open Project</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {past.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Past Projects</Text>
                  {past.map((site) => (
                    <TouchableOpacity
                      key={site.id}
                      style={styles.card}
                      onPress={() => router.push(`/(labour)/manage-site/${site.id}`)}
                    >
                      <View style={styles.cardTop}>
                        <View style={[styles.iconWrap, { backgroundColor: '#E5E7EB' }]}>
                          <Ionicons name="archive" size={24} color="#6B7280" />
                        </View>
                        <View style={[styles.badge, styles.badgePast]}>
                          <Text style={styles.badgeTextPast}>Completed</Text>
                        </View>
                      </View>
                      <Text style={styles.siteName}>{site.name}</Text>
                      {site.address ? <Text style={styles.siteAddress} numberOfLines={1}>{site.address}</Text> : null}
                      <TouchableOpacity
                        style={styles.openBtn}
                        onPress={() => router.push(`/(labour)/manage-site/${site.id}`)}
                      >
                        <Text style={styles.openBtnText}>Open Project</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {active.length === 0 && past.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No projects yet</Text>
                  <Text style={styles.emptyHint}>Connect to a site from Home (e.g. SITE-A1) to see projects</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: DESIGN.spacing.lg, paddingTop: DESIGN.spacing.xl },
  loading: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: 14, color: DESIGN.colors.text.secondary },
  section: { marginBottom: DESIGN.spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.md },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    padding: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN.spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgePast: { backgroundColor: '#E5E7EB' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#059669' },
  badgeTextPast: { fontSize: 12, fontWeight: '600', color: DESIGN.colors.text.secondary },
  siteName: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: 4 },
  siteAddress: { fontSize: 13, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.sm,
    paddingVertical: DESIGN.spacing.md,
    minHeight: DESIGN.button.min,
  },
  openBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  empty: { paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: DESIGN.colors.text.primary, marginTop: 16 },
  emptyHint: { fontSize: 14, color: DESIGN.colors.text.secondary, textAlign: 'center', marginTop: 8 },
  bottomSpacer: { height: 120 },
});
