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
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { joinSiteByCode } from '../../../lib/mock-api';

export default function ScanQRScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [joining, setJoining] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(
    (evt: { data?: string; nativeEvent?: { data?: string } }) => {
      if (scanned || joining) return;
      const data = evt?.data ?? evt?.nativeEvent?.data;
      const code = (data || '').trim();
      if (!code) return;
      setScanned(true);
      setJoining(true);
      const uid = user?.id ?? 'u1';
      const userRole = user?.role;
      const result = joinSiteByCode(code, uid, userRole);
      setJoining(false);
      if (result.success) {
        Alert.alert('Success', `Connected to ${result.site?.name ?? 'site'}`, [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate based on role
              if (userRole === 'labour') {
                router.replace('/(labour)/(tabs)/projects');
              } else if (userRole === 'site_supervisor' || userRole === 'supervisor') {
                router.replace('/(supervisor)/(tabs)/home');
              } else if (userRole === 'junior_engineer' || userRole === 'senior_engineer' || userRole === 'engineer') {
                router.replace('/(tabs)/home');
              } else {
                router.back();
              }
            }
          },
        ]);
      } else {
        Alert.alert('Error', 'Invalid QR code. Please scan a valid site enrollment QR code.', [
          { text: 'OK', onPress: () => { setScanned(false); } },
        ]);
      }
    },
    [scanned, joining, user?.id, user?.role, router]
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
        />
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.titleLight}>Scan Site QR</Text>
            <View style={styles.backBtn} />
          </View>
          <View style={styles.finder} />
          <Text style={styles.hint}>Point camera at site QR code</Text>
          {joining ? (
            <View style={styles.joiningWrap}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.joiningText}>Joining…</Text>
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
