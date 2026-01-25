/**
 * Universal QR Code Scanner
 * Works for all roles: Labour, Supervisor, Engineer, etc.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUser } from '../../contexts/UserContext';
import { DESIGN } from '../../constants/designSystem';
import { API_BASE_URL, LABOUR_ENDPOINTS } from '../../constants/api';

export default function UniversalScanQRScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [joining, setJoining] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(
    async (evt: { data?: string; nativeEvent?: { data?: string } }) => {
      if (scanned || joining) {
        return;
      }
      
      const data = evt?.data ?? evt?.nativeEvent?.data;
      const code = (data || '').trim();
      if (!code) return;
      
      setScanned(true);
      setJoining(true);

      try {
        let enrollmentCode = code;
        try {
          const qrData = JSON.parse(code);
          if (qrData.type === 'site_enrollment' && qrData.enrollmentCode) {
            enrollmentCode = qrData.enrollmentCode;
          }
        } catch {
          // Not JSON, use as plain code
        }

        const userId = user?.id;
        if (!userId) {
          setScanned(false);
          setJoining(false);
          Alert.alert('Error', 'User not authenticated. Please login again.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}${LABOUR_ENDPOINTS.SITE.JOIN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            siteCode: enrollmentCode,
            userId: userId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (user && result.site) {
            setUser({
              ...user,
              currentSiteId: result.site._id || result.site.id,
              currentSiteName: result.site.name,
              enrollmentStatus: 'active',
            });
          }
          
          const userRole = user?.role;
          if (userRole === 'labour') {
            router.replace('/(labour)/(tabs)/projects');
          } else if (userRole === 'site_supervisor' || userRole === 'supervisor') {
            router.replace('/(supervisor)/projects');
          } else if (userRole === 'junior_engineer' || userRole === 'senior_engineer' || userRole === 'engineer') {
            router.replace('/(tabs)/home');
          } else if (userRole === 'owner' || userRole === 'site_owner') {
            router.replace('/(owner)/sites');
          } else {
            router.back();
          }
        } else {
          setScanned(false);
          setJoining(false);
          Alert.alert('Error', result.error || 'Invalid QR code. Please scan a valid site enrollment QR code.');
        }
      } catch (error: any) {
        console.error('Error joining site:', error);
        setScanned(false);
        setJoining(false);
        Alert.alert('Error', 'Failed to join site. Please try again.');
      } finally {
        setJoining(false);
      }
    },
    [scanned, joining, user, setUser, router]
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={DESIGN.colors.primary} />
          <Text style={styles.helper}>Checking camera permission…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Site QR</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={DESIGN.colors.text.secondary} />
          <Text style={styles.helper}>Camera access is required to scan site QR codes.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'org.iso.QRCode'],
          }}
          onBarcodeScanned={scanned || joining ? undefined : handleBarCodeScanned}
          enableTorch={false}
        />
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.titleLight}>Scan Site QR Code</Text>
            <View style={styles.backBtn} />
          </View>
          <View style={styles.finder} />
          <Text style={styles.hint}>Point camera at site enrollment QR code</Text>
          {joining ? (
            <View style={styles.joiningWrap}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.joiningText}>Joining site…</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  titleLight: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cameraWrap: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  helper: { marginTop: DESIGN.spacing.md, fontSize: 14, color: DESIGN.colors.text.secondary, textAlign: 'center' },
  permBtn: {
    marginTop: DESIGN.spacing.xl,
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: DESIGN.spacing.xl,
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
  },
  permBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  finder: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: DESIGN.spacing.xl,
  },
  joiningWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN.spacing.sm,
    paddingBottom: DESIGN.spacing.xl,
  },
  joiningText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
