/** Petty Cash Wallet with Geotags – Desirable. Frontend-only, mock. */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { getPettyCash, addPettyCash } from '../../lib/mock-api';

export default function PettyCashScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [, forceUpdate] = useState(0);
  const list = getPettyCash(user?.id);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); forceUpdate((n) => n + 1); }, 400);
  }, []);

  const submit = () => {
    const a = parseFloat(amount);
    const p = purpose.trim();
    if (isNaN(a) || a <= 0 || !p) {
      Alert.alert('Error', 'Valid amount and purpose required');
      return;
    }
    addPettyCash(user?.id ?? 'u1', a, p, null, 19.076, 72.8777, 'Andheri West (mock GPS)');
    setAmount('');
    setPurpose('');
    setShowForm(false);
    forceUpdate((n) => n + 1);
    Alert.alert('Submitted', 'Receipt queued with geotag (mock).');
  };

  const statusColor = (s: string) => (s === 'approved' ? DESIGN.colors.success : s === 'rejected' ? DESIGN.colors.danger : DESIGN.colors.warning);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Petty Cash</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPS-validated receipts</Text>
          {!showForm ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={24} color={DESIGN.colors.primary} />
              <Text style={styles.addBtnText}>Add expense</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Amount (₹)"
                placeholderTextColor={DESIGN.colors.text.secondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Purpose"
                placeholderTextColor={DESIGN.colors.text.secondary}
                value={purpose}
                onChangeText={setPurpose}
              />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setShowForm(false)}>
                  <Text style={styles.btnTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={submit}>
                  <Text style={styles.btnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My expenses</Text>
          {list.length === 0 ? (
            <Text style={styles.empty}>No expenses yet.</Text>
          ) : (
            list.map((e) => (
              <View key={e.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.amount}>₹{e.amount}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(e.status)}20` }]}>
                    <Text style={[styles.badgeText, { color: statusColor(e.status) }]}>{e.status}</Text>
                  </View>
                </View>
                <Text style={styles.purpose}>{e.purpose}</Text>
                <Text style={styles.meta}>📍 {e.address} • {new Date(e.timestamp).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: DESIGN.spacing.lg },
  addBtnText: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.primary },
  form: { marginBottom: DESIGN.spacing.xl },
  input: {
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.sm,
    padding: DESIGN.spacing.md,
    fontSize: 14,
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  row: { flexDirection: 'row', gap: DESIGN.spacing.md },
  btn: { flex: 1, paddingVertical: 12, borderRadius: DESIGN.radius.sm, alignItems: 'center' },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnSecondary: { backgroundColor: '#E5E7EB' },
  btnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnTextSecondary: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.primary },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  amount: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  purpose: { fontSize: 13, color: DESIGN.colors.text.secondary, marginTop: 4 },
  meta: { fontSize: 11, color: DESIGN.colors.text.tertiary, marginTop: 4 },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
});
