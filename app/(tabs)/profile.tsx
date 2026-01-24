import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Language } from '../../contexts/LanguageContext';
import { DESIGN } from '../../constants/designSystem';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { language } = useLanguage();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getLanguageDisplay = (): string => {
    const langs: Partial<Record<Language, string>> = {
      en: 'English',
      hi: 'हिंदी',
      mr: 'मराठी',
      ta: 'தமிழ்',
    };
    return langs[language] ?? 'English';
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          Profile
        </Text>
        <Ionicons name="notifications-outline" size={24} color={DESIGN.colors.text.primary} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user?.profilePhoto ? (
            <Image
              source={{ uri: user.profilePhoto }}
              style={styles.profilePhoto}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person-circle" size={80} color={DESIGN.colors.primary} />
          )}
        </View>
        <Text style={styles.name} allowFontScaling={false}>
          {user?.name || 'User'}
        </Text>
        <Text style={styles.role} allowFontScaling={false}>
          {user ? getRoleDisplay(user.role) : 'Guest'}
        </Text>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.status} allowFontScaling={false}>
            Active
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="call" size={20} color={DESIGN.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel} allowFontScaling={false}>
              Phone Number
            </Text>
            <Text style={styles.infoText} allowFontScaling={false}>
              {user?.phoneNumber || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={20} color={DESIGN.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel} allowFontScaling={false}>
              Location
            </Text>
            <Text style={styles.infoText} allowFontScaling={false}>
              {user?.location || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="language" size={20} color={DESIGN.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel} allowFontScaling={false}>
              Language
            </Text>
            <Text style={styles.infoText} allowFontScaling={false}>
              {getLanguageDisplay()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="settings-outline" size={24} color={DESIGN.colors.text.secondary} />
            <Text style={styles.menuText} allowFontScaling={false}>
              Settings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={DESIGN.colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={24} color={DESIGN.colors.text.secondary} />
            <Text style={styles.menuText} allowFontScaling={false}>
              Help & Support
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={DESIGN.colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="information-circle-outline" size={24} color={DESIGN.colors.text.secondary} />
            <Text style={styles.menuText} allowFontScaling={false}>
              About
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={DESIGN.colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={DESIGN.colors.surface} />
        <Text style={styles.logoutText} allowFontScaling={false}>
          Logout
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 3,
    paddingBottom: DESIGN.spacing.lg,
    backgroundColor: DESIGN.colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
  },
  profileCard: {
    backgroundColor: DESIGN.colors.surface,
    marginHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.xl,
    borderRadius: DESIGN.radius.lg,
    alignItems: 'center',
    ...DESIGN.shadow.sm,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: DESIGN.spacing.lg,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: DESIGN.colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: DESIGN.spacing.xs,
    color: DESIGN.colors.text.primary,
  },
  role: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.xs,
    borderRadius: DESIGN.radius.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN.colors.success,
    marginRight: DESIGN.spacing.sm,
  },
  status: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.success,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: DESIGN.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.lg,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.lg,
    ...DESIGN.shadow.sm,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.tertiary,
    marginBottom: DESIGN.spacing.xs,
  },
  infoText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.primary,
    fontWeight: '500',
  },
  menuSection: {
    marginHorizontal: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    ...DESIGN.shadow.sm,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    marginLeft: DESIGN.spacing.lg,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: DESIGN.spacing.lg,
    marginTop: DESIGN.spacing.xl,
    backgroundColor: DESIGN.colors.danger,
    paddingVertical: DESIGN.spacing.lg,
    borderRadius: DESIGN.radius.md,
    ...DESIGN.shadow.md,
    elevation: 4,
  },
  logoutText: {
    color: DESIGN.colors.surface,
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    marginLeft: DESIGN.spacing.sm,
  },
  bottomSpacer: {
    height: DESIGN.spacing.xl * 4,
  },
});
