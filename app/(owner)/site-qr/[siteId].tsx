/**
 * Site QR Code Display Screen
 * Owner can view and share QR code for site enrollment
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { DESIGN } from '../../../constants/designSystem';
import { SiteQRCode } from '../../../components/SiteQRCode';
import { getSiteById } from '../../../lib/mock-api';

export default function SiteQRScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const site = siteId ? getSiteById(siteId) : null;

  if (!site || !site.enrollmentCode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Site QR Code</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={DESIGN.colors.error} />
          <Text style={styles.errorText}>Site not found or enrollment code missing</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      const shareText = `Join ${site.name}!\n\nEnrollment Code: ${site.enrollmentCode}\n\nScan the QR code in the app to join this site.`;
      await Clipboard.setStringAsync(shareText);
      Alert.alert('Copied!', 'Site enrollment information copied to clipboard. You can share it via any messaging app.');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to copy information');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Site QR Code</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SiteQRCode
          siteId={site.id}
          enrollmentCode={site.enrollmentCode}
          siteName={site.name}
          address={site.address}
          onShare={handleShare}
        />
        
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Use:</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="1" size={20} color={DESIGN.colors.primary} />
            <Text style={styles.instructionText}>
              Share this QR code with supervisors, engineers, and labourers
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="2" size={20} color={DESIGN.colors.primary} />
            <Text style={styles.instructionText}>
              They can scan it using the app's QR scanner to join this site
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="3" size={20} color={DESIGN.colors.primary} />
            <Text style={styles.instructionText}>
              Alternatively, they can enter the enrollment code manually: {site.enrollmentCode}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  content: { padding: DESIGN.spacing.lg },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.md,
    textAlign: 'center',
  },
  backButton: {
    marginTop: DESIGN.spacing.xl,
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: DESIGN.spacing.xl,
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instructions: {
    marginTop: DESIGN.spacing.xl,
    padding: DESIGN.spacing.lg,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: DESIGN.colors.text.secondary,
    lineHeight: 20,
  },
});
