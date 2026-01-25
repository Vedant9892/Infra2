/** Labour Attendance – with GPS geofence validation */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../../contexts/UserContext';
import { DESIGN } from '../../../constants/designSystem';
import { getAttendanceApproved, markAttendance, onDataChange } from '../../../lib/mock-api';
import { format } from 'date-fns';
import { API_BASE_URL, LABOUR_ENDPOINTS } from '../../../constants/api';

const { width, height } = Dimensions.get('window');

// Labour dataset - Based on LabourImages folder structure
const LABOUR_DATASET = [
  {
    id: 'labour1',
    name: 'Vedant',
    age: 21,
    imagePaths: [
      'c:\\HACK2\\Infra2\\face_rec\\LabourImages\\Labour1\\img1.jpeg',
      'c:\\HACK2\\Infra2\\face_rec\\LabourImages\\Labour1\\img2.jpeg',
      'c:\\HACK2\\Infra2\\face_rec\\LabourImages\\Labour1\\img3.jpeg',
    ],
  },
  {
    id: 'labour2',
    name: 'Chetan',
    age: 20,
    imagePaths: [
      'c:\\HACK2\\Infra2\\face_rec\\LabourImages\\Labour2\\img1.jpeg',
      'c:\\HACK2\\Infra2\\face_rec\\LabourImages\\Labour2\\img2.jpeg',
    ],
  },
];

type RecognizedLabour = {
  id: string;
  name: string;
  age: number;
  confidence: number;
};

