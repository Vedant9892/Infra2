/** Labour Home – mock API only. Join via code (e.g. SITE-A1). No backend. */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { DashboardHeader } from '../../../components/DashboardHeader';
import { getSitesForLabour, joinSiteByCode, onDataChange } from '../../../lib/mock-api';

export default function LabourHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [sites, setSites] = useState<{ id: string; name: string; address?: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siteCode, setSiteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchMySites = useCallback(() => {
    const uid = user?.id ?? 'u1';
    setSites(getSitesForLabour(uid));
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMySites();
      // Auto-refresh when data changes
      const unsubscribe = onDataChange(() => {
        fetchMySites();
      });
      return unsubscribe;
    }, [fetchMySites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMySites();
  };

  const hasSite = sites.length > 0;

  const handleConnect = () => {
    const code = siteCode.trim();
    if (!code) {
      setJoinError('Please enter a site code (e.g. SITE-A1)');
      return;
    }
    const uid = user?.id ?? 'u1';
    const result = joinSiteByCode(code, uid);
    if (!result.success) {
      setJoinError('Invalid code. Try SITE-A1, SITE-B2, or SITE-C3.');
      return;
    }
    setSiteCode('');
    setJoinError('');
    Alert.alert('Success', `Connected to ${result.site?.name ?? 'site'}`);
    fetchMySites();
  };

  const handleScanQR = () => {
    router.push('/(labour)/scan-qr');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <DashboardHeader name={user?.name || 'Labour'} role="LABOUR" profilePhoto={user?.profilePhoto} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={DESIGN.colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <View style={styles.joinSection}>
          <Text style={styles.sectionTitle}>Join site</Text>
          <Text style={styles.hint}>Use code SITE-A1 or SITE-B2. Scan QR or enter below.</Text>

          <TouchableOpacity style={styles.scanCard} onPress={handleScanQR}>
            <View style={[styles.scanIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="qr-code" size={32} color={DESIGN.colors.primary} />
            </View>
            <Text style={styles.scanTitle}>Scan Site QR</Text>
            <Text style={styles.scanSub}>Opens scanner</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or enter code</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.inputCard}>
            <TextInput
              style={[styles.input, joinError ? styles.inputError : null]}
              placeholder="e.g. SITE-A1"
              placeholderTextColor={DESIGN.colors.text.secondary}
              value={siteCode}
              onChangeText={(t) => {
                setSiteCode(t.toUpperCase());
                setJoinError('');
              }}
              maxLength={20}
              autoCapitalize="characters"
              editable={!joinLoading}
            />
            {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, joinLoading && styles.btnDisabled]}
              onPress={handleConnect}
              disabled={joinLoading}
            >
              <Text style={styles.btnText}>Connect to Site</Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasSite ? (
          <View style={styles.hintCard}>
            <Ionicons name="information-circle" size={22} color={DESIGN.colors.primary} />
            <Text style={styles.hintCardText}>
              You have {sites.length} site{sites.length !== 1 ? 's' : ''}. Open Projects to work.
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.background },
  scroll: { flex: 1 },
  loadingWrap: { flex: 1, paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary },
  joinSection: { paddingHorizontal: DESIGN.spacing.lg, paddingTop: DESIGN.spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.sm },
  hint: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.xl },
  scanCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    padding: DESIGN.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    marginBottom: DESIGN.spacing.lg,
  },
  scanIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: DESIGN.spacing.md },
  scanTitle: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary },
  scanSub: { fontSize: 13, color: DESIGN.colors.text.secondary, marginTop: 4 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: DESIGN.spacing.lg },
  orLine: { flex: 1, height: 1, backgroundColor: DESIGN.colors.border },
  orText: { marginHorizontal: DESIGN.spacing.md, fontSize: 13, color: DESIGN.colors.text.secondary },
  inputCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    padding: DESIGN.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.sm,
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.md,
    fontSize: DESIGN.typography.subtitle,
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  inputError: { borderColor: DESIGN.colors.danger, backgroundColor: '#FEF2F2' },
  errorText: { fontSize: DESIGN.typography.caption, color: DESIGN.colors.danger, marginBottom: DESIGN.spacing.sm },
  btn: { borderRadius: DESIGN.radius.sm, paddingVertical: DESIGN.spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: DESIGN.button.min },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: '#fff' },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    marginHorizontal: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.xl,
    padding: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    gap: DESIGN.spacing.sm,
  },
  hintCardText: { flex: 1, fontSize: 14, fontWeight: '600', color: DESIGN.colors.primary },
  bottomSpacer: { height: 120 },
});
