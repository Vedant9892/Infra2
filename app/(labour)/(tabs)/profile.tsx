import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL, USER } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import { LabourCard } from '../../../components/LabourCard';
import { LabourDashboardHeader } from '../../../components/LabourDashboardHeader';
import { supabase } from '../../../constants/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function LabourProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout, token } = useUser();
  const [name, setName] = useState(user?.name?.trim() || '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  React.useEffect(() => {
    if (user?.name) setName(user.name.trim());
  }, [user?.name]);

  const getInitials = (n: string) => {
    if (!n) return '?';
    return n
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Gallery access is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      let profilePhoto = user.profilePhoto ?? undefined;
      if (photoBase64) {
        const b64 = photoBase64.split(',')[1];
        const bytes = atob(b64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const path = `profiles/${user.id}-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from('profile-photos')
          .upload(path, arr, { contentType: 'image/jpeg', upsert: true });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
        profilePhoto = data.publicUrl;
      }
      const res = await fetch(`${API_BASE_URL}${USER.UPDATE_PROFILE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: trimmedName,
          ...(profilePhoto !== undefined && { profilePhoto }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      const updated = {
        ...user,
        name: trimmedName,
        ...(profilePhoto !== undefined && { profilePhoto }),
      };
      setUser(updated);
      setPhotoUri(null);
      setPhotoBase64(null);
      Alert.alert('Saved', 'Profile updated. Changes reflect in the header.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            logout();
            router.replace('/(auth)/login');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={DESIGN.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayPhoto = photoUri || user.profilePhoto;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LabourDashboardHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.photoWrap} onPress={pickPhoto}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.photo} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.initials} allowFontScaling={false}>
                {getInitials(name || user.name)}
              </Text>
            </View>
          )}
          <Text style={styles.photoHint} allowFontScaling={false}>Tap to change photo</Text>
        </TouchableOpacity>

        <LabourCard>
          <Text style={styles.label} allowFontScaling={false}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={DESIGN.colors.text.tertiary}
            editable={!saving}
            allowFontScaling={false}
          />
        </LabourCard>
        <LabourCard>
          <Text style={styles.label} allowFontScaling={false}>Role</Text>
          <Text style={styles.value} allowFontScaling={false}>LABOUR</Text>
        </LabourCard>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={DESIGN.colors.surface} />
          ) : (
            <Text style={styles.saveBtnText} allowFontScaling={false}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.btnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color={DESIGN.colors.surface} />
          ) : (
            <Text style={styles.logoutText} allowFontScaling={false}>Logout</Text>
          )}
        </TouchableOpacity>
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
    paddingBottom: DESIGN.spacing.xl * 3,
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoWrap: { alignItems: 'center', marginBottom: DESIGN.spacing.xl },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DESIGN.colors.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 28, fontWeight: '700', color: DESIGN.colors.surface },
  photoHint: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.sm,
  },
  label: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.sm,
    fontWeight: '600',
  },
  input: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    paddingVertical: DESIGN.spacing.sm,
    paddingHorizontal: 0,
  },
  value: { fontSize: DESIGN.typography.subtitle, fontWeight: '600', color: DESIGN.colors.text.primary },
  saveBtn: {
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.md,
    paddingVertical: DESIGN.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DESIGN.spacing.lg,
    minHeight: DESIGN.button.recommended,
  },
  logoutBtn: {
    backgroundColor: DESIGN.colors.danger,
    borderRadius: DESIGN.radius.md,
    paddingVertical: DESIGN.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DESIGN.spacing.md,
    minHeight: DESIGN.button.recommended,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: DESIGN.typography.subtitle, fontWeight: '700', color: DESIGN.colors.surface },
  logoutText: { fontSize: DESIGN.typography.subtitle, fontWeight: '700', color: DESIGN.colors.surface },
});
