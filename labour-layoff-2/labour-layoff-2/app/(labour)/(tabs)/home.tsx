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
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL, LABOUR_ENDPOINTS } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import { LabourCard } from '../../../components/LabourCard';
import { LabourDashboardHeader } from '../../../components/LabourDashboardHeader';
import { normalizeSiteCode } from '../../../lib/normalizeSiteCode';

interface Site {
  _id: string;
  name: string;
  role?: string;
  address?: string;
  isActive?: boolean;
}

export default function LabourHomeScreen() {
  const router = useRouter();
  const { token } = useUser();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [siteCode, setSiteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchMySites = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setSites([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}${LABOUR_ENDPOINTS.SITE.GET_MY_SITES}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSites(data);
      } else {
        setSites([]);
      }
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMySites();
    }, [fetchMySites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMySites();
  };

  const hasSite = sites.length > 0;

  const handleConnect = async () => {
    const code = normalizeSiteCode(siteCode.trim());
    if (!code) {
      setJoinError('Please enter a site code');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await fetch(`${API_BASE_URL}${LABOUR_ENDPOINTS.SITE.JOIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ siteCode: code }),
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect');
      }
      setSiteCode('');
      Alert.alert('Success', `Connected to ${data.site?.name || 'site'}`);
      await fetchMySites();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to connect';
      console.error('Join site error:', e);
      setJoinError(msg);
      Alert.alert('Error', msg);
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LabourDashboardHeader />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={DESIGN.colors.primary} />
          <Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.connectWrap}>
          {/* Primary: Scan Site QR */}
          <LabourCard>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/(labour)/scan-qr')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="qr-code" size={28} color={DESIGN.colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle} allowFontScaling={false}>Scan Site QR</Text>
                <Text style={styles.actionSub} allowFontScaling={false}>Ask supervisor to show QR</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DESIGN.colors.text.tertiary} />
            </TouchableOpacity>
          </LabourCard>

          {/* Secondary: Enter Site Code */}
          <LabourCard>
            <Text style={styles.cardLabel} allowFontScaling={false}>Enter Site Code</Text>
            <Text style={[styles.actionSub, { marginBottom: DESIGN.spacing.md }]} allowFontScaling={false}>
              Type site code manually
            </Text>
            <TextInput
              style={[styles.input, joinError ? styles.inputError : null]}
              placeholder="e.g. SPIT-11223"
              placeholderTextColor={DESIGN.colors.text.tertiary}
              value={siteCode}
              onChangeText={(t) => {
                setSiteCode(t.replace(/\s/g, '').toUpperCase());
                setJoinError('');
              }}
              maxLength={20}
              autoCapitalize="characters"
              editable={!joinLoading}
              allowFontScaling={false}
            />
            {joinError ? (
              <Text style={styles.errorText} allowFontScaling={false}>{joinError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, joinLoading && styles.btnDisabled]}
              onPress={handleConnect}
              disabled={joinLoading}
            >
              {joinLoading ? (
                <ActivityIndicator color={DESIGN.colors.surface} />
              ) : (
                <Text style={styles.btnText} allowFontScaling={false}>Connect to Site</Text>
              )}
            </TouchableOpacity>
          </LabourCard>

          {hasSite && (
            <Text style={styles.hint} allowFontScaling={false}>
              You have {sites.length} site(s). Open Projects to work.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DESIGN.colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: DESIGN.BASE_PADDING,
    paddingVertical: DESIGN.spacing.xl,
    paddingBottom: DESIGN.floatingTabBar.scrollPaddingBottom,
  },
  loadingWrap: { flex: 1, paddingVertical: DESIGN.spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: DESIGN.spacing.md, fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary },
  connectWrap: { paddingVertical: DESIGN.spacing.xl },
  hint: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.lg,
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
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
  inputError: {
    borderColor: DESIGN.colors.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.danger,
    marginBottom: DESIGN.spacing.sm,
  },
  btn: {
    borderRadius: DESIGN.radius.sm,
    paddingVertical: DESIGN.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: DESIGN.button.min,
  },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '600',
    color: DESIGN.colors.surface,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: DESIGN.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.md,
  },
  actionContent: { flex: 1 },
  actionTitle: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
  },
  actionSub: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.xs,
  },
});
