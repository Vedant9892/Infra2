import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL, LABOUR_ENDPOINTS } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import { supabase } from '../../../constants/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function LabourAttendanceScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  React.useEffect(() => {
    if (!siteId || !user?.id) return;
    (async () => {
      try {
        // Check if attendance already marked today using existing API
        const res = await fetch(`${API_BASE_URL}/api/attendance/pending?siteId=${siteId}`);
        const data = await res.json();
        // For now, just check if we can mark attendance
        setTodayStatus(null); // Will be set after marking
      } catch {
        setTodayStatus(null);
      } finally {
        setChecking(false);
      }
    })();
  }, [siteId, user?.id]);

  const handleMark = async () => {
    if (!siteId || !user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    const { status: cam } = await ImagePicker.requestCameraPermissionsAsync();
    if (cam !== 'granted') {
      Alert.alert('Permission', 'Camera access is required');
      return;
    }
    const { status: loc } = await Location.requestForegroundPermissionsAsync();
    if (loc !== 'granted') {
      Alert.alert('Permission', 'Location (GPS) is required for attendance');
      return;
    }
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const camResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (camResult.canceled || !camResult.assets?.[0]?.base64) {
        setLoading(false);
        return;
      }
      const base64 = camResult.assets[0].base64;
      const b64 = base64.startsWith('data:') ? base64.split(',')[1] : base64;
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const path = `attendance/${user.id}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, arr, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const photoUrl = urlData.publicUrl;

      // Use existing attendance API
      const res = await fetch(`${API_BASE_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          siteId: siteId,
          photoUri: photoUrl,
          gpsLat: location.coords.latitude,
          gpsLon: location.coords.longitude,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to mark attendance');
      Alert.alert('Success', 'Attendance marked. GPS and photo recorded.');
      setTodayStatus('Marked');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText} allowFontScaling={false}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} allowFontScaling={false}>Mark Attendance</Text>
        <View style={styles.back} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {checking ? (
          <ActivityIndicator size="large" color={DESIGN.colors.primary} />
        ) : (
          <>
            <Text style={styles.hint} allowFontScaling={false}>
              GPS + Photo required. Attendance is stored site-wise.
            </Text>
            {todayStatus === 'Marked' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText} allowFontScaling={false}>Today: Marked</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleMark}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={DESIGN.colors.surface} />
              ) : (
                <Text style={styles.btnText} allowFontScaling={false}>Mark Attendance</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DESIGN.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.BASE_PADDING,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  back: { minWidth: 72 },
  backText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.primary },
  title: { fontSize: DESIGN.typography.subtitle, fontWeight: '700', color: DESIGN.colors.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: DESIGN.BASE_PADDING, paddingVertical: DESIGN.spacing.xl },
  hint: { fontSize: DESIGN.typography.body, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.lg },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    marginBottom: DESIGN.spacing.lg,
  },
  badgeText: { fontSize: DESIGN.typography.caption, fontWeight: '600', color: '#059669' },
  btn: {
    borderRadius: DESIGN.radius.sm,
    paddingVertical: DESIGN.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: DESIGN.button.recommended,
  },
  btnPrimary: { backgroundColor: DESIGN.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.surface },
});
