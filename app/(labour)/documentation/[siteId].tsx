/** Site Documentation – mock API only. No backend. */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getWorkPhotos, addWorkPhoto, onDataChange } from '../../../lib/mock-api';

export default function LabourDocumentationScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; photoUrl: string; timestamp: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [, forceUpdate] = useState(0);

  const load = useCallback(() => {
    if (!siteId) return;
    setPhotos(getWorkPhotos(siteId));
  }, [siteId]);

  useEffect(() => {
    load();
    // Auto-refresh when data changes
    const unsubscribe = onDataChange(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    forceUpdate((n) => n + 1);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleUpload = () => {
    if (!siteId) {
      Alert.alert('Error', 'Missing site');
      return;
    }
    setUploading(true);
    try {
      const uid = user?.id ?? 'u1';
      addWorkPhoto(siteId, uid, 'mock://work-photo');
      load();
      forceUpdate((n) => n + 1);
      Alert.alert('Success', 'Work photo added successfully');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

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
        <Text style={styles.title}>Site Documentation (mock)</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <Text style={styles.hint}>Work photos. Mock: tap below to add.</Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, uploading && styles.btnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.btnText}>Add work photo</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          {photos.length === 0 ? (
            <Text style={styles.empty}>No photos yet.</Text>
          ) : (
            photos.map((p) => (
              <View key={p.id} style={styles.card}>
                <Ionicons name="image" size={32} color={DESIGN.colors.text.tertiary} />
                <Text style={styles.cardTime}>{new Date(p.timestamp).toLocaleString()}</Text>
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
  content: { paddingHorizontal: DESIGN.spacing.lg, paddingVertical: DESIGN.spacing.xl, paddingBottom: DESIGN.spacing.xl * 2 },
  hint: { fontSize: 14, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.lg },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: DESIGN.radius.sm,
    paddingVertical: DESIGN.spacing.lg,
    minHeight: DESIGN.button.recommended,
    marginBottom: DESIGN.spacing.xl,
  },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  section: { marginTop: DESIGN.spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  cardTime: { fontSize: 13, color: DESIGN.colors.text.secondary },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: { backgroundColor: DESIGN.colors.primary, paddingHorizontal: DESIGN.spacing.xl, paddingVertical: DESIGN.spacing.md, borderRadius: DESIGN.radius.sm },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
