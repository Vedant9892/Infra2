/** Face-Recall for Daily Wagers – Desirable. Frontend-only, mock. */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';

const MOCK_WORKERS = [
  { id: 'w1', name: 'Ramesh Kumar', role: 'Mason', lastWage: '₹450' },
  { id: 'w2', name: 'Suresh Patel', role: 'Helper', lastWage: '₹350' },
  { id: 'w3', name: 'Vijay Singh', role: 'Carpenter', lastWage: '₹500' },
];

export default function FaceRecallScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [recognized, setRecognized] = useState<typeof MOCK_WORKERS[0] | null>(null);

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const w = MOCK_WORKERS[Math.floor(Math.random() * MOCK_WORKERS.length)];
      setRecognized(w);
      Alert.alert('Recognized', `${w.name} – ${w.role}\nLast wage: ${w.lastWage}`);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Face-Recall</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.body}>
        <View style={styles.cameraPlaceholder}>
          {scanning ? (
            <Text style={styles.placeholderText}>Scanning…</Text>
          ) : (
            <>
              <Ionicons name="scan" size={64} color={DESIGN.colors.text.tertiary} />
              <Text style={styles.placeholderText}>Camera scan</Text>
              <Text style={styles.hint}>Point at daily wager for wage tracking</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={simulateScan} disabled={scanning}>
          <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : 'Simulate scan'}</Text>
        </TouchableOpacity>
        {recognized ? (
          <View style={styles.result}>
            <Text style={styles.resultName}>{recognized.name}</Text>
            <Text style={styles.resultRole}>{recognized.role} • {recognized.lastWage}</Text>
          </View>
        ) : null}
      </View>
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
  body: { flex: 1, padding: DESIGN.spacing.xl, alignItems: 'center' },
  cameraPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 280,
    backgroundColor: '#E5E7EB',
    borderRadius: DESIGN.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.xl,
  },
  placeholderText: { fontSize: 14, color: DESIGN.colors.text.secondary, marginTop: 8 },
  hint: { fontSize: 12, color: DESIGN.colors.text.tertiary, marginTop: 4 },
  scanBtn: {
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: DESIGN.radius.md,
  },
  scanBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  result: {
    marginTop: DESIGN.spacing.xl,
    padding: DESIGN.spacing.md,
    backgroundColor: '#D1FAE5',
    borderRadius: DESIGN.radius.md,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  resultName: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary },
  resultRole: { fontSize: 13, color: DESIGN.colors.text.secondary, marginTop: 4 },
});
