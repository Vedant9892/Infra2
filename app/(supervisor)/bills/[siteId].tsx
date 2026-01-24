import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, BILLS_ENDPOINTS } from '../../../constants/api';
import { supabase } from '../../../constants/supabase';
import { useUser } from '../../../contexts/UserContext';

type Bill = {
  id: string;
  amount: number;
  reason: string;
  billImageUrl: string | null;
  createdAt: string;
};

export default function GSTBilling() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
  });

  useEffect(() => {
    fetchBills();
  }, [siteId, user?.id]);

  const fetchBills = async () => {
    try {
      // Fetch bills filtered by supervisor's user ID
      const response = await fetch(`${API_BASE_URL}/api/bills/supervisor/${user?.id}?siteId=${siteId}`);
      const data = await response.json();
      if (data.success) {
        setBills(data.bills || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      Alert.alert('Error', 'Failed to load bills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      setUploading(true);
      const fileName = `bills/${user?.id}-${Date.now()}.jpg`;
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
      setUploading(false);
    }
  };

  const handleAdd = () => {
    setEditingBill(null);
    setFormData({
      amount: '',
      reason: '',
    });
    setSelectedImage(null);
    setImageBase64(null);
    setModalVisible(true);
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      amount: bill.amount.toString(),
      reason: bill.reason,
    });
    setSelectedImage(bill.billImageUrl);
    setImageBase64(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.reason) {
      Alert.alert('Validation', 'Please fill in amount and reason');
      return;
    }

    if (!selectedImage && !editingBill?.billImageUrl) {
      Alert.alert('Validation', 'Please upload a bill image as proof');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      let imageUrl = editingBill?.billImageUrl || null;
      
      // Upload new image if selected
      if (imageBase64 && selectedImage && !editingBill) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          Alert.alert('Error', 'Failed to upload image');
          return;
        }
      }

      const payload = {
        siteId,
        amount: Number(formData.amount),
        reason: formData.reason.trim(),
        billImageUrl: imageUrl,
        createdBy: user.id,
      };

      const url = editingBill
        ? `${API_BASE_URL}${BILLS_ENDPOINTS.UPDATE(editingBill.id)}`
        : `${API_BASE_URL}${BILLS_ENDPOINTS.CREATE}`;
      const method = editingBill ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setModalVisible(false);
        fetchBills();
        Alert.alert('Success', editingBill ? 'Bill updated' : 'Bill saved successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill');
    }
  };

  const handleDelete = (bill: Bill) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete this bill?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}${BILLS_ENDPOINTS.DELETE(bill.id)}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                fetchBills();
                Alert.alert('Success', 'Bill deleted');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete');
              }
            } catch (error) {
              console.error('Error deleting bill:', error);
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>GST Billing</Text>
            <Text style={styles.headerSubtitle}>Track Your Expenses</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={styles.summaryAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        <Text style={styles.summaryCount}>{bills.length} bill{bills.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchBills} />}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.emptyText}>Loading bills...</Text>
          </View>
        ) : bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Bills</Text>
            <Text style={styles.emptyText}>Add your first bill to track expenses</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
              <Text style={styles.emptyButtonText}>Add Bill</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.billHeader}>
                <View style={styles.billInfo}>
                  <Text style={styles.billAmount}>₹{bill.amount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.billReason}>{bill.reason}</Text>
                  <Text style={styles.billDate}>
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {bill.billImageUrl && (
                  <Image source={{ uri: bill.billImageUrl }} style={styles.billThumbnail} />
                )}
              </View>

              <View style={styles.billActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(bill)}
                >
                  <Ionicons name="create-outline" size={18} color="#8B5CF6" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(bill)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBill ? 'Edit Bill' : 'Add New Bill'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Image Upload Section */}
              <View style={styles.imageSection}>
                <Text style={styles.label}>Bill Image (Proof) *</Text>
                {selectedImage ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
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
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Upload bill image as proof</Text>
                  </View>
                )}

                <View style={styles.imageButtons}>
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Ionicons name="images-outline" size={20} color="#8B5CF6" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={20} color="#8B5CF6" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason for Spending *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.reason}
                  onChangeText={(text) => setFormData({ ...formData, reason: text })}
                  placeholder="e.g., Material purchase, Equipment rental, Transportation"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={uploading}
              >
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.saveButtonGradient}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      {bills.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { padding: 8, marginRight: 8 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  summaryAmount: { fontSize: 32, fontWeight: '700', color: '#111', marginBottom: 4 },
  summaryCount: { fontSize: 14, color: '#9CA3AF' },
  scrollView: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginTop: 24, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  emptyButton: { backgroundColor: '#8B5CF6', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  emptyButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billInfo: { flex: 1 },
  billAmount: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  billReason: { fontSize: 16, color: '#374151', marginBottom: 4 },
  billDate: { fontSize: 12, color: '#9CA3AF' },
  billThumbnail: { width: 80, height: 80, borderRadius: 8, marginLeft: 12 },
  billActions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    gap: 6,
  },
  deleteButton: { backgroundColor: '#FEE2E2' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#8B5CF6' },
  deleteText: { color: '#EF4444' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  modalBody: { padding: 20 },
  imageSection: { marginBottom: 20 },
  imagePreview: { position: 'relative', marginBottom: 12 },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  imageButtons: { flexDirection: 'row', gap: 8 },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    gap: 6,
  },
  imageButtonText: { fontSize: 14, fontWeight: '600', color: '#8B5CF6' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
