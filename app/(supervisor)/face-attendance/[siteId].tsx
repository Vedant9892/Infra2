import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useUser } from '../../../contexts/UserContext';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');

// Labour dataset - Based on LabourImages folder structure
// Images are located at: c:\HACK2\Infra2\face_rec\LabourImages\
// In production, load these from the actual folder or backend
const LABOUR_DATASET = [
  {
    id: 'labour1',
    name: 'Vedant',
    age: 21,
    // Images will be loaded from file system or backend
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

export default function FaceAttendanceScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [recognizedLabour, setRecognizedLabour] = useState<RecognizedLabour | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showResultModal, setShowResultModal] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // Request location permission
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLocation(loc);
      }
    })();

    // Update date/time every second
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Face recognition function
  // TODO: Integrate with proper face recognition library (TensorFlow.js, face-api.js, or backend API)
  // For now, this is a basic implementation that simulates recognition
  // In production, you would:
  // 1. Load labour face embeddings from dataset (C:\HACK2\face_rec\labourimages)
  // 2. Extract face features from captured image using FaceNet/MTCNN equivalent
  // 3. Compare embeddings using Euclidean distance
  // 4. Return best match if distance < threshold (e.g., 0.85)
  const recognizeFace = async (capturedImageUri: string): Promise<RecognizedLabour | null> => {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Replace with actual face recognition
      // Option 1: Use TensorFlow.js with face detection models
      // Option 2: Send image to backend API that uses Python face recognition
      // Option 3: Use react-native-face-detector + custom matching logic
      
      // For demo purposes: Simulate recognition
      // In production, implement actual face matching:
      // - Load images from face_rec/LabourImages folder (c:\HACK2\Infra2\face_rec\LabourImages\)
      // - Extract face embeddings using the Python code (train_faces_enhanced.py, live_recognition.py)
      // - Compare with captured face embedding
      // - Return match if confidence > threshold

      const randomMatch = Math.random() > 0.25; // 75% chance of match for demo
      
      if (randomMatch) {
        // Randomly select one of the labours for demo
        const labour = LABOUR_DATASET[Math.floor(Math.random() * LABOUR_DATASET.length)];
        return {
          id: labour.id,
          name: labour.name,
          age: labour.age,
          confidence: 0.88 + Math.random() * 0.08, // 88-96% confidence
        };
      }

      return null; // Unknown face
    } catch (error) {
      console.error('Face recognition error:', error);
      return null;
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        Alert.alert('Error', 'Failed to capture image');
        setIsCapturing(false);
        return;
      }

      // Recognize face
      const recognized = await recognizeFace(photo.uri);
      
      if (recognized) {
        setRecognizedLabour(recognized);
        setShowResultModal(true);
      } else {
        Alert.alert('Not Recognized', 'Face not recognized. Please try again.');
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!recognizedLabour || !user?.id) {
      Alert.alert('Error', 'Labour not recognized');
      return;
    }

    try {
      // TODO: Link with backend API
      // For now, just show success message
      Alert.alert(
        'Attendance Marked',
        `${recognizedLabour.name} (Age: ${recognizedLabour.age}) marked as present`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowResultModal(false);
              setRecognizedLabour(null);
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

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#8B5CF6" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to recognize labour faces for attendance
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
      >
        {/* Overlay with location, date, time */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Face Recognition</Text>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Info Overlay (Bottom Left) */}
          <View style={styles.infoOverlay}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.infoText}>{formatLocation()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text style={styles.infoText}>
                {format(currentDateTime, 'dd MMM yyyy')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={14} color="#fff" />
              <Text style={styles.infoText}>
                {format(currentDateTime, 'HH:mm:ss')}
              </Text>
            </View>
          </View>

          {/* Face Guide Circle */}
          <View style={styles.faceGuideContainer}>
            <View style={styles.faceGuideCircle} />
            <Text style={styles.faceGuideText}>Position face in the circle</Text>
          </View>

          {/* Capture Button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            <Text style={styles.captureHint}>
              {isCapturing ? 'Recognizing...' : 'Tap to capture'}
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Recognition Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {recognizedLabour ? (
              <>
                <View style={styles.modalHeader}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                  <Text style={styles.modalTitle}>Face Recognized!</Text>
                </View>

                <View style={styles.labourInfo}>
                  <Text style={styles.labourName}>{recognizedLabour.name}</Text>
                  <Text style={styles.labourAge}>Age: {recognizedLabour.age}</Text>
                  <Text style={styles.labourConfidence}>
                    Confidence: {(recognizedLabour.confidence * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowResultModal(false);
                      setRecognizedLabour(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.markButton}
                    onPress={handleMarkAttendance}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.markButtonGradient}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.markButtonText}>Mark Present</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.modalHeader}>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
                <Text style={styles.modalTitle}>Not Recognized</Text>
                <Text style={styles.modalSubtitle}>
                  Face not found in database. Please try again.
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowResultModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  faceGuideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuideCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  faceGuideText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
  },
  captureHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  labourInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  labourName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  labourAge: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
  },
  labourConfidence: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  markButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  markButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
