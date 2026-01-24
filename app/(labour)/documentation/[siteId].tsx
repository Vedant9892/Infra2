/** Site Documentation – Upload documents with comments */
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
  Modal,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getWorkPhotos, addWorkPhoto, onDataChange } from '../../../lib/mock-api';
import { supabase } from '../../../constants/supabase';
import { format } from 'date-fns';

type Document = {
  id: string;
  photoUrl: string;
  timestamp: string;
  userId?: string;
  comment?: string;
};

export default function LabourDocumentationScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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
    setTimeout(() => setRefreshing(false), 400);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageBase64 || !selectedImage) return null;

    try {
      setUploadingImage(true);
      const fileName = `documentation/${user?.id}-${Date.now()}.jpg`;
      const base64Data = imageBase64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { error: uploadError } = await supabase.storage
        .from('bill-images')
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('bill-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitDocument = async () => {
    if (!siteId) {
      Alert.alert('Error', 'Missing site');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Error', 'Please select a document/image');
      return;
    }

    setUploading(true);
    try {
      // Upload image to Supabase
      const imageUrl = await uploadImage();
      
      if (!imageUrl) {
        Alert.alert('Error', 'Failed to upload image');
        setUploading(false);
        return;
      }

      const uid = user?.id ?? 'u1';
      
      // Add work photo with comment (using uploaded imageUrl from Supabase)
      addWorkPhoto(siteId, uid, imageUrl, comment.trim() || undefined);
      load();
      Alert.alert('Success', 'Document uploaded successfully with comment');
      
      // Reset form
      setSelectedImage(null);
      setImageBase64(null);
      setComment('');
      setShowUploadModal(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
    setSelectedImage(null);
    setImageBase64(null);
    setComment('');
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
        <Text style={styles.title}>Site Documentation</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <Text style={styles.hint}>Upload documents/photos with comments for site documentation.</Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, uploading && styles.btnDisabled]}
          onPress={handleOpenUploadModal}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={22} color="#fff" />
              <Text style={styles.btnText}>Upload Document</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {photos.length === 0 ? (
            <Text style={styles.empty}>No documents uploaded yet.</Text>
          ) : (
            photos.map((p) => (
              <View key={p.id} style={styles.card}>
                {p.photoUrl && 
                 p.photoUrl !== '' && 
                 !p.photoUrl.startsWith('mock://') ? (
                  <Image
                    source={{ uri: p.photoUrl }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTime}>{format(new Date(p.timestamp), 'MMM dd, yyyy • hh:mm a')}</Text>
                  {p.comment && (
                    <Text style={styles.cardComment} numberOfLines={2}>
                      {p.comment}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Upload Document Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowUploadModal(false);
                  setSelectedImage(null);
                  setImageBase64(null);
                  setComment('');
                }}
              >
                <Ionicons name="close" size={24} color={DESIGN.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Image Selection */}
              <View style={styles.imageSelectionContainer}>
                <Text style={styles.modalLabel}>Select Document/Image</Text>
                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={[styles.imageButton, styles.imageButtonCamera]}
                    onPress={takePhoto}
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.imageButtonGradient}
                    >
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.imageButtonText}>Camera</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageButton, styles.imageButtonGallery]}
                    onPress={pickImage}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.imageButtonGradient}
                    >
                      <Ionicons name="images" size={24} color="#fff" />
                      <Text style={styles.imageButtonText}>Gallery</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {selectedImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setSelectedImage(null);
                        setImageBase64(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Comment Input */}
              <View style={styles.commentContainer}>
                <Text style={styles.modalLabel}>Add Comment (Optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Enter comment about this document..."
                  placeholderTextColor={DESIGN.colors.text.tertiary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.commentHint}>
                  Describe what this document shows or any relevant information
                </Text>
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowUploadModal(false);
                  setSelectedImage(null);
                  setImageBase64(null);
                  setComment('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSubmit,
                  (!selectedImage || uploading || uploadingImage) && styles.modalButtonDisabled,
                ]}
                onPress={handleSubmitDocument}
                disabled={!selectedImage || uploading || uploadingImage}
              >
                {uploading || uploadingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.submitButtonGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalButtonSubmitText}>Submit Document</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.colors.background,
  },
  cardContent: {
    flex: 1,
  },
  cardTime: { fontSize: 13, color: DESIGN.colors.text.secondary, marginBottom: 4 },
  cardComment: {
    fontSize: 12,
    color: DESIGN.colors.text.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: { backgroundColor: DESIGN.colors.primary, paddingHorizontal: DESIGN.spacing.xl, paddingVertical: DESIGN.spacing.md, borderRadius: DESIGN.radius.sm },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DESIGN.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  modalBody: {
    padding: DESIGN.spacing.lg,
    maxHeight: 500,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
  },
  imageSelectionContainer: {
    marginBottom: DESIGN.spacing.xl,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
  },
  imageButton: {
    flex: 1,
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
  },
  imageButtonGradient: {
    padding: DESIGN.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: DESIGN.spacing.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: DESIGN.radius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  commentContainer: {
    marginTop: DESIGN.spacing.md,
  },
  commentInput: {
    backgroundColor: DESIGN.colors.background,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    fontSize: 14,
    color: DESIGN.colors.text.primary,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  commentHint: {
    fontSize: 12,
    color: DESIGN.colors.text.tertiary,
    marginTop: DESIGN.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    padding: DESIGN.spacing.lg,
    gap: DESIGN.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  modalButton: {
    flex: 1,
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
  },
  modalButtonCancel: {
    backgroundColor: DESIGN.colors.background,
    paddingVertical: DESIGN.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
  },
  modalButtonSubmit: {
    overflow: 'hidden',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.md,
    gap: 8,
  },
  modalButtonSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
