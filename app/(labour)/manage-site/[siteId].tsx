import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../../constants/designSystem';

const ACTIONS = [
  {
    id: 'attendance',
    icon: 'location' as const,
    title: 'Mark Attendance',
    subtitle: 'GPS + Photo required',
    color: '#8B5CF6',
    route: (siteId: string) => `/(labour)/attendance/${siteId}` as const,
  },
  {
    id: 'tasks',
    icon: 'clipboard' as const,
    title: 'My Assigned Tasks',
    subtitle: 'Daily assigned work',
    color: '#10B981',
    route: (siteId: string) => `/(labour)/tasks/${siteId}` as const,
  },
  {
    id: 'docs',
    icon: 'camera' as const,
    title: 'Site Documentation',
    subtitle: 'Upload work photos',
    color: '#F59E0B',
    route: (siteId: string) => `/(labour)/documentation/${siteId}` as const,
  },
  {
    id: 'tools',
    icon: 'construct' as const,
    title: 'Tools Diary',
    subtitle: 'Request & return tools',
    color: '#3B82F6',
    route: (siteId: string) => `/(labour)/tools-diary/${siteId}` as const,
  },
];

export default function ManageSiteScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();

  if (!siteId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Missing site</Text>
          <TouchableOpacity style={styles.backBtnFull} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Project Dashboard</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.card, { borderLeftColor: a.color }]}
                onPress={() => router.push(a.route(siteId) as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${a.color}20` }]}>
                  <Ionicons name={a.icon} size={26} color={a.color} />
                </View>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardSubtitle}>{a.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  scroll: { flex: 1 },
  section: { paddingHorizontal: DESIGN.spacing.lg, paddingTop: DESIGN.spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN.spacing.md,
  },
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: DESIGN.colors.text.secondary },
  bottomSpacer: { height: 120 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: {
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: DESIGN.spacing.xl,
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.sm,
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
