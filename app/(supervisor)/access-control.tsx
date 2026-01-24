/** Access Control – Supervisor/Manager feature. Manage site access permissions. */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../../constants/designSystem';
import { useUser } from '../../contexts/UserContext';
import { onDataChange } from '../../lib/mock-api';

type AccessPermission = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  siteId: string;
  siteName: string;
  hasAccess: boolean;
  accessLevel: 'full' | 'limited' | 'view_only';
  grantedBy: string;
  grantedAt: Date;
  lastAccess?: Date;
  restrictions?: string[];
};

const MOCK_PERMISSIONS: AccessPermission[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Ramesh Kumar',
    userRole: 'labour',
    siteId: 's1',
    siteName: 'Site A - Residential Complex',
    hasAccess: true,
    accessLevel: 'full',
    grantedBy: 'Supervisor',
    grantedAt: new Date('2026-01-20'),
    lastAccess: new Date('2026-01-24'),
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Suresh Patel',
    userRole: 'labour',
    siteId: 's1',
    siteName: 'Site A - Residential Complex',
    hasAccess: true,
    accessLevel: 'limited',
    grantedBy: 'Supervisor',
    grantedAt: new Date('2026-01-21'),
    lastAccess: new Date('2026-01-24'),
    restrictions: ['No material access', 'No tool access'],
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Vijay Singh',
    userRole: 'labour',
    siteId: 's1',
    siteName: 'Site A - Residential Complex',
    hasAccess: false,
    accessLevel: 'view_only',
    grantedBy: 'Supervisor',
    grantedAt: new Date('2026-01-22'),
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'Amit Sharma',
    userRole: 'labour',
    siteId: 's2',
    siteName: 'Site B - Commercial Building',
    hasAccess: true,
    accessLevel: 'full',
    grantedBy: 'Manager',
    grantedAt: new Date('2026-01-18'),
    lastAccess: new Date('2026-01-24'),
  },
];

