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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL, STOCK_ENDPOINTS } from '../../../constants/api';

type StockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  location: string;
  notes: string;
  lastUpdated: string;
};

export default function StockTracking() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    quantity: '',
    unit: 'units',
    minThreshold: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchStock();
  }, [siteId]);

  const fetchStock = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${STOCK_ENDPOINTS.GET_ALL(siteId!)}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      Alert.alert('Error', 'Failed to load stock items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'General',
      quantity: '',
      unit: 'units',
      minThreshold: '',
      location: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minThreshold: item.minThreshold.toString(),
      location: item.location,
      notes: item.notes,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.quantity) {
      Alert.alert('Validation', 'Please fill in name and quantity');
      return;
    }

    try {
      const payload = {
        siteId,
        name: formData.name.trim(),
        category: formData.category.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit.trim(),
        minThreshold: formData.minThreshold ? Number(formData.minThreshold) : 0,
        location: formData.location.trim(),
        notes: formData.notes.trim(),
      };

      const url = editingItem
        ? `${API_BASE_URL}${STOCK_ENDPOINTS.UPDATE(editingItem.id)}`
        : `${API_BASE_URL}${STOCK_ENDPOINTS.CREATE}`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setModalVisible(false);
        fetchStock();
        Alert.alert('Success', editingItem ? 'Stock item updated' : 'Stock item added');
      } else {
        Alert.alert('Error', data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving stock:', error);
      Alert.alert('Error', 'Failed to save stock item');
    }
  };

  const handleDelete = (item: StockItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}${STOCK_ENDPOINTS.DELETE(item.id)}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                fetchStock();
                Alert.alert('Success', 'Item deleted');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete');
              }
            } catch (error) {
              console.error('Error deleting stock:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (item: StockItem) => {
    if (item.quantity <= item.minThreshold) return '#EF4444';
    if (item.quantity <= item.minThreshold * 1.5) return '#F59E0B';
    return '#10B981';
  };

  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Stock Tracking</Text>
            <Text style={styles.headerSubtitle}>Manage Inventory</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {lowStockItems.length > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.alertText}>
            {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below threshold
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStock} />}
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Stock Items</Text>
            <Text style={styles.emptyText}>Add your first inventory item to get started</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
              <Text style={styles.emptyButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item)}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
                    {item.quantity <= item.minThreshold ? 'Low' : 'OK'}
                  </Text>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="cube" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {item.quantity} {item.unit}
                  </Text>
                  {item.minThreshold > 0 && (
                    <Text style={styles.thresholdText}>
                      (Min: {item.minThreshold} {item.unit})
                    </Text>
                  )}
                </View>
                {item.location && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.location}</Text>
                  </View>
                )}
                {item.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(item)}
                >
                  <Ionicons name="create-outline" size={18} color="#8B5CF6" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item)}
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
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Cement, Steel Rods"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="e.g., Construction Materials"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                    placeholder="units, kg, bags"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum Threshold</Text>
                <TextInput
                  style={styles.input}
                  value={formData.minThreshold}
                  onChangeText={(text) => setFormData({ ...formData, minThreshold: text })}
                  placeholder="Alert when below this"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Storage location"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes"
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
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      {items.length > 0 && (
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  alertText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  scrollView: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginTop: 24, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  emptyButton: { backgroundColor: '#8B5CF6', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  emptyButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  itemCard: {
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
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  itemCategory: { fontSize: 14, color: '#6B7280' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  itemDetails: { marginBottom: 12, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#374151', flex: 1 },
  thresholdText: { fontSize: 12, color: '#9CA3AF' },
  itemActions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
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
  row: { flexDirection: 'row' },
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
