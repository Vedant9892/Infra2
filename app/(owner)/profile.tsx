import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import { API_BASE_URL } from '../../constants/api';
import { supabase } from '../../constants/supabase';
import { DESIGN } from '../../constants/designSystem';

export default function OwnerProfile() {
    const router = useRouter();
    const { user, refreshUser } = useUser();

    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');
    const [phoneNumber] = useState(user?.phoneNumber || '');
    const [profileImage, setProfileImage] = useState<string | null>(user?.profilePhoto || null);
    const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Track if user made changes
        if (name !== user?.name || profileImageBase64 !== null) {
            setHasChanges(true);
        } else {
            setHasChanges(false);
        }
    }, [name, profileImageBase64, user]);

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
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleSaveChanges = async () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Name cannot be empty.');
            return;
        }

        setLoading(true);
        try {
            let photoUrl = profileImage;

            // Upload new image if changed
            if (profileImageBase64) {
                const fileName = `${user?.id}-${Date.now()}.jpg`;
                const filePath = `profiles/${fileName}`;

                const base64Data = profileImageBase64.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                const { error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(filePath, byteArray, {
                        contentType: 'image/jpeg',
                        upsert: true,
                    });

                if (uploadError) {
                    throw new Error(`Failed to upload image: ${uploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(filePath);

                photoUrl = publicUrl;
            }

            // Update profile
            const response = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                    name: name.trim(),
                    profilePhoto: photoUrl,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Alert.alert('Success', 'Profile updated successfully!');
                setProfileImageBase64(null);
                setHasChanges(false);
                if (refreshUser) await refreshUser();
            } else {
                Alert.alert('Error', data.message || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setName(user?.name || '');
        setProfileImage(user?.profilePhoto || null);
        setProfileImageBase64(null);
        setHasChanges(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={DESIGN.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>My Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.contentWrapper}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Photo Section */}
                <View style={styles.photoSection}>
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
                                <Ionicons name="person" size={60} color={DESIGN.colors.text.tertiary} />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={20} color={DESIGN.colors.surface} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={pickImage}
                    >
                        <Ionicons name="refresh" size={16} color={DESIGN.colors.primary} />
                        <Text style={styles.changePhotoText} allowFontScaling={false}>
                            Change Photo
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Editable Fields */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>Editable Information</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label} allowFontScaling={false}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={DESIGN.colors.primary} />
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
                </View>

                {/* Read-Only Fields */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>Account Information</Text>
                    <Text style={styles.sectionSubtitle} allowFontScaling={false}>
                        These fields cannot be changed
                    </Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label} allowFontScaling={false}>Email Address</Text>
                        <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                            <Ionicons name="mail-outline" size={20} color={DESIGN.colors.text.tertiary} />
                            <TextInput
                                style={[styles.input, styles.inputDisabled]}
                                value={email}
                                editable={false}
                                placeholderTextColor={DESIGN.colors.text.tertiary}
                                allowFontScaling={false}
                            />
                            <Ionicons name="lock-closed" size={18} color={DESIGN.colors.text.tertiary} />
                        </View>
                        <Text style={styles.helperText} allowFontScaling={false}>
                            Email cannot be changed
                        </Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label} allowFontScaling={false}>Mobile Number</Text>
                        <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                            <Ionicons name="call-outline" size={20} color={DESIGN.colors.text.tertiary} />
                            <TextInput
                                style={[styles.input, styles.inputDisabled]}
                                value={phoneNumber}
                                editable={false}
                                placeholderTextColor={DESIGN.colors.text.tertiary}
                                allowFontScaling={false}
                            />
                            <Ionicons name="checkmark-circle" size={20} color={DESIGN.colors.success} />
                        </View>
                        <Text style={styles.verifiedText} allowFontScaling={false}>
                            ✓ Verified mobile number
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                {hasChanges && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText} allowFontScaling={false}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                            onPress={handleSaveChanges}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={DESIGN.colors.surface} size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={20} color={DESIGN.colors.surface} />
                                    <Text style={styles.saveButtonText} allowFontScaling={false}>
                                        Save Changes
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DESIGN.spacing.lg,
        paddingTop: Platform.OS === 'ios' ? DESIGN.spacing.xl * 3 : DESIGN.spacing.xl * 2,
        paddingBottom: DESIGN.spacing.lg,
        backgroundColor: DESIGN.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.border,
    },
    backButton: {
        padding: DESIGN.spacing.sm,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: DESIGN.colors.text.primary,
    },
    contentWrapper: {
        paddingBottom: DESIGN.spacing.xl * 2,
    },
    photoSection: {
        alignItems: 'center',
        paddingVertical: DESIGN.spacing.xl,
        backgroundColor: DESIGN.colors.surface,
        marginBottom: DESIGN.spacing.lg,
    },
    imageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: DESIGN.colors.primary,
        backgroundColor: '#F3E8FF',
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: DESIGN.colors.background,
        borderWidth: 2,
        borderColor: DESIGN.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: DESIGN.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: DESIGN.colors.surface,
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: DESIGN.spacing.md,
        paddingVertical: DESIGN.spacing.sm,
        gap: DESIGN.spacing.sm,
    },
    changePhotoText: {
        fontSize: DESIGN.typography.body,
        fontWeight: '600',
        color: DESIGN.colors.primary,
    },
    section: {
        marginHorizontal: DESIGN.spacing.lg,
        marginBottom: DESIGN.spacing.xl,
    },
    sectionTitle: {
        fontSize: DESIGN.typography.subtitle,
        fontWeight: '700',
        color: DESIGN.colors.text.primary,
        marginBottom: DESIGN.spacing.xs,
    },
    sectionSubtitle: {
        fontSize: DESIGN.typography.caption,
        color: DESIGN.colors.text.tertiary,
        marginBottom: DESIGN.spacing.lg,
    },
    inputWrapper: {
        marginBottom: DESIGN.spacing.lg,
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
    helperText: {
        fontSize: DESIGN.typography.caption,
        color: DESIGN.colors.text.tertiary,
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
    actionButtons: {
        flexDirection: 'row',
        marginHorizontal: DESIGN.spacing.lg,
        gap: DESIGN.spacing.md,
        marginTop: DESIGN.spacing.lg,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: DESIGN.spacing.lg,
        borderRadius: DESIGN.radius.md,
        borderWidth: 2,
        borderColor: DESIGN.colors.border,
        backgroundColor: DESIGN.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: DESIGN.typography.body,
        fontWeight: '600',
        color: DESIGN.colors.text.secondary,
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: DESIGN.colors.primary,
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
        height: DESIGN.spacing.xl * 2,
    },
});