export default function LabourAttendanceScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [todayMarked, setTodayMarked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<{ id: string; address: string; timestamp: string; status: string }[]>([]);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('Getting location...');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [recognizedLabour, setRecognizedLabour] = useState<RecognizedLabour | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [siteData, setSiteData] = useState<{ latitude: number; longitude: number; radius: number } | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
  const [distanceFromSite, setDistanceFromSite] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!siteId) return;
    const approved = getAttendanceApproved(siteId);
    setList(approved.map((a) => ({ id: a.id, address: a.address, timestamp: a.timestamp, status: a.status })));
  }, [siteId]);

  // Calculate distance between two GPS coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Fetch site details for geofence validation
  useEffect(() => {
    if (!siteId) return;

    const fetchSiteDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${LABOUR_ENDPOINTS.SITE.GET_DETAILS(siteId)}`);
        const data = await response.json();
        
        if (data.success && data.site) {
          setSiteData({
            latitude: parseFloat(data.site.latitude) || 0,
            longitude: parseFloat(data.site.longitude) || 0,
            radius: data.site.radius || 100,
          });
        }
      } catch (error) {
        console.error('Error fetching site details:', error);
      }
    };

    fetchSiteDetails();
  }, [siteId]);

  // Check geofence when location or site data changes
  useEffect(() => {
    if (!currentLocation || !siteData) {
      setIsWithinGeofence(null);
      return;
    }

    const distance = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      siteData.latitude,
      siteData.longitude
    );

    setDistanceFromSite(distance);
    setIsWithinGeofence(distance <= siteData.radius);
  }, [currentLocation, siteData]);

  useEffect(() => {
    load();
    // Auto-refresh when data changes (cross-dashboard communication)
    const unsubscribe = onDataChange(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  useEffect(() => {
    // Request location permission and get current location
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission({ status } as Location.LocationPermissionResponse);
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(loc);
        
        // Get address from coordinates
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            const formattedAddress = [
              addr.street || addr.name,
              addr.district || addr.subregion,
              addr.city,
              addr.region,
            ]
              .filter(Boolean)
              .join(', ');
            setLocationAddress(formattedAddress || 'Address not available');
          }
        } catch (error) {
          setLocationAddress('Address not available');
        }
      }
    })();

    // Update date/time every second
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Face recognition function (similar to supervisor)
  const recognizeFace = async (capturedImageUri: string): Promise<RecognizedLabour | null> => {
    try {
      // TODO: Integrate with proper face recognition library
      // For now, simulate recognition with random match
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulate recognition - randomly return a match or null
      if (Math.random() > 0.3) {
        const randomLabour = LABOUR_DATASET[Math.floor(Math.random() * LABOUR_DATASET.length)];
        return {
          id: randomLabour.id,
          name: randomLabour.name,
          age: randomLabour.age,
          confidence: 0.85 + Math.random() * 0.1,
        };
      }
      return null;
    } catch (error) {
      console.error('Face recognition error:', error);
      return null;
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);
      
      // Use ImagePicker for reliable photo capture
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required');
        setIsCapturing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        cameraType: facing === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        setIsCapturing(false);
        return;
      }

      const photoUri = result.assets[0].uri;

      // Recognize face
      const recognized = await recognizeFace(photoUri);
      
      if (recognized) {
        setRecognizedLabour(recognized);
        setShowResultModal(true);
      } else {
        Alert.alert('Not Recognized', 'Face not recognized. Please try again.');
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleMarkWithCamera = async () => {
    // Check geofence first
    if (isWithinGeofence === false) {
      Alert.alert(
        'Outside Site Area',
        `You are ${Math.round(distanceFromSite || 0)}m away from the site. You must be within ${siteData?.radius || 100}m to mark attendance.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (isWithinGeofence === null) {
      Alert.alert('Checking Location', 'Please wait while we verify your location...');
      return;
    }

    if (!cameraPermission) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for face recognition');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleMarkWithoutCamera = async () => {
    if (!siteId) {
      Alert.alert('Error', 'Missing site');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services');
      return;
    }

    // Check geofence
    if (isWithinGeofence === false) {
      Alert.alert(
        'Outside Site Area',
        `You are ${Math.round(distanceFromSite || 0)}m away from the site. You must be within ${siteData?.radius || 100}m to mark attendance.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (isWithinGeofence === null) {
      Alert.alert('Checking Location', 'Please wait while we verify your location...');
      return;
    }

    setLoading(true);
    try {
      const uid = user?.id ?? 'u1';
      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;
      const addr = locationAddress || 'Address not available';
      
      // Mark attendance without photo
      markAttendance(uid, 'no-photo', lat, lon, addr, siteId);
      setTodayMarked(true);
      load();
      Alert.alert('Success', 'Attendance marked successfully. Location and time recorded.');
      setShowModeSelection(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendanceFromCamera = async () => {
    if (!recognizedLabour || !user?.id || !siteId) {
      Alert.alert('Error', 'Unable to mark attendance');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services');
      return;
    }

    // Check geofence
    if (isWithinGeofence === false) {
      Alert.alert(
        'Outside Site Area',
        `You are ${Math.round(distanceFromSite || 0)}m away from the site. You must be within ${siteData?.radius || 100}m to mark attendance.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (isWithinGeofence === null) {
      Alert.alert('Checking Location', 'Please wait while we verify your location...');
      return;
    }

    try {
      const uid = user.id;
      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;
      const addr = locationAddress || 'Address not available';
      
      // Mark attendance with photo (using a placeholder URI for now)
      markAttendance(uid, 'photo://face-recognized', lat, lon, addr, siteId);
      setTodayMarked(true);
      load();
      Alert.alert(
        'Attendance Marked!',
        `${recognizedLabour.name} marked as present.\n\nLocation: ${addr}\n\nWaiting for supervisor approval.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowResultModal(false);
              setShowCamera(false);
              setRecognizedLabour(null);
              setShowModeSelection(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Mark attendance error:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const formatLocation = () => {
    if (!currentLocation) return 'Location: Getting...';
    const { latitude, longitude } = currentLocation.coords;
    return `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  if (!siteId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Missing site</Text>
          <TouchableOpacity style={styles.backBtnFull} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Mark Attendance</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <Text style={styles.hint}>GPS-fenced check-in. Choose how you want to mark your attendance.</Text>
        
        {/* Geofence Status */}
        {isWithinGeofence !== null && (
          <View style={[styles.geofenceStatus, isWithinGeofence ? styles.geofenceStatusValid : styles.geofenceStatusInvalid]}>
            <Ionicons 
              name={isWithinGeofence ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isWithinGeofence ? "#10B981" : "#EF4444"} 
            />
            <Text style={[styles.geofenceStatusText, isWithinGeofence ? styles.geofenceStatusTextValid : styles.geofenceStatusTextInvalid]}>
              {isWithinGeofence 
                ? `✓ Within site area (${Math.round(distanceFromSite || 0)}m from center)`
                : `✗ Outside site area (${Math.round(distanceFromSite || 0)}m away, must be within ${siteData?.radius || 100}m)`
              }
            </Text>
          </View>
        )}
        
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardWithCamera, isWithinGeofence === false && styles.modeCardDisabled]}
            onPress={handleMarkWithCamera}
            disabled={loading || isWithinGeofence === false}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.modeCardGradient}
            >
              <Ionicons name="camera" size={32} color="#fff" />
              <Text style={styles.modeCardTitle}>With Camera</Text>
              <Text style={styles.modeCardSubtitle}>Face recognition attendance</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardWithoutCamera, isWithinGeofence === false && styles.modeCardDisabled]}
            onPress={handleMarkWithoutCamera}
            disabled={loading || isWithinGeofence === false}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.modeCardGradient}
            >
              <Ionicons name="location" size={32} color="#fff" />
              <Text style={styles.modeCardTitle}>Without Camera</Text>
              <Text style={styles.modeCardSubtitle}>Location & time only</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {todayMarked ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={24} color={DESIGN.colors.success} />
            <Text style={styles.successText}>Marked today</Text>
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          {list.length === 0 ? (
            <Text style={styles.empty}>No records yet.</Text>
          ) : (
            list.slice(0, 5).map((a) => (
              <View key={a.id} style={styles.card}>
                <Text style={styles.cardMeta}>{a.address}</Text>
                <Text style={styles.cardTime}>{new Date(a.timestamp).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Camera View Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => {
          setShowCamera(false);
          setRecognizedLabour(null);
        }}
        presentationStyle="fullScreen"
      >
        {cameraPermission?.granted ? (
          <SafeAreaView style={styles.cameraContainer} edges={['top']}>
            <StatusBar style="light" />
            <CameraView
              style={styles.camera}
              facing={facing}
              mode="picture"
            >
              {/* Overlay */}
              <View style={styles.cameraOverlay}>
                {/* Header */}
                <View style={styles.cameraHeader}>
                  <TouchableOpacity
                    style={styles.cameraBackButton}
                    onPress={() => {
                      setShowCamera(false);
                      setRecognizedLabour(null);
                    }}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.cameraHeaderTitle}>Face Recognition</Text>
                  <TouchableOpacity
                    style={styles.cameraFlipButton}
                    onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
                  >
                    <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Info Overlay */}
                <View style={styles.cameraInfoOverlay}>
                  <View style={styles.cameraInfoItem}>
                    <Ionicons name="location" size={14} color="#fff" />
                    <Text style={styles.cameraInfoText}>{formatLocation()}</Text>
                  </View>
                  <View style={styles.cameraInfoItem}>
                    <Ionicons name="calendar" size={14} color="#fff" />
                    <Text style={styles.cameraInfoText}>
                      {format(currentDateTime, 'dd MMM yyyy')}
                    </Text>
                  </View>
                  <View style={styles.cameraInfoItem}>
                    <Ionicons name="time" size={14} color="#fff" />
                    <Text style={styles.cameraInfoText}>
                      {format(currentDateTime, 'HH:mm:ss')}
                    </Text>
                  </View>
                </View>

                {/* Face Guide */}
                <View style={styles.cameraFaceGuide}>
                  <View style={styles.cameraFaceGuideCircle} />
                  <Text style={styles.cameraFaceGuideText}>Position face in the circle</Text>
                </View>

                {/* Capture Button */}
                <View style={styles.cameraCaptureContainer}>
                  <TouchableOpacity
                    style={[styles.cameraCaptureButton, isCapturing && styles.cameraCaptureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <ActivityIndicator size="large" color="#fff" />
                    ) : (
                      <View style={styles.cameraCaptureButtonInner} />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.cameraCaptureHint}>
                    {isCapturing ? 'Recognizing...' : 'Tap to capture'}
                  </Text>
                </View>
              </View>
            </CameraView>
          </SafeAreaView>
        ) : (
          <View style={styles.cameraPermissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#8B5CF6" />
            <Text style={styles.cameraPermissionTitle}>Camera Permission Required</Text>
            <Text style={styles.cameraPermissionText}>
              We need camera access for face recognition attendance
            </Text>
            <TouchableOpacity
              style={styles.cameraPermissionButton}
              onPress={requestCameraPermission}
            >
              <Text style={styles.cameraPermissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraPermissionCancelButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cameraPermissionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Recognition Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.resultModalOverlay}>
          <View style={styles.resultModalContent}>
            {recognizedLabour ? (
              <>
                <View style={styles.resultModalHeader}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                  <Text style={styles.resultModalTitle}>Face Recognized!</Text>
                </View>

                <View style={styles.resultLabourInfo}>
                  <Text style={styles.resultLabourName}>{recognizedLabour.name}</Text>
                  <Text style={styles.resultLabourAge}>Age: {recognizedLabour.age}</Text>
                  <Text style={styles.resultLabourConfidence}>
                    Confidence: {(recognizedLabour.confidence * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.resultModalActions}>
                  <TouchableOpacity
                    style={styles.resultCancelButton}
                    onPress={() => {
                      setShowResultModal(false);
                      setRecognizedLabour(null);
                    }}
                  >
                    <Text style={styles.resultCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resultMarkButton}
                    onPress={handleMarkAttendanceFromCamera}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.resultMarkButtonGradient}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.resultMarkButtonText}>Mark Present</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.resultModalHeader}>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
                <Text style={styles.resultModalTitle}>Not Recognized</Text>
                <Text style={styles.resultModalSubtitle}>
                  Face not found in database. Please try again.
                </Text>
                <TouchableOpacity
                  style={styles.resultCloseButton}
                  onPress={() => setShowResultModal(false)}
                >
                  <Text style={styles.resultCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
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
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  scroll: { flex: 1 },
  content: { padding: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.xl * 2 },
  hint: { fontSize: 14, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.xl },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.md,
    paddingVertical: DESIGN.spacing.md,
    minHeight: DESIGN.button.min,
    marginBottom: DESIGN.spacing.xl,
  },
  markBtnDisabled: { opacity: 0.6 },
  markBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#D1FAE5',
    padding: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.xl,
  },
  successText: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.success },
  section: { marginTop: DESIGN.spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DESIGN.colors.text.primary, marginBottom: DESIGN.spacing.md },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  cardMeta: { fontSize: 14, color: DESIGN.colors.text.secondary },
  cardTime: { fontSize: 12, color: DESIGN.colors.text.tertiary, marginTop: 4 },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: DESIGN.spacing.xl },
  errorText: { fontSize: 16, color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  backBtnFull: { backgroundColor: DESIGN.colors.primary, paddingHorizontal: DESIGN.spacing.xl, paddingVertical: DESIGN.spacing.md, borderRadius: DESIGN.radius.sm },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modeContainer: {
    flexDirection: 'row',
    gap: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.xl,
  },
  modeCard: {
    flex: 1,
    borderRadius: DESIGN.radius.lg,
    overflow: 'hidden',
    ...DESIGN.shadow.md,
  },
  modeCardGradient: {
    padding: DESIGN.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  modeCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: DESIGN.spacing.sm,
    marginBottom: DESIGN.spacing.xs,
  },
  modeCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cameraFlipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraInfoOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  cameraInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraInfoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  cameraFaceGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFaceGuideCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  cameraFaceGuideText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraCaptureContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  cameraCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  cameraCaptureButtonDisabled: {
    opacity: 0.6,
  },
  cameraCaptureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
  },
  cameraCaptureHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  cameraPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: DESIGN.colors.background,
  },
  cameraPermissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  cameraPermissionText: {
    fontSize: 16,
    color: DESIGN.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  cameraPermissionButton: {
    backgroundColor: DESIGN.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cameraPermissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cameraPermissionCancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cameraPermissionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
  },
  resultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    alignItems: 'center',
  },
  resultModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 16,
  },
  resultModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  resultLabourInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultLabourName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  resultLabourAge: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultLabourConfidence: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  resultModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resultCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resultCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  resultMarkButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultMarkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  resultMarkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  resultCloseButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  resultCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  geofenceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.md,
  },
  geofenceStatusValid: {
    backgroundColor: '#D1FAE5',
  },
  geofenceStatusInvalid: {
    backgroundColor: '#FEE2E2',
  },
  geofenceStatusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  geofenceStatusTextValid: {
    color: '#059669',
  },
  geofenceStatusTextInvalid: {
    color: '#DC2626',
  },
  modeCardDisabled: {
    opacity: 0.5,
  },
});
