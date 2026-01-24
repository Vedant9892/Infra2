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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL, USER } from '../../../constants/api';
import { DESIGN } from '../../../constants/designSystem';
import { supabase } from '../../../constants/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function SupervisorProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useUser();
  const [name, setName] = useState(user?.name?.trim() || '');
  const [photoUri, setPhotoUri] = useState<string | null>(user?.profilePhoto || null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  React.useEffect(() => {
    if (user?.name) setName(user.name.trim());
    if (user?.profilePhoto) setPhotoUri(user.profilePhoto);
  }, [user?.name, user?.profilePhoto]);

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
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUri = photoUri;

      // Upload photo to Supabase if changed
      if (photoUri && photoUri.startsWith('file://')) {
        const fileName = `supervisor-${user?.id}-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, {
            uri: photoUri,
            type: 'image/jpeg',
          } as any, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (error) throw error;
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
        finalPhotoUri = urlData.publicUrl;
      }

      // Update profile via API
      const response = await fetch(`${API_BASE_URL}${USER.UPDATE_PROFILE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: name.trim(),
          profilePhoto: finalPhotoUri,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser({
          ...user!,
          name: name.trim(),
          profilePhoto: finalPhotoUri,
        });
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          logout();
          router.replace('/(auth)/login');
          setLoggingOut(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickPhoto}>
            {photoUri && 
             photoUri !== '' && 
             !photoUri.startsWith('mock://') ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={DESIGN.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.phoneNumber || ''}
                editable={false}
                placeholderTextColor={DESIGN.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value="Site Supervisor"
                editable={false}
                placeholderTextColor={DESIGN.colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text style={styles.logoutButtonText}>Logout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.md,
    paddingBottom: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.text,
  },
  content: {
    padding: DESIGN.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: DESIGN.spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: DESIGN.colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: DESIGN.colors.surface,
  },
  editBadgeText: {
    fontSize: 18,
  },
  form: {
    gap: DESIGN.spacing.lg,
  },
  inputGroup: {
    marginBottom: DESIGN.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text,
    marginBottom: DESIGN.spacing.sm,
  },
  input: {
    backgroundColor: DESIGN.colors.surface,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    fontSize: 16,
    color: DESIGN.colors.text,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: DESIGN.colors.textSecondary,
  },
  saveButton: {
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DESIGN.spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DESIGN.spacing.sm,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
