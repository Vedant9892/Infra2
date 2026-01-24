/** Daily Work Logs – Essential. Frontend-only, mock. */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { getWorkLogs, addWorkLog } from '../../lib/mock-api';

export default function WorkLogsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [workDone, setWorkDone] = useState('');
  const [showForm, setShowForm] = useState(false);
  const logs = getWorkLogs();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const submit = () => {
    const t = workDone.trim();
    if (!t) {
      Alert.alert('Error', 'Enter work done');
      return;
    }
    addWorkLog(user?.id ?? 'u1', t, null, 19.076, 72.8777, 'Andheri West, Mumbai');
    setWorkDone('');
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Work Logs</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work done, photo, location</Text>
          {!showForm ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={24} color={DESIGN.colors.primary} />
              <Text style={styles.addBtnText}>Add work log</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Work done today..."
                placeholderTextColor={DESIGN.colors.text.secondary}
                value={workDone}
                onChangeText={setWorkDone}
                multiline
              />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setShowForm(false)}>
                  <Text style={styles.btnTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={submit}>
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent logs</Text>
          {logs.length === 0 ? (
            <Text style={styles.empty}>No logs yet.</Text>
          ) : (
            logs.map((l) => (
              <View key={l.id} style={styles.card}>
                <Text style={styles.cardTitle}>{l.workDone}</Text>
                <Text style={styles.meta}>{l.address} • {new Date(l.timestamp).toLocaleString()}</Text>
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
    minHeight: 80,
    textAlignVertical: 'top',
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
  cardTitle: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.primary },
  meta: { fontSize: 12, color: DESIGN.colors.text.secondary, marginTop: 4 },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
});
