/**
 * Site QR Code Component
 * Generates QR code for site enrollment (like Moodle enrollment code)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { DESIGN } from '../constants/designSystem';

// Simple QR code representation using text/visual pattern
// In production, use a proper QR library like react-native-qrcode-svg or expo-qr

type SiteQRCodeProps = {
  siteId: string;
  enrollmentCode: string;
  siteName: string;
  address?: string;
  onShare?: () => void;
};

export function SiteQRCode({ siteId, enrollmentCode, siteName, address, onShare }: SiteQRCodeProps) {
  // QR code data format: JSON with site info
  const qrData = JSON.stringify({
    type: 'site_enrollment',
    siteId,
    enrollmentCode,
    siteName,
    address,
    timestamp: Date.now(),
  });

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(enrollmentCode);
    Alert.alert('Copied!', `Enrollment code "${enrollmentCode}" copied to clipboard`);
  };

  const handleCopyQRData = async () => {
    await Clipboard.setStringAsync(qrData);
    Alert.alert('Copied!', 'QR code data copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="qr-code" size={32} color={DESIGN.colors.primary} />
        <Text style={styles.title}>Site Enrollment QR Code</Text>
      </View>

      {/* QR Code Visual Representation */}
      <View style={styles.qrContainer}>
        <View style={styles.qrCode}>
          {/* Simple visual QR representation */}
          <View style={styles.qrGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={styles.qrRow}>
                {Array.from({ length: 12 }).map((_, j) => (
                  <View
                    key={j}
                    style={[
                      styles.qrCell,
                      (i + j) % 3 === 0 || (i * j) % 7 === 0 ? styles.qrCellFilled : null,
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.enrollmentCode}>{enrollmentCode}</Text>
        <Text style={styles.siteName}>{siteName}</Text>
        {address && <Text style={styles.address}>{address}</Text>}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
          <Ionicons name="copy-outline" size={20} color={DESIGN.colors.primary} />
          <Text style={styles.actionText}>Copy Code</Text>
        </TouchableOpacity>
        {onShare && (
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="share-outline" size={20} color={DESIGN.colors.primary} />
            <Text style={styles.actionText}>Share QR</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color={DESIGN.colors.info} />
        <Text style={styles.infoText}>
          Share this QR code with supervisors, engineers, and labourers to join this site.
          They can scan it using the app's QR scanner.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    padding: DESIGN.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: DESIGN.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginTop: DESIGN.spacing.sm,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: DESIGN.spacing.lg,
  },
  qrCode: {
    backgroundColor: '#fff',
    padding: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 2,
    borderColor: DESIGN.colors.border,
  },
  qrGrid: {
    width: 200,
    height: 200,
  },
  qrRow: {
    flexDirection: 'row',
    flex: 1,
  },
  qrCell: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 1,
  },
  qrCellFilled: {
    backgroundColor: '#000',
  },
  enrollmentCode: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.primary,
    marginTop: DESIGN.spacing.md,
    letterSpacing: 2,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN.colors.text.primary,
    marginTop: DESIGN.spacing.sm,
    textAlign: 'center',
  },
  address: {
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.xs,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN.spacing.sm,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: '#F3E8FF',
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.primary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DESIGN.spacing.sm,
    padding: DESIGN.spacing.md,
    backgroundColor: '#EFF6FF',
    borderRadius: DESIGN.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: DESIGN.colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: DESIGN.colors.text.secondary,
    lineHeight: 18,
  },
});
