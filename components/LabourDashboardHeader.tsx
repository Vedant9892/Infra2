import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { DESIGN } from '../constants/designSystem';

export function LabourDashboardHeader() {
  const { user } = useUser();
  const photoUrl = user?.profilePhoto ?? null;
  const name = user?.name?.trim() || 'Labour';

  const getInitials = (n: string) => {
    if (!n) return '?';
    return n
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initials} allowFontScaling={false}>
              {getInitials(name)}
            </Text>
          </View>
        )}
        <View>
          <Text style={styles.name} allowFontScaling={false} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.role} allowFontScaling={false}>
            LABOUR
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.BASE_PADDING,
    paddingVertical: DESIGN.spacing.lg,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
    ...(Platform.OS === 'android' ? { elevation: 2 } : DESIGN.shadow.sm),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '700',
    color: DESIGN.colors.surface,
  },
  name: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  role: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.xs,
  },
});
