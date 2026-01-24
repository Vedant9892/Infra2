import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN } from '../constants/designSystem';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getInitials(name: string) {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export interface DashboardHeaderProps {
  name?: string;
  role?: string;
  profilePhoto?: string | null;
  onSearch?: () => void;
  containerStyle?: ViewStyle;
}

export function DashboardHeader({
  name = '',
  role = '',
  profilePhoto,
  onSearch,
  containerStyle,
}: DashboardHeaderProps) {
  const greeting = getGreeting();
  const displayName = name?.trim() || 'User';
  const displayRole = (role || 'member').toUpperCase();

  return (
    <View style={[styles.header, containerStyle]}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{displayRole}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={onSearch}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={22} color="#111" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 2.5,
    paddingBottom: DESIGN.spacing.lg,
    backgroundColor: DESIGN.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.md,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: DESIGN.colors.text.secondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN.colors.primary,
    letterSpacing: 0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