export default function AccessControlScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [permissions, setPermissions] = useState<AccessPermission[]>(MOCK_PERMISSIONS);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserSearch, setNewUserSearch] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleToggleAccess = (permission: AccessPermission) => {
    Alert.alert(
      permission.hasAccess ? 'Revoke Access' : 'Grant Access',
      `${permission.hasAccess ? 'Revoke' : 'Grant'} access for ${permission.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: permission.hasAccess ? 'Revoke' : 'Grant',
          style: permission.hasAccess ? 'destructive' : 'default',
          onPress: () => {
            const updated = permissions.map((p) =>
              p.id === permission.id
                ? {
                    ...p,
                    hasAccess: !p.hasAccess,
                    grantedAt: !p.hasAccess ? new Date() : p.grantedAt,
                    lastAccess: !p.hasAccess ? new Date() : undefined,
                  }
                : p
            );
            setPermissions(updated);
            Alert.alert('Success', `Access ${permission.hasAccess ? 'revoked' : 'granted'} successfully`);
            triggerRefresh();
          },
        },
      ]
    );
  };

  const handleChangeAccessLevel = (permission: AccessPermission, level: 'full' | 'limited' | 'view_only') => {
    const updated = permissions.map((p) =>
      p.id === permission.id ? { ...p, accessLevel: level } : p
    );
    setPermissions(updated);
    Alert.alert('Success', `Access level changed to ${level.replace('_', ' ')}`);
    triggerRefresh();
  };

  const triggerRefresh = () => {
    // Trigger global refresh
  };

  const filteredPermissions = permissions.filter((p) => {
    if (filter === 'active') return p.hasAccess;
    if (filter === 'revoked') return !p.hasAccess;
    return true;
  });

  const accessLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return DESIGN.colors.success;
      case 'limited':
        return DESIGN.colors.warning;
      default:
        return DESIGN.colors.text.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Access Control</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle" size={28} color={DESIGN.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'revoked'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{permissions.filter((p) => p.hasAccess).length}</Text>
          <Text style={styles.statLabel}>Active Access</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{permissions.filter((p) => !p.hasAccess).length}</Text>
          <Text style={styles.statLabel}>Revoked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{permissions.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        {filteredPermissions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={DESIGN.colors.text.tertiary} />
            <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} permissions found</Text>
          </View>
        ) : (
          filteredPermissions.map((permission) => (
            <View
              key={permission.id}
              style={[
                styles.card,
                { borderLeftColor: permission.hasAccess ? DESIGN.colors.success : DESIGN.colors.danger },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{permission.userName.charAt(0)}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{permission.userName}</Text>
                    <Text style={styles.userRole}>{permission.userRole.toUpperCase()}</Text>
                    <Text style={styles.siteName}>{permission.siteName}</Text>
                  </View>
                </View>
                <Switch
                  value={permission.hasAccess}
                  onValueChange={() => handleToggleAccess(permission)}
                  trackColor={{ false: DESIGN.colors.border, true: DESIGN.colors.success }}
                  thumbColor={permission.hasAccess ? DESIGN.colors.surface : DESIGN.colors.text.secondary}
                />
              </View>

              {permission.hasAccess && (
                <>
                  <View style={styles.accessLevelContainer}>
                    <Text style={styles.accessLevelLabel}>Access Level:</Text>
                    <View style={styles.accessLevelButtons}>
                      {(['full', 'limited', 'view_only'] as const).map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.accessLevelButton,
                            permission.accessLevel === level && {
                              backgroundColor: accessLevelColor(level),
                            },
                          ]}
                          onPress={() => handleChangeAccessLevel(permission, level)}
                        >
                          <Text
                            style={[
                              styles.accessLevelButtonText,
                              permission.accessLevel === level && { color: DESIGN.colors.surface },
                            ]}
                          >
                            {level.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {permission.restrictions && permission.restrictions.length > 0 && (
                    <View style={styles.restrictionsContainer}>
                      <Text style={styles.restrictionsTitle}>Restrictions:</Text>
                      {permission.restrictions.map((restriction, idx) => (
                        <View key={idx} style={styles.restrictionItem}>
                          <Ionicons name="ban" size={14} color={DESIGN.colors.danger} />
                          <Text style={styles.restrictionText}>{restriction}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person" size={14} color={DESIGN.colors.text.secondary} />
                      <Text style={styles.metaText}>Granted by: {permission.grantedBy}</Text>
                    </View>
                    {permission.lastAccess && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={14} color={DESIGN.colors.text.secondary} />
                        <Text style={styles.metaText}>
                          Last access: {permission.lastAccess.toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grant Access</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={DESIGN.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Search User</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter user name or ID"
                value={newUserSearch}
                onChangeText={setNewUserSearch}
                placeholderTextColor={DESIGN.colors.text.tertiary}
              />
              <Text style={styles.modalHint}>
                Search for users to grant site access. This feature will be connected to user database.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  Alert.alert('Info', 'User search and access granting will be connected to backend user database.');
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Search</Text>
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
  backBtn: { width: 40 },
  title: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
    gap: DESIGN.spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: DESIGN.spacing.xs,
    paddingHorizontal: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.colors.background,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: DESIGN.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
  },
  filterTextActive: {
    color: DESIGN.colors.surface,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    gap: DESIGN.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    alignItems: 'center',
    ...DESIGN.shadow.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
    marginTop: 4,
  },
  scroll: { flex: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN.spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.md,
  },
  card: {
    backgroundColor: DESIGN.colors.surface,
    marginHorizontal: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    borderLeftWidth: 4,
    ...DESIGN.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DESIGN.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.surface,
  },
  userDetails: { flex: 1 },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  userRole: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
    marginTop: 2,
  },
  siteName: {
    fontSize: 12,
    color: DESIGN.colors.text.tertiary,
    marginTop: 2,
  },
  accessLevelContainer: {
    marginTop: DESIGN.spacing.md,
    paddingTop: DESIGN.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  accessLevelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.xs,
  },
  accessLevelButtons: {
    flexDirection: 'row',
    gap: DESIGN.spacing.xs,
  },
  accessLevelButton: {
    flex: 1,
    paddingVertical: DESIGN.spacing.xs,
    paddingHorizontal: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.colors.background,
    alignItems: 'center',
  },
  accessLevelButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    textTransform: 'capitalize',
  },
  restrictionsContainer: {
    marginTop: DESIGN.spacing.md,
    paddingTop: DESIGN.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  restrictionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.xs,
  },
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DESIGN.spacing.xs,
    gap: 6,
  },
  restrictionText: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
  },
  metaRow: {
    marginTop: DESIGN.spacing.md,
    paddingTop: DESIGN.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DESIGN.spacing.xs,
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: DESIGN.colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
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
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  modalBody: {
    padding: DESIGN.spacing.lg,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xs,
  },
  modalInput: {
    backgroundColor: DESIGN.colors.background,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    fontSize: 14,
    color: DESIGN.colors.text.primary,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  modalHint: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
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
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: DESIGN.colors.background,
  },
  modalButtonPrimary: {
    backgroundColor: DESIGN.colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.surface,
  },
});
