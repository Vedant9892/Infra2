/** OTP Permit-to-Work – Professional UI with auto-focus OTP input */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { getPermits, requestPermit, verifyPermitOTP } from '../../lib/mock-api';
import { OTPInput } from '../../components/OTPInput';
import { useInputValue } from '../../lib/use-form-storage';

export default function PermitOTPScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [taskName, setTaskName] = useInputValue('permit-otp', 'taskName', '');
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [, forceUpdate] = useState(0);
  const permits = getPermits();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); forceUpdate((n) => n + 1); }, 400);
  }, []);

  const request = () => {
    const t = taskName.trim();
    if (!t) {
      Alert.alert('Error', 'Enter task name');
      return;
    }
    const p = requestPermit(t, user?.id ?? 'u1', user?.name ?? 'Worker');
    setTaskName('');
    Alert.alert('OTP Sent', `OTP: ${p.otp}\n\nShare this with Safety Officer for verification.`);
    forceUpdate((n) => n + 1);
  };

  const handleOTPComplete = (otpValue: string) => {
    if (!verifyId) return;
    const ok = verifyPermitOTP(verifyId, otpValue);
    if (ok) {
      Alert.alert('Verified', 'Safety clearance granted. Work can proceed.');
      setVerifyId(null);
      setOtp('');
      forceUpdate((n) => n + 1);
    } else {
      Alert.alert('Invalid OTP', 'Please check and try again.');
    }
  };

  const handleOTPChange = (otpValue: string) => {
    setOtp(otpValue);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>OTP Permit-to-Work</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="shield-checkmark" size={32} color={DESIGN.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Request Safety Permit</Text>
            <Text style={styles.cardSubtitle}>For dangerous tasks requiring safety clearance</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Electrical Trenching, Welding Work"
              placeholderTextColor={DESIGN.colors.text.secondary}
              value={taskName}
              onChangeText={setTaskName}
            />
            <TouchableOpacity style={styles.btn} onPress={request}>
              <Ionicons name="key" size={20} color="#fff" />
              <Text style={styles.btnText}>Request OTP</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verify OTP (Safety Officer)</Text>
          {permits.filter((p) => p.status === 'otp_sent').length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No pending OTP requests</Text>
            </View>
          ) : (
            permits.filter((p) => p.status === 'otp_sent').map((p) => (
              <View key={p.id} style={[styles.verifyCard, verifyId === p.id && styles.verifyCardSelected]}>
                <TouchableOpacity
                  onPress={() => {
                    setVerifyId(p.id);
                    setOtp('');
                  }}
                  style={styles.verifyCardContent}
                >
                  <View style={styles.verifyHeader}>
                    <View>
                      <Text style={styles.verifyTitle}>{p.taskName}</Text>
                      <Text style={styles.verifyMeta}>{p.workerName} • {new Date(p.requestedAt).toLocaleString()}</Text>
                    </View>
                    {verifyId === p.id ? (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={DESIGN.colors.text.secondary} />
                    )}
                  </View>
                </TouchableOpacity>
                {verifyId === p.id ? (
                  <View style={styles.otpSection}>
                    <Text style={styles.otpLabel}>Enter 4-digit OTP</Text>
                    <OTPInput
                      length={4}
                      onComplete={handleOTPComplete}
                      value={otp}
                      onChange={handleOTPChange}
                    />
                    <TouchableOpacity
                      style={[styles.verifyBtn, otp.length !== 4 && styles.verifyBtnDisabled]}
                      onPress={() => handleOTPComplete(otp)}
                      disabled={otp.length !== 4}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.verifyBtnText}>Verify OTP</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Permits</Text>
          {permits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No permits yet</Text>
            </View>
          ) : (
            permits.map((p) => {
              const statusColor = p.status === 'verified' ? '#10B981' : p.status === 'otp_sent' ? '#F59E0B' : '#6B7280';
              return (
                <View key={p.id} style={styles.permitCard}>
                  <View style={styles.permitHeader}>
                    <Text style={styles.permitTitle}>{p.taskName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {p.status === 'verified' ? '✓ Verified' : p.status === 'otp_sent' ? '⏳ Pending' : 'Requested'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.permitMeta}>{p.workerName} • {new Date(p.requestedAt).toLocaleString()}</Text>
                </View>
              );
            })
          )}
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.md },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    padding: DESIGN.spacing.xl,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.md,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.lg, textAlign: 'center' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.sm,
    padding: DESIGN.spacing.md,
    fontSize: 14,
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DESIGN.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: DESIGN.spacing.xl,
    borderRadius: DESIGN.radius.sm,
    width: '100%',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  verifyCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    overflow: 'hidden',
  },
  verifyCardSelected: {
    borderColor: DESIGN.colors.primary,
    borderWidth: 2,
  },
  verifyCardContent: {
    padding: DESIGN.spacing.md,
  },
  verifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifyTitle: { fontSize: 15, fontWeight: '600', color: DESIGN.colors.text.primary },
  verifyMeta: { fontSize: 12, color: DESIGN.colors.text.secondary, marginTop: 4 },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSection: {
    padding: DESIGN.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
    marginTop: DESIGN.spacing.md,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.sm,
    textAlign: 'center',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DESIGN.colors.primary,
    paddingVertical: 12,
    borderRadius: DESIGN.radius.sm,
    marginTop: DESIGN.spacing.md,
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  permitCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  permitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  permitTitle: { fontSize: 15, fontWeight: '600', color: DESIGN.colors.text.primary, flex: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  permitMeta: { fontSize: 12, color: DESIGN.colors.text.secondary },
  emptyCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  emptyText: { fontSize: 14, color: DESIGN.colors.text.secondary, marginTop: DESIGN.spacing.md },
  bottomSpacer: { height: 120 },
});
