import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/api';
import { supabase } from '../../constants/supabase';
import { DESIGN } from '../../constants/designSystem';

export default function SetupProfile() {
  const router = useRouter();
  const { userId, phoneNumber } = useLocalSearchParams<{ userId: string; phoneNumber?: string }>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery permission to select an image.');
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
        const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileImage(result.assets[0].uri);
        setProfileImageBase64(base64String);
        console.log('✓ Image selected and converted to base64');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    if (!profileImageBase64) {
      Alert.alert('Validation Error', 'Please select a profile image.');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Uploading image to Supabase...');

      const fileExt = profileImage!.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const base64Data = profileImageBase64!.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, byteArray, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        Alert.alert('Error', `Failed to upload image: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('✅ Image uploaded:', publicUrl);

      const payload = {
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        profilePhoto: publicUrl,
      };

      console.log('📤 Saving profile to backend...');

      const apiResponse = await fetch(`${API_BASE_URL}/api/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await apiResponse.json();

      if (apiResponse.ok) {
        if (data.success) {
          console.log('Profile completed successfully');

          // Role-based navigation
          let dashboardPath = '/(tabs)/home'; // Default for labour, supervisor, engineer

          if (user?.role === 'owner') {
            dashboardPath = '/(owner)/sites';
          }

          Alert.alert(
            'Profile Completed!',
            'Your profile has been set up successfully.',
            [
              {
                text: 'Continue',
                onPress: () => router.replace(dashboardPath),
              },
            ],
            { cancelable: false }
          );
        } else {
          Alert.alert('Error', data.message || 'Failed to save profile');
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to save profile');
      }
    } catch (error: any) {
      console.error('✗ Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title} allowFontScaling={false}>
            Complete Your Profile
          </Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Add your details to complete setup
          </Text>
        </View>

        {/* Profile Image Section */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color={DESIGN.colors.text.tertiary} />
              <Text style={styles.imagePlaceholderText} allowFontScaling={false}>
                Tap to add photo
              </Text>
              <Text style={styles.imagePlaceholderSubtext} allowFontScaling={false}>
                JPG, PNG up to 5MB
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {profileImage && (
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
          >
            <Ionicons name="refresh" size={16} color={DESIGN.colors.primary} />
            <Text style={styles.changePhotoText} allowFontScaling={false}>
              Change Photo
            </Text>
          </TouchableOpacity>
        )}

        {/* Name Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label} allowFontScaling={false}>
            Full Name *
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color={DESIGN.colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!loading}
              placeholderTextColor={DESIGN.colors.text.tertiary}
              allowFontScaling={false}
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label} allowFontScaling={false}>
            Email Address *
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={DESIGN.colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={DESIGN.colors.text.tertiary}
              allowFontScaling={false}
            />
          </View>
          <Text style={styles.disclaimerText} allowFontScaling={false}>
            ⓘ This email will be used for login and cannot be changed later.
          </Text>
        </View>

        {/* Mobile Number (Read-only) */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label} allowFontScaling={false}>
            Mobile Number
          </Text>
          <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
            <Ionicons name="call" size={20} color={DESIGN.colors.text.tertiary} />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={phoneNumber || 'Not provided'}
              editable={false}
              placeholderTextColor={DESIGN.colors.text.tertiary}
              allowFontScaling={false}
            />
            <Ionicons name="checkmark-circle" size={20} color={DESIGN.colors.success} />
          </View>
          <Text style={styles.verifiedText} allowFontScaling={false}>
            ✓ Mobile number verified
          </Text>
        </View>



        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={DESIGN.colors.surface} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color={DESIGN.colors.surface} />
              <Text style={styles.saveButtonText} allowFontScaling={false}>
                Complete Profile Setup
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  contentWrapper: {
    paddingBottom: DESIGN.spacing.xl * 2,
  },
  headerSection: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 3,
    paddingBottom: DESIGN.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.lg,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: DESIGN.colors.primary,
    backgroundColor: '#F3E8FF',
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: DESIGN.colors.background,
    borderWidth: 2,
    borderColor: DESIGN.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.sm,
  },
  imagePlaceholderSubtext: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.tertiary,
    marginTop: DESIGN.spacing.xs,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xl,
    paddingVertical: DESIGN.spacing.md,
    gap: DESIGN.spacing.sm,
  },
  changePhotoText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    color: DESIGN.colors.primary,
  },
  inputWrapper: {
    marginHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xl,
  },
  label: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '700',
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surface,
    borderWidth: 2,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.md,
    paddingHorizontal: DESIGN.spacing.lg,
    height: DESIGN.button.min,
    ...DESIGN.shadow.sm,
    elevation: 1,
  },
  input: {
    flex: 1,
    marginLeft: DESIGN.spacing.md,
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.primary,
  },
  inputContainerDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: DESIGN.colors.border,
  },
  inputDisabled: {
    color: DESIGN.colors.text.secondary,
  },
  disclaimerText: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.warning,
    marginTop: DESIGN.spacing.sm,
    marginLeft: DESIGN.spacing.xs,
  },
  verifiedText: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.success,
    marginTop: DESIGN.spacing.sm,
    marginLeft: DESIGN.spacing.xs,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xl * 2,
    padding: DESIGN.spacing.lg,
    borderRadius: DESIGN.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: DESIGN.colors.info,
    gap: DESIGN.spacing.md,
  },
  infoBoxText: {
    flex: 1,
    fontSize: DESIGN.typography.caption,
    color: '#1E40AF',
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN.colors.primary,
    marginHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.lg,
    borderRadius: DESIGN.radius.md,
    ...DESIGN.shadow.md,
    elevation: 5,
    gap: DESIGN.spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: DESIGN.colors.text.tertiary,
    ...DESIGN.shadow.sm,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '700',
    color: DESIGN.colors.surface,
  },
  bottomSpacer: {
    height: DESIGN.spacing.xl,
  },
});
