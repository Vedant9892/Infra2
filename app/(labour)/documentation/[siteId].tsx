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

export default function LabourDocumentationScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!siteId || !user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera access is required');
      return;
    }
    setUploading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) {
        setUploading(false);
        return;
      }
      const base64 = result.assets[0].base64;
      const b64 = base64.startsWith('data:') ? base64.split(',')[1] : base64;
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const path = `documentation/${siteId}/${user.id}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, arr, { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const photoUrl = urlData.publicUrl;

      // Use documentation endpoint if available, otherwise use a generic endpoint
      const res = await fetch(
        `${API_BASE_URL}${LABOUR_ENDPOINTS.SITE.DOCUMENTATION(siteId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photoUrl, userId: user.id }),
        }
      );

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await res.text();
        console.error('Documentation upload – non-JSON response:', text);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      Alert.alert('Success', 'Work photo uploaded');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText} allowFontScaling={false}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} allowFontScaling={false}>Site Documentation</Text>
        <View style={styles.back} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.hint} allowFontScaling={false}>
          Upload work photos. Photos are saved site-wise in the database.
        </Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, uploading && styles.btnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={DESIGN.colors.surface} />
          ) : (
            <Text style={styles.btnText} allowFontScaling={false}>Upload work photo</Text>
          )}
        </TouchableOpacity>
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
