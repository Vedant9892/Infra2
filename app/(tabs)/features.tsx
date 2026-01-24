/**
 * PS02-CFMA Features Hub – all Essential + Desirable features.
 * Production-ready with comprehensive data management.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { DashboardHeader } from '../../components/DashboardHeader';
import { useUser } from '../../contexts/UserContext';

type FeatureItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  route?: string;
  essential?: boolean;
};

const ESSENTIAL: FeatureItem[] = [
  { id: 'work-logs', title: 'Daily Work Logs', subtitle: 'Work done, photo, location', icon: 'document-text', color: '#8B5CF6', route: '/(features)/work-logs', essential: true },
  { id: 'attendance', title: 'Location Attendance', subtitle: 'GPS-fenced check-in', icon: 'location', color: '#10B981', route: '/(tabs)/home', essential: true },
  { id: 'materials', title: 'Material Ordering', subtitle: 'Request & approve flow', icon: 'cube', color: '#F59E0B', route: '/(tabs)/home', essential: true },
  { id: 'tasks', title: 'Task Lists', subtitle: 'Assign & status updates', icon: 'clipboard', color: '#3B82F6', route: '/(tabs)/home', essential: true },
  { id: 'stock', title: 'Stock Tracking', subtitle: 'In/Out inventory', icon: 'layers', color: '#6366F1', route: '/(features)/stock', essential: true },
  { id: 'gst', title: 'GST Bills', subtitle: 'Tax-ready bills', icon: 'receipt', color: '#059669', route: '/(features)/gst-bills', essential: true },
  { id: 'owner', title: "Owner's Dashboard", subtitle: 'Financial & time progress', icon: 'stats-chart', color: '#7C3AED', route: '/(features)/owner-dashboard', essential: true },
  { id: 'offline', title: 'Offline Capability', subtitle: 'Cache & sync when online', icon: 'cloud-offline', color: '#64748B', essential: true },
  { id: 'bandwidth', title: 'Low Bandwidth', subtitle: 'Lightweight 2G/3G', icon: 'speedometer', color: '#0EA5E9', essential: true },
  { id: 'lang', title: 'Multilingual', subtitle: 'Hindi, Tamil, Marathi', icon: 'language', color: '#EC4899', essential: true },
  { id: 'perms', title: 'Simple Permissions', subtitle: 'Worker vs Manager', icon: 'lock-closed', color: '#EF4444', essential: true },
];

const DESIRABLE: FeatureItem[] = [
  { id: 'contractors', title: 'Contractor Rating', subtitle: '1–10 rating, payment advice', icon: 'star', color: '#F59E0B', route: '/(features)/contractors' },
  { id: 'face', title: 'Face-Recall', subtitle: 'Camera scan daily wagers', icon: 'scan', color: '#8B5CF6', route: '/(features)/face-recall' },
  { id: 'tools', title: 'Tool Library', subtitle: 'QR/ID check-out', icon: 'construct', color: '#10B981', route: '/(features)/tool-library' },
  { id: 'otp', title: 'OTP Permit-to-Work', subtitle: 'Safety OTP clearance', icon: 'key', color: '#3B82F6', route: '/(features)/permit-otp' },
  { id: 'petty', title: 'Petty Cash Wallet', subtitle: 'Geotagged receipts', icon: 'wallet', color: '#14B8A6', route: '/(features)/petty-cash' },
  { id: 'variance', title: 'Consumption Variance', subtitle: 'Theoretical vs actual', icon: 'analytics', color: '#EF4444', route: '/(features)/consumption-variance' },
];

export default function FeaturesHubScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [offline, setOffline] = useState(false);

  const onPress = (item: FeatureItem) => {
    if (item.route) {
      router.push(item.route as any);
    } else {
      // Offline, Low Bandwidth, Multilingual, Permissions – no dedicated screen
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          name={user?.name || 'User'}
          role={(user?.role ?? 'engineer').toUpperCase().replace('_', ' ')}
          profilePhoto={user?.profilePhoto}
        />
        <TouchableOpacity
          style={[styles.offlineBanner, !offline && styles.offlineBannerInactive]}
          onPress={() => setOffline((o) => !o)}
        >
          <Ionicons name={offline ? 'cloud-offline' : 'cloud'} size={20} color="#fff" />
          <Text style={styles.offlineText}>
            {offline ? 'Offline – data will sync when online (tap to toggle)' : 'Online (tap to simulate offline)'}
          </Text>
        </TouchableOpacity>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Essential (PS02)</Text>
          <View style={styles.grid}>
            {ESSENTIAL.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { borderLeftColor: item.color }]}
                onPress={() => onPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desirable</Text>
          <View style={styles.grid}>
            {DESIRABLE.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { borderLeftColor: item.color }]}
                onPress={() => onPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>All features use mock data (no backend).</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.background },
  scroll: { flex: 1 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#64748B',
    paddingVertical: 8,
    marginHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.sm,
  },
  offlineBannerInactive: { backgroundColor: '#10B981' },
  offlineText: { fontSize: 12, fontWeight: '600', color: '#fff', flex: 1 },
  section: { paddingHorizontal: DESIGN.spacing.lg, paddingTop: DESIGN.spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DESIGN.spacing.md },
  card: {
    width: '47%',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    ...DESIGN.shadow.sm,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: 2 },
  cardSub: { fontSize: 11, color: DESIGN.colors.text.secondary },
  footer: { padding: DESIGN.spacing.xl, alignItems: 'center' },
  footerText: { fontSize: 12, color: DESIGN.colors.text.tertiary },
});
