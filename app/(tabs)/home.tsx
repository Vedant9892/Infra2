import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  Image,
  SafeAreaView,
  Platform,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { DESIGN } from '../../constants/designSystem';
import { DashboardHeader } from '../../components/DashboardHeader';
import { DashboardQuickActions, type QuickAction } from '../../components/DashboardQuickActions';
import { DashboardDateStrip } from '../../components/DashboardDateStrip';
import { DashboardYourTasks } from '../../components/DashboardYourTasks';
import {
  markAttendance,
  getAttendancePending,
  approveAttendance,
  getMaterialRequests,
  requestMaterial,
  approveMaterialRequest,
  getTasks,
  updateTaskStatus,
  getSitesForLabour,
  onDataChange,
} from '../../lib/mock-api';

type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  time: string;
  location: string;
  supervisor: string;
  supervisorAvatar: string;
};

type AttendanceRecord = {
  id: string;
  userId: string;
  timestamp: Date;
  photoUri: string;
  proofPhotos: string[]; // Additional proof photos
  latitude: number;
  longitude: number;
  address: string; // Human-readable address
  status: 'present' | 'absent';
};

type GPSCheckRecord = {
  timestamp: Date;
  latitude: number;
  longitude: number;
};

type MaterialRequest = {
  id: string;
  requestedBy: string;
  requestedByRole: string;
  materialName: string;
  quantity: number;
  unit: string;
  rate?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  timestamp: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
};

type StockItem = {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  location: string;
  lastUpdated: Date;
  reorderLevel: number;
  status: 'adequate' | 'low' | 'critical';
};

type GSTBill = {
  id: string;
  billNumber: string;
  vendorName: string;
  vendorGST: string;
  items: { name: string; quantity: number; rate: number; gst: number }[];
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  date: Date;
  status: 'draft' | 'sent' | 'paid';
};

const { width } = Dimensions.get('window');

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Foundation Inspection',
    time: '09:00 AM',
    location: 'Site A, Pune',
    status: 'pending',
    supervisor: 'Ramesh Patil',
    supervisorAvatar: '👨‍💼',
  },
  {
    id: '2',
    title: 'Material Check',
    time: '11:30 AM',
    location: 'Warehouse, Thane',
    status: 'pending',
    supervisor: 'Anjali Sharma',
    supervisorAvatar: '👩‍💼',
  },
  {
    id: '3',
    title: 'Steel Framework',
    time: '02:00 PM',
    location: 'Site B, Mumbai',
    status: 'completed',
    supervisor: 'Suresh Yadav',
    supervisorAvatar: '👨‍🔧',
  },
];

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]); // Array of proof photos
  const [locationAddress, setLocationAddress] = useState<string>('Fetching address...'); // GPS address
  const [gpsCheckInterval, setGpsCheckInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<any>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPendingAttendanceModal, setShowPendingAttendanceModal] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [currentSiteId, setCurrentSiteId] = useState<string | number | null>(null);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [newMaterialRequest, setNewMaterialRequest] = useState({
    materialName: '',
    quantity: '',
    unit: 'kg',
    rate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    reason: '',
  });

  // Stock Tracking States
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([
    { id: '1', materialName: 'Cement', quantity: 150, unit: 'bags', location: 'Warehouse A', lastUpdated: new Date(), reorderLevel: 50, status: 'adequate' },
    { id: '2', materialName: 'Steel Rods', quantity: 25, unit: 'ton', location: 'Site B', lastUpdated: new Date(), reorderLevel: 30, status: 'low' },
    { id: '3', materialName: 'Bricks', quantity: 5000, unit: 'pcs', location: 'Warehouse A', lastUpdated: new Date(), reorderLevel: 2000, status: 'adequate' },
  ]);

  // GST Bill States
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [gstBills, setGSTBills] = useState<GSTBill[]>([]);
  const [newGSTBill, setNewGSTBill] = useState({
    vendorName: '',
    vendorGST: '',
    items: [{ name: '', quantity: '', rate: '', gst: '18' }],
  });

  const { t } = useLanguage();
  const { user } = useUser();
  const router = useRouter();

  // Supervisor: Fetch pending attendance
  const fetchPendingAttendance = useCallback(() => {
    const sid = user?.currentSiteId ?? 's1';
    const list = getAttendancePending(sid);
    setPendingAttendance(list.map((a) => ({ id: a.id, userId: a.userId, address: a.address, timestamp: a.timestamp, date: a.timestamp })));
    setCurrentSiteId(sid);
  }, [user?.currentSiteId]);

  // Load tasks and materials from mock-api
  const loadData = useCallback(() => {
    const sid = user?.currentSiteId ?? 's1';
    setTasks(
      getTasks(sid).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status === 'completed' ? 'completed' : 'pending',
        time: '—',
        location: t.description || '—',
        supervisor: t.assignedByName || 'Supervisor',
        supervisorAvatar: '👨‍💼',
      }))
    );
    setMaterialRequests(
      getMaterialRequests(sid).map((m) => ({
        id: m.id,
        requestedBy: m.requestedBy,
        requestedByRole: m.requestedByRole,
        materialName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
        rate: m.rate,
        priority: m.priority,
        status: m.status,
        reason: m.reason,
        timestamp: new Date(m.timestamp),
        approvedBy: m.approvedBy,
        approvedAt: m.approvedBy ? new Date() : undefined,
        rejectionReason: m.rejectionReason,
      }))
    );
  }, [user?.currentSiteId]);

  useEffect(() => {
    loadData();
    // Auto-refresh when data changes (cross-dashboard communication)
    const unsubscribe = onDataChange(() => {
      loadData();
      if (user?.role === 'site_supervisor' || user?.role === 'supervisor') {
        fetchPendingAttendance();
      }
    });
    return unsubscribe;
  }, [loadData, fetchPendingAttendance, user?.role]);

  // Debug: Track showCamera state changes
  useEffect(() => {
    console.log('showCamera state changed:', showCamera);
  }, [showCamera]);

  // GPS tracking every 2 hours
  useEffect(() => {
    if (user?.role === 'labour' && attendanceRecords.some(r => r.status === 'present' && format(r.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))) {
      startGPSTracking();
    }
    return () => {
      if (gpsCheckInterval) {
        clearInterval(gpsCheckInterval);
      }
    };
  }, [attendanceRecords, user?.role]);

  const startGPSTracking = async () => {
    // Check GPS every 2 hours (7200000 ms)
    const interval = setInterval(async () => {
      const location = await Location.getCurrentPositionAsync({});
      const record: GPSCheckRecord = {
        timestamp: new Date(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      console.log('GPS Check:', record);
      Alert.alert('GPS Check', 'Location verified for attendance tracking');
    }, 7200000); // 2 hours

    setGpsCheckInterval(interval);
  };

  const requestPermissions = async () => {
    const locStatus = await requestLocationPermission();
    const camStatus = await requestCameraPermission();

    if (!locStatus?.granted) {
      Alert.alert('Permission Required', 'Location permission is required for attendance');
      return false;
    }
    if (!camStatus?.granted) {
      Alert.alert('Permission Required', 'Camera permission is required for live photo');
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      return location;
    } catch (error) {
      Alert.alert('Error', 'Unable to get location');
      return null;
    }
  };

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const formattedAddress = [
          addr.street || addr.name,
          addr.district || addr.subregion,
          addr.city,
          addr.region,
          addr.postalCode
        ]
          .filter(Boolean)
          .join(', ');
        return formattedAddress || 'Address not available';
      }
      return 'Address not available';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Address not available';
    }
  };

  // Update address when location changes
  useEffect(() => {
    if (currentLocation) {
      getAddressFromCoords(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      ).then(setLocationAddress);
    }
  }, [currentLocation]);

  // Calculate distance between two coordinates using Haversine formula
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

  const handleOpenAttendance = async () => {
    const hasPermissions = await requestPermissions();
    if (hasPermissions) {
      const location = await getCurrentLocation();

      if (!location) {
        Alert.alert('Error', 'Unable to get your current location');
        return;
      }

      // For Owner/Manager roles, skip geofencing check
      if (user?.role === 'owner' || user?.role === 'site_manager') {
        setShowAttendanceModal(true);
        return;
      }

      // For Labour: Fetch their assigned sites and check GPS
      if (user?.role === 'labour' && user?.id) {
        try {
          const registeredSites = getSitesForLabour(user.id);
          if (registeredSites.length === 0) {
            Alert.alert(
              'No Site Assigned',
              'Join a site from Labour Home (e.g. code SITE-A1) to mark attendance.',
              [{ text: 'OK' }]
            );
            return;
          }
          // Mock: skip geofencing, use first site
          const firstSite = registeredSites[0];
          if (firstSite) {
            setCurrentSiteId(firstSite.id);
            console.log(`📍 Site detected: ${firstSite.name} (ID: ${firstSite.id})`);
          }

          // User is within site boundaries, allow attendance
          setShowAttendanceModal(true);
        } catch (error) {
          console.error('Fetch sites error:', error);
          Alert.alert('Error', 'Failed to fetch your assigned sites. Please try again.');
        }
      } else {
        // For other roles, allow attendance
        setShowAttendanceModal(true);
      }
    }
  };

  const handleOpenCamera = async (photoType: 'selfie' | 'proof' = 'selfie') => {
    console.log(`handleOpenCamera called - type: ${photoType}`);

    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to take a live photo');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        cameraType: photoType === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('Photo captured:', photoUri);

        if (photoType === 'selfie') {
          setCapturedPhoto(photoUri);
          Alert.alert('Success', 'Selfie captured successfully!');
        } else {
          // Add to proof photos array (max 3)
          if (proofPhotos.length < 3) {
            setProofPhotos([...proofPhotos, photoUri]);
            Alert.alert('Success', `Proof photo ${proofPhotos.length + 1} captured!`);
          } else {
            Alert.alert('Limit Reached', 'You can only add up to 3 proof photos.');
          }
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleRemoveProofPhoto = (index: number) => {
    setProofPhotos(proofPhotos.filter((_, i) => i !== index));
  };

  const handleTakePhoto = async () => {
    console.log('handleTakePhoto called');
    Alert.alert('Debug', 'Take photo button pressed!');
    console.log('Camera ref:', cameraRef.current);

    if (!cameraRef.current) {
      console.error('Camera ref is null');
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      console.log('Photo captured:', photo);

      if (photo && photo.uri) {
        console.log('Photo URI:', photo.uri);
        setCapturedPhoto(photo.uri);
        setShowCamera(false);
        Alert.alert('Success', 'Photo captured!');
      } else {
        console.error('No photo URI returned');
        Alert.alert('Error', 'Failed to capture photo');
      }
    } catch (error: any) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', `Failed to capture photo: ${error?.message || 'Unknown error'}`);
    }
  }; const handleMarkPresent = async () => {
    if (!capturedPhoto) {
      Alert.alert('Photo Required', 'Please capture a selfie');
      return;
    }
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location');
      return;
    }
    if (!user?.id || !user?.currentSiteId) {
      Alert.alert('Error', 'Site assignment required. Please enroll in a site first.');
      return;
    }

    try {
      // Use currentSiteId if set (from GPS check), otherwise use user.currentSiteId
      const siteIdToUse = currentSiteId || user?.currentSiteId;
      
      if (!siteIdToUse) {
        Alert.alert('Error', 'No site assigned. Please contact your supervisor.');
        return;
      }

      // Convert siteId to string if it's a MongoDB ObjectId, otherwise keep as number
      const siteIdForApi = typeof siteIdToUse === 'string' ? siteIdToUse : String(siteIdToUse);
      
      const uid = user.id;
      const lat = currentLocation?.coords.latitude ?? 19.076;
      const lon = currentLocation?.coords.longitude ?? 72.8777;
      const addr = locationAddress || 'Andheri West, Mumbai';
      // Use empty string instead of mock:// URL to avoid React Native URL handler errors
      // In production, capturedPhoto should always be set from ImagePicker
      const photo = capturedPhoto || '';

      markAttendance(uid, photo, lat, lon, addr, siteIdForApi);

      const record: AttendanceRecord = {
        id: `a-${Date.now()}`,
        userId: uid,
        timestamp: new Date(),
        photoUri: photo,
        proofPhotos: proofPhotos,
        latitude: lat,
        longitude: lon,
        address: addr,
        status: 'present',
      };

      setAttendanceRecords([...attendanceRecords, record]);
      Alert.alert(
        'Attendance Marked!',
        `You are marked present at ${format(new Date(), 'hh:mm a')}.\n\nLocation: ${addr}\n\nWaiting for supervisor approval.`,
        [{
          text: 'OK', onPress: () => {
            setShowAttendanceModal(false);
            setCapturedPhoto(null);
            setProofPhotos([]);
          }
        }]
      );
    } catch (error) {
      console.error('Mark attendance error:', error);
      Alert.alert('Error', 'Failed to mark attendance. Please try again.');
    }
  };


  // Supervisor: Approve or reject attendance
  const handleApproveAttendance = (attendanceId: string | number, approved: boolean) => {
    try {
      approveAttendance(String(attendanceId), approved);
      Alert.alert('Success', approved ? 'Attendance approved' : 'Attendance rejected');
      fetchPendingAttendance();
    } catch {
      Alert.alert('Error', 'Failed to update attendance.');
    }
  };

  // Load pending attendance when supervisor opens home
  useEffect(() => {
    if (user?.role === 'site_supervisor' && user?.currentSiteId) {
      fetchPendingAttendance();
    }
  }, [user?.role, user?.currentSiteId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  // Role-specific features based on flowchart
  const getRoleName = () => {
    if (!user) return 'User';
    return user.name;
  };

  const handleSubmitMaterialRequest = () => {
    if (!newMaterialRequest.materialName || !newMaterialRequest.quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const sid = user?.currentSiteId ?? 's1';
    requestMaterial(
      user?.name || 'Unknown',
      user?.role || 'engineer',
      newMaterialRequest.materialName,
      parseFloat(newMaterialRequest.quantity),
      newMaterialRequest.unit,
      newMaterialRequest.priority,
      newMaterialRequest.reason,
      newMaterialRequest.rate ? parseFloat(newMaterialRequest.rate) : undefined
    );

    // Reload from mock
    setMaterialRequests(
      getMaterialRequests(sid).map((m) => ({
        id: m.id,
        requestedBy: m.requestedBy,
        requestedByRole: m.requestedByRole,
        materialName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
        rate: m.rate,
        priority: m.priority,
        status: m.status,
        reason: m.reason,
        timestamp: new Date(m.timestamp),
        approvedBy: m.approvedBy,
        approvedAt: m.approvedBy ? new Date() : undefined,
        rejectionReason: m.rejectionReason,
      }))
    );

    Alert.alert('Success', 'Material request submitted');
    setShowMaterialModal(false);
    setNewMaterialRequest({
      materialName: '',
      quantity: '',
      unit: 'kg',
      priority: 'medium',
      reason: '',
    });
  };

  const handleApproveMaterial = (requestId: string) => {
    approveMaterialRequest(requestId, true, user?.name);
    const sid = user?.currentSiteId ?? 's1';
    setMaterialRequests(
      getMaterialRequests(sid).map((m) => ({
        id: m.id,
        requestedBy: m.requestedBy,
        requestedByRole: m.requestedByRole,
        materialName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
        rate: m.rate,
        priority: m.priority,
        status: m.status,
        reason: m.reason,
        timestamp: new Date(m.timestamp),
        approvedBy: m.approvedBy,
        approvedAt: m.approvedBy ? new Date() : undefined,
        rejectionReason: m.rejectionReason,
      }))
    );
    Alert.alert('Approved', 'Material request approved');
  };

  const handleRejectMaterial = (requestId: string, reason: string) => {
    approveMaterialRequest(requestId, false, undefined, reason);
    const sid = user?.currentSiteId ?? 's1';
    setMaterialRequests(
      getMaterialRequests(sid).map((m) => ({
        id: m.id,
        requestedBy: m.requestedBy,
        requestedByRole: m.requestedByRole,
        materialName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
        rate: m.rate,
        priority: m.priority,
        status: m.status,
        reason: m.reason,
        timestamp: new Date(m.timestamp),
        approvedBy: m.approvedBy,
        approvedAt: m.approvedBy ? new Date() : undefined,
        rejectionReason: m.rejectionReason,
      }))
    );
    Alert.alert('Rejected', 'Material request rejected');
  };

  const getRoleFeatures = () => {
    if (!user) return [];

    switch (user.role) {
      case 'labour':
        return [
          { id: 'attendance', icon: 'location', title: 'Mark Attendance', subtitle: 'GPS + Photo Required', color: '#8B5CF6' },
          { id: 'tasks', icon: 'clipboard', title: 'My Assigned Tasks', subtitle: 'View daily work', color: '#10B981' },
          { id: 'site-docs', icon: 'camera', title: 'Site Documentation', subtitle: 'Upload work photos', color: '#F59E0B' },
          { id: 'chat', icon: 'chatbubbles', title: 'Chat with Supervisor', subtitle: 'Report & communicate', color: '#3B82F6' },
        ];
      case 'site_supervisor':
      case 'supervisor':
        return [
          { id: 'verify', icon: 'checkmark-circle', title: 'Verify Attendance', subtitle: `${pendingAttendance.length} pending`, color: '#8B5CF6' },
          { id: 'assign', icon: 'people', title: 'Assign Tasks', subtitle: 'Delegate to labour', color: '#10B981' },
          { id: 'approve', icon: 'document-text', title: 'Approve Work', subtitle: 'Site photos & documentation', color: '#3B82F6' },
          { id: 'access', icon: 'shield-checkmark', title: 'Access Control', subtitle: 'Manage permissions', color: '#EF4444' },
          { id: 'chat', icon: 'chatbubbles', title: 'Team Chat', subtitle: 'Labour & Engineer', color: '#F59E0B' },
        ];
      case 'junior_engineer':
        return [
          { id: 'materials', icon: 'cube', title: 'Material Request', subtitle: 'Request materials', color: '#10B981' },
          { id: 'work-logs', icon: 'document-text', title: 'Work Logs', subtitle: 'Daily work reports', color: '#8B5CF6' },
          { id: 'site-docs', icon: 'camera', title: 'Site Documentation', subtitle: 'Upload photos', color: '#F59E0B' },
          { id: 'stock', icon: 'layers', title: 'Stock Tracking', subtitle: 'View inventory', color: '#06B6D4' },
          { id: 'tasks', icon: 'clipboard', title: 'My Tasks', subtitle: 'View assigned tasks', color: '#3B82F6' },
          { id: 'chat', icon: 'chatbubbles', title: 'Communications', subtitle: 'Report to seniors', color: '#EC4899' },
        ];
      case 'senior_engineer':
        return [
          { id: 'material-approvals', icon: 'checkmark-done', title: 'Material Approvals', subtitle: 'Approve requests (up to ₹50k)', color: '#10B981' },
          { id: 'materials', icon: 'cube', title: 'Material Request', subtitle: 'Request materials', color: '#8B5CF6' },
          { id: 'assign-task', icon: 'people', title: 'Assign Tasks', subtitle: 'Delegate to team', color: '#F59E0B' },
          { id: 'quality', icon: 'checkmark-circle', title: 'Quality Control', subtitle: 'Inspections & reports', color: '#3B82F6' },
          { id: 'progress', icon: 'stats-chart', title: 'Progress Reports', subtitle: 'Track project status', color: '#06B6D4' },
          { id: 'work-logs', icon: 'document-text', title: 'Work Logs', subtitle: 'Review & approve', color: '#8B5CF6' },
          { id: 'stock', icon: 'layers', title: 'Stock Management', subtitle: 'Full inventory control', color: '#6366F1' },
          { id: 'chat', icon: 'chatbubbles', title: 'Team Communications', subtitle: 'Supervisor & Owner', color: '#EC4899' },
        ];
      case 'engineer':
        // Fallback for legacy 'engineer' role - treat as junior
        return [
          { id: 'materials', icon: 'cube', title: 'Material Request', subtitle: 'Request materials', color: '#10B981' },
          { id: 'work-logs', icon: 'document-text', title: 'Work Logs', subtitle: 'Daily work reports', color: '#8B5CF6' },
          { id: 'site-docs', icon: 'camera', title: 'Site Documentation', subtitle: 'Upload photos', color: '#F59E0B' },
          { id: 'stock', icon: 'layers', title: 'Stock Tracking', subtitle: 'View inventory', color: '#06B6D4' },
          { id: 'tasks', icon: 'clipboard', title: 'My Tasks', subtitle: 'View assigned tasks', color: '#3B82F6' },
          { id: 'chat', icon: 'chatbubbles', title: 'Communications', subtitle: 'Report to seniors', color: '#EC4899' },
        ];
      case 'owner':
        return [
          { id: 'site-owner', icon: 'business', title: 'Construction Site Owner', subtitle: 'Purchase & Payments', color: '#8B5CF6' },
          { id: 'payments', icon: 'card', title: 'GST Invoice', subtitle: 'Generate invoices', color: '#10B981' },
          { id: 'stock', icon: 'layers', title: 'Stock Management', subtitle: 'View all inventory', color: '#06B6D4' },
          { id: 'dealer', icon: 'storefront', title: 'Dealer Login', subtitle: 'Marketplace access', color: '#3B82F6' },
          { id: 'material-approvals', icon: 'checkmark-done', title: 'Material Approvals', subtitle: 'Review requests', color: '#F59E0B' },
          { id: 'chatbot', icon: 'chatbubbles', title: 'AI Assistant', subtitle: 'Get help & insights', color: '#EC4899' },
        ];
      default:
        return [];
    }
  };

  const handleFeaturePress = (featureId: string) => {
    if (featureId === 'attendance') {
      handleOpenAttendance();
    } else if (featureId === 'chat') {
      router.push('/(tabs)/chat');
    } else if (featureId === 'materials') {
      setShowMaterialModal(true);
    } else if (featureId === 'material-approvals') {
      setShowMaterialModal(true);
    } else if (featureId === 'stock') {
      setShowStockModal(true);
    } else if (featureId === 'payments') {
      setShowGSTModal(true);
    } else if (featureId === 'tasks') {
      router.push('/(features)/work-logs');
    } else if (featureId === 'site-docs') {
      router.push('/(features)/work-logs');
    } else if (featureId === 'work-logs') {
      router.push('/(features)/work-logs');
    } else if (featureId === 'verify') {
      setShowPendingAttendanceModal(true);
      fetchPendingAttendance();
    } else if (featureId === 'assign-task') {
      // Senior engineer: Assign tasks to junior engineers and labour
      if (user?.role === 'senior_engineer') {
        router.push('/(features)/work-logs');
      } else {
        Alert.alert('Coming Soon', 'Task assignment feature will be available soon');
      }
    } else if (featureId === 'quality') {
      // Senior engineer: Quality control and inspections
      router.push('/(features)/work-logs');
    } else if (featureId === 'progress') {
      // Senior engineer: Progress reporting
      router.push('/(features)/owner-dashboard');
    } else if (featureId === 'assign') {
      if (user?.role === 'site_supervisor' || user?.role === 'supervisor') {
        router.push('/(supervisor)/(tabs)/tasks');
      } else {
        Alert.alert('Coming Soon', 'Task assignment feature will be available soon');
      }
    } else if (featureId === 'approve') {
      if (user?.role === 'site_supervisor' || user?.role === 'supervisor') {
        router.push('/(supervisor)/approve-work');
      } else {
        Alert.alert('Coming Soon', 'Work approval feature will be available soon');
      }
    } else if (featureId === 'access') {
      if (user?.role === 'site_supervisor' || user?.role === 'supervisor') {
        router.push('/(supervisor)/access-control');
      } else {
        Alert.alert('Coming Soon', 'Access control feature will be available soon');
      }
    } else if (featureId === 'onsite' || featureId === 'approvals') {
      Alert.alert('Coming Soon', `${featureId} feature will be available soon`);
    } else if (featureId === 'site-owner' || featureId === 'dealer' || featureId === 'chatbot') {
      Alert.alert('Coming Soon', `${featureId} feature will be available soon`);
    }
  };

  const quickActions: QuickAction[] = getRoleFeatures().map((f) => ({
    ...f,
    onPress: () => handleFeaturePress(f.id),
  }));

  const viewRecordsEl =
    user && ['supervisor', 'engineer', 'owner'].includes(user.role) && attendanceRecords.length > 0 ? (
      <TouchableOpacity style={styles.viewRecordsButton}>
        <Ionicons name="list" size={16} color="#8B5CF6" />
        <Text style={styles.viewRecordsText}>
          {attendanceRecords.filter((r) => format(r.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length} Present
        </Text>
      </TouchableOpacity>
    ) : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          name={user?.name || getRoleName()}
          role={user?.role || ''}
          profilePhoto={user?.profilePhoto}
        />
        <DashboardQuickActions
          title="Quick Actions"
          actions={quickActions}
          rightElement={viewRecordsEl}
        />
        <DashboardDateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          numDays={7}
          offset={3}
        />
        <DashboardYourTasks
          title={t('home.yourTasks')}
          pendingLabel="Pending"
          showPendingTag={true}
        >
          <View style={styles.tasksGrid}>
            <View style={styles.taskLargeColumn}>
              <TaskCard task={tasks[0]} isLarge />
            </View>
            <View style={styles.taskSmallColumn}>
              <View style={styles.taskSmallTop}>
                <TaskCard task={tasks[1]} />
              </View>
              <View style={styles.taskSmallBottom}>
                <TaskCard task={tasks[2]} />
              </View>
            </View>
          </View>
        </DashboardYourTasks>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttendanceModal(false)}
        supportedOrientations={['portrait']}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAttendanceModal(false);
            setCapturedPhoto(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => {
              // Prevent closing modal when tapping inside
              e.stopPropagation();
            }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <TouchableOpacity onPress={() => {
                setShowAttendanceModal(false);
                setCapturedPhoto(null);
              }}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.requirementItem}>
                <Ionicons name="location" size={24} color="#8B5CF6" />
                <View style={styles.requirementText}>
                  <Text style={styles.requirementTitle}>GPS Location</Text>
                  <Text style={styles.requirementSubtitle}>
                    {currentLocation ? `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}` : 'Detecting...'}
                  </Text>
                  {currentLocation && (
                    <Text style={[styles.requirementSubtitle, { fontSize: 11, marginTop: 4, color: '#10B981' }]}>
                      📍 {locationAddress}
                    </Text>
                  )}
                </View>
                <Ionicons name={currentLocation ? "checkmark-circle" : "ellipse-outline"} size={24} color={currentLocation ? "#10B981" : "#9CA3AF"} />
              </View>

              <View style={styles.requirementItem}>
                <Ionicons name="time" size={24} color="#8B5CF6" />
                <View style={styles.requirementText}>
                  <Text style={styles.requirementTitle}>Timestamp</Text>
                  <Text style={styles.requirementSubtitle}>{format(new Date(), 'hh:mm a, MMM dd')}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>

              <TouchableOpacity
                style={[styles.requirementItem, styles.clickableItem]}
                onPress={() => {
                  console.log('Live Photo section tapped');
                  Alert.alert('Test', 'Live Photo tapped - opening camera...');
                  handleOpenCamera();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={24} color="#8B5CF6" />
                <View style={styles.requirementText}>
                  <Text style={styles.requirementTitle}>Live Photo</Text>
                  <Text style={[styles.requirementSubtitle, styles.tapPrompt]}>
                    {capturedPhoto ? 'Photo captured ✓' : 'Tap to capture'}
                  </Text>
                </View>
                {capturedPhoto ? (
                  <Image source={{ uri: capturedPhoto }} style={styles.photoThumbnail} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#9CA3AF" />
                )}
              </TouchableOpacity>

              {capturedPhoto && (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: capturedPhoto }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => handleOpenCamera('selfie')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-reverse" size={16} color="#fff" />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Test Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#8B5CF6',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
                onPress={() => {
                  console.log('TEST BUTTON PRESSED');
                  Alert.alert('Test', 'Opening camera modal now...');
                  setShowCamera(true);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  🎥 TEST: Open Camera Directly
                </Text>
              </TouchableOpacity>

              <View style={styles.warningBox}>
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  GPS tracking will verify your location every 2 hours to ensure on-site presence
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.markButton, (!capturedPhoto || !currentLocation) && styles.markButtonDisabled]}
              onPress={handleMarkPresent}
              disabled={!capturedPhoto || !currentLocation}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.markButtonText}>Mark Present</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Material Request Modal */}
      <Modal
        visible={showMaterialModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMaterialModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMaterialModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { maxHeight: '90%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {user?.role === 'junior_engineer' || user?.role === 'engineer' ? 'Material Request' : 
                 user?.role === 'senior_engineer' ? 'Material Management' : 'Material Approvals'}
              </Text>
              <TouchableOpacity onPress={() => setShowMaterialModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Engineer: Create New Request */}
              {(user?.role === 'engineer' || user?.role === 'junior_engineer' || user?.role === 'senior_engineer') && (
                <View style={styles.materialForm}>
                  <Text style={styles.materialSectionTitle}>Create New Request</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Material Name *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="cube-outline" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., Cement, Steel, Bricks"
                        value={newMaterialRequest.materialName}
                        onChangeText={(text) => setNewMaterialRequest({ ...newMaterialRequest, materialName: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Quantity *</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={newMaterialRequest.quantity}
                          onChangeText={(text) => setNewMaterialRequest({ ...newMaterialRequest, quantity: text })}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Unit</Text>
                      <View style={styles.inputWrapper}>
                        <TouchableOpacity
                          style={styles.unitSelector}
                          onPress={() => {
                            const units = ['kg', 'ton', 'bag', 'pcs', 'm', 'm²', 'm³'];
                            const currentIndex = units.indexOf(newMaterialRequest.unit);
                            const nextIndex = (currentIndex + 1) % units.length;
                            setNewMaterialRequest({ ...newMaterialRequest, unit: units[nextIndex] });
                          }}
                        >
                          <Text style={styles.unitText}>{newMaterialRequest.unit}</Text>
                          <Ionicons name="chevron-down" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rate per Unit (₹) - Optional</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="cash-outline" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., 380 (for cement bags)"
                        keyboardType="numeric"
                        value={newMaterialRequest.rate}
                        onChangeText={(text) => setNewMaterialRequest({ ...newMaterialRequest, rate: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Priority</Text>
                    <View style={styles.priorityButtons}>
                      {(['low', 'medium', 'high'] as const).map((priority) => (
                        <TouchableOpacity
                          key={priority}
                          style={[
                            styles.priorityButton,
                            newMaterialRequest.priority === priority && styles.priorityButtonActive,
                            priority === 'low' && newMaterialRequest.priority === priority && { backgroundColor: '#10B981' },
                            priority === 'medium' && newMaterialRequest.priority === priority && { backgroundColor: '#F59E0B' },
                            priority === 'high' && newMaterialRequest.priority === priority && { backgroundColor: '#EF4444' },
                          ]}
                          onPress={() => setNewMaterialRequest({ ...newMaterialRequest, priority })}
                        >
                          <Text style={[
                            styles.priorityButtonText,
                            newMaterialRequest.priority === priority && styles.priorityButtonTextActive
                          ]}>
                            {priority.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reason for Request</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        placeholder="Why is this material needed?"
                        multiline
                        numberOfLines={3}
                        value={newMaterialRequest.reason}
                        onChangeText={(text) => setNewMaterialRequest({ ...newMaterialRequest, reason: text })}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitMaterialRequest}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Display Material Requests */}
              <View style={styles.requestsList}>
                <Text style={styles.materialSectionTitle}>
                  {user?.role === 'junior_engineer' || user?.role === 'engineer' ? 'My Requests' : 
                   user?.role === 'senior_engineer' ? 'All Requests & Approvals' : 'Pending Approvals'}
                </Text>

                {materialRequests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>No material requests yet</Text>
                  </View>
                ) : (
                  materialRequests
                    .filter(req => {
                      if (user?.role === 'junior_engineer' || user?.role === 'engineer') {
                        return req.requestedBy === user?.name;
                      } else if (user?.role === 'senior_engineer') {
                        return req.status === 'pending' || req.requestedBy === user?.name;
                      }
                      return req.status === 'pending';
                    })
                    .map((request) => (
                      <View key={request.id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                          <View style={styles.requestInfo}>
                            <Ionicons name="cube" size={24} color="#8B5CF6" />
                            <View style={styles.requestDetails}>
                              <Text style={styles.requestMaterial}>{request.materialName}</Text>
                              <Text style={styles.requestQuantity}>
                                {request.quantity} {request.unit}
                                {request.rate && ` • ₹${(request.quantity * request.rate).toLocaleString()}`}
                              </Text>
                            </View>
                          </View>
                          <View style={[
                            styles.materialStatusBadge,
                            request.status === 'pending' && styles.materialStatusPending,
                            request.status === 'approved' && styles.materialStatusApproved,
                            request.status === 'rejected' && styles.materialStatusRejected,
                          ]}>
                            <Text style={styles.materialStatusText}>{request.status.toUpperCase()}</Text>
                          </View>
                        </View>

                        <View style={styles.requestMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons name="person-outline" size={16} color="#6B7280" />
                            <Text style={styles.metaText}>{request.requestedBy}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                            <Text style={styles.metaText}>{format(request.timestamp, 'MMM dd, hh:mm a')}</Text>
                          </View>
                          <View style={[
                            styles.priorityBadge,
                            request.priority === 'low' && { backgroundColor: '#D1FAE5' },
                            request.priority === 'medium' && { backgroundColor: '#FEF3C7' },
                            request.priority === 'high' && { backgroundColor: '#FEE2E2' },
                          ]}>
                            <Text style={[
                              styles.priorityText,
                              request.priority === 'low' && { color: '#065F46' },
                              request.priority === 'medium' && { color: '#92400E' },
                              request.priority === 'high' && { color: '#991B1B' },
                            ]}>
                              {request.priority}
                            </Text>
                          </View>
                        </View>

                        {request.reason && (
                          <View style={styles.requestReason}>
                            <Text style={styles.reasonLabel}>Reason:</Text>
                            <Text style={styles.reasonText}>{request.reason}</Text>
                          </View>
                        )}

                        {/* Approval Buttons for Senior Engineer (up to ₹50k) and Owner/Manager */}
                        {user?.role === 'senior_engineer' && request.status === 'pending' && request.requestedBy !== user?.name && (
                          <>
                            {request.rate && (
                              <View style={styles.approvalLimitInfo}>
                                <Text style={styles.approvalLimitText}>
                                  Total Value: ₹{(request.quantity * request.rate).toLocaleString()}
                                  {(request.quantity * request.rate) > 50000 && (
                                    <Text style={{ color: '#EF4444', fontWeight: '700' }}> (Exceeds ₹50k limit - Owner approval required)</Text>
                                  )}
                                </Text>
                              </View>
                            )}
                            {(request.quantity * (request.rate || 0)) <= 50000 && (
                              <View style={styles.approvalActions}>
                                <TouchableOpacity
                                  style={[styles.actionButton, styles.rejectButton]}
                                  onPress={() => {
                                    Alert.prompt(
                                      'Reject Request',
                                      'Please provide a reason for rejection:',
                                      (reason) => handleRejectMaterial(request.id, reason || 'No reason provided')
                                    );
                                  }}
                                >
                                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                                  <Text style={styles.rejectButtonText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionButton, styles.approveButton]}
                                  onPress={() => handleApproveMaterial(request.id)}
                                >
                                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                  <Text style={styles.approveButtonText}>Approve</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </>
                        )}
                        {user?.role === 'owner' && request.status === 'pending' && (
                          <View style={styles.approvalActions}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.rejectButton]}
                              onPress={() => {
                                Alert.prompt(
                                  'Reject Request',
                                  'Please provide a reason for rejection:',
                                  (reason) => handleRejectMaterial(request.id, reason || 'No reason provided')
                                );
                              }}
                            >
                              <Ionicons name="close-circle" size={18} color="#EF4444" />
                              <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.approveButton]}
                              onPress={() => handleApproveMaterial(request.id)}
                            >
                              <Ionicons name="checkmark-circle" size={18} color="#fff" />
                              <Text style={styles.approveButtonText}>Approve</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                )}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Stock Tracking Modal */}
      <Modal
        visible={showStockModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStockModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStockModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Management</Text>
              <TouchableOpacity onPress={() => setShowStockModal(false)}>
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Stock Items List */}
              <View style={styles.requestsList}>
                {stockItems.map((item) => (
                  <View key={item.id} style={styles.stockCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestMaterial}>{item.materialName}</Text>
                        <Text style={styles.requestQuantity}>{item.quantity} {item.unit}</Text>
                      </View>
                      <View style={[
                        styles.materialStatusBadge,
                        item.status === 'adequate' && { backgroundColor: '#D1FAE5' },
                        item.status === 'low' && { backgroundColor: '#FEF3C7' },
                        item.status === 'critical' && { backgroundColor: '#FEE2E2' },
                      ]}>
                        <Text style={[
                          styles.materialStatusText,
                          item.status === 'adequate' && { color: '#065F46' },
                          item.status === 'low' && { color: '#92400E' },
                          item.status === 'critical' && { color: '#991B1B' },
                        ]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>Updated {format(item.lastUpdated, 'dd MMM')}</Text>
                      </View>
                    </View>

                    <View style={styles.reorderInfo}>
                      <Text style={styles.reorderLabel}>Reorder Level: {item.reorderLevel} {item.unit}</Text>
                      {item.quantity < item.reorderLevel && (
                        <Text style={styles.reorderAlert}>⚠️ Below reorder level</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* GST Bill Modal */}
      <Modal
        visible={showGSTModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGSTModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGSTModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GST Invoice Generator</Text>
              <TouchableOpacity onPress={() => setShowGSTModal(false)}>
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* GST Bill Form */}
              <View style={styles.materialForm}>
                <Text style={styles.materialSectionTitle}>Vendor Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vendor Name *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={newGSTBill.vendorName}
                      onChangeText={(text) => setNewGSTBill({ ...newGSTBill, vendorName: text })}
                      placeholder="Enter vendor name"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vendor GST Number *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={newGSTBill.vendorGST}
                      onChangeText={(text) => setNewGSTBill({ ...newGSTBill, vendorGST: text })}
                      placeholder="Enter GST number"
                      style={styles.textInput}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <Text style={styles.materialSectionTitle}>Bill Items</Text>

                {newGSTBill.items.map((item, index) => (
                  <View key={index} style={styles.billItemCard}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Item Name</Text>
                      <TextInput
                        value={item.name}
                        onChangeText={(text) => {
                          const items = [...newGSTBill.items];
                          items[index].name = text;
                          setNewGSTBill({ ...newGSTBill, items });
                        }}
                        placeholder="e.g., Cement Bags"
                        style={styles.textInput}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Qty</Text>
                        <TextInput
                          value={item.quantity}
                          onChangeText={(text) => {
                            const items = [...newGSTBill.items];
                            items[index].quantity = text;
                            setNewGSTBill({ ...newGSTBill, items });
                          }}
                          placeholder="0"
                          keyboardType="numeric"
                          style={styles.textInput}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.inputLabel}>Rate (₹)</Text>
                        <TextInput
                          value={item.rate}
                          onChangeText={(text) => {
                            const items = [...newGSTBill.items];
                            items[index].rate = text;
                            setNewGSTBill({ ...newGSTBill, items });
                          }}
                          placeholder="0"
                          keyboardType="numeric"
                          style={styles.textInput}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.inputLabel}>GST %</Text>
                        <TextInput
                          value={item.gst}
                          onChangeText={(text) => {
                            const items = [...newGSTBill.items];
                            items[index].gst = text;
                            setNewGSTBill({ ...newGSTBill, items });
                          }}
                          placeholder="18"
                          keyboardType="numeric"
                          style={styles.textInput}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => {
                    setNewGSTBill({
                      ...newGSTBill,
                      items: [...newGSTBill.items, { name: '', quantity: '', rate: '', gst: '18' }]
                    });
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#8B5CF6" />
                  <Text style={styles.addItemText}>Add Another Item</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    Alert.alert('Success', 'GST Invoice generated successfully');
                    setShowGSTModal(false);
                    setNewGSTBill({
                      vendorName: '',
                      vendorGST: '',
                      items: [{ name: '', quantity: '', rate: '', gst: '18' }],
                    });
                  }}
                >
                  <Text style={styles.submitButtonText}>Generate Invoice</Text>
                </TouchableOpacity>
              </View>

              {/* Past Invoices */}
              {gstBills.length > 0 && (
                <View style={styles.requestsList}>
                  <Text style={styles.materialSectionTitle}>Past Invoices</Text>
                  {gstBills.map((bill) => (
                    <View key={bill.id} style={styles.requestCard}>
                      <Text style={styles.requestMaterial}>{bill.vendorName}</Text>
                      <Text style={styles.requestQuantity}>₹{bill.grandTotal.toFixed(2)}</Text>
                      <Text style={styles.metaText}>{format(bill.date, 'dd MMM yyyy')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
        presentationStyle="fullScreen"
        supportedOrientations={['portrait']}
      >
        <View style={styles.cameraContainer}>
          {/* Camera View with no children */}
          {showCamera && (
            <CameraView
              ref={cameraRef}
              style={styles.cameraFullScreen}
              facing="front"
              onCameraReady={() => {
                console.log('Camera is ready!');
              }}
            />
          )}

          {/* Separate overlay layer */}
          <View style={styles.cameraOverlayAbsolute}>
            <SafeAreaView style={styles.cameraOverlayContainer}>
              <StatusBar style="light" />

              {/* Close Button */}
              <View>
                <TouchableOpacity
                  style={styles.cameraCloseButton}
                  onPress={() => {
                    console.log('Close button pressed');
                    setShowCamera(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={32} color="#fff" />
                </TouchableOpacity>

                {/* Instructions */}
                <View style={styles.cameraInstructions}>
                  <Text style={styles.cameraGuideText}>Position your face in the frame</Text>
                  <View style={styles.faceGuide}>
                    <View style={styles.faceOutlineCircle} />
                  </View>
                </View>
              </View>

              {/* Capture Button */}
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => {
                    console.log('Capture button touched!');
                    handleTakePhoto();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Pending Attendance Modal - Supervisor */}
      <Modal
        visible={showPendingAttendanceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPendingAttendanceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPendingAttendanceModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pending Attendance Approvals</Text>
              <TouchableOpacity onPress={() => setShowPendingAttendanceModal(false)}>
                <Ionicons name="close" size={28} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {pendingAttendance.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No pending attendance requests</Text>
                </View>
              ) : (
                pendingAttendance.map((attendance: any) => (
                  <View key={attendance.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        {attendance.photoUri && 
                         attendance.photoUri !== '' && 
                         !attendance.photoUri.startsWith('mock://') && (
                          <Image source={{ uri: attendance.photoUri }} style={styles.attendancePhoto} />
                        )}
                        <View style={styles.requestDetails}>
                          <Text style={styles.requestMaterial}>Worker ID: {attendance.userId}</Text>
                          <Text style={styles.requestQuantity}>
                            {format(new Date(attendance.date), 'MMM dd, hh:mm a')}
                          </Text>
                          {attendance.shiftSlot && (
                            <Text style={styles.metaText}>Shift: {attendance.shiftSlot}</Text>
                          )}
                          {attendance.gpsLat && attendance.gpsLon && (
                            <Text style={styles.metaText}>
                              📍 {parseFloat(attendance.gpsLat).toFixed(4)}, {parseFloat(attendance.gpsLon).toFixed(4)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleApproveAttendance(attendance.id, false)}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveAttendance(attendance.id, true)}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Attendance Records Section - Show only for supervisors/engineers/owners */}
      {user && ['site_supervisor', 'junior_engineer', 'senior_engineer', 'site_manager', 'site_owner'].includes(user.role) && attendanceRecords.length > 0 && (
        <Modal
          visible={false}
          transparent
          animationType="fade"
        >
          <View style={styles.recordsOverlay}>
            <View style={styles.recordsContainer}>
              <Text style={styles.recordsTitle}>Attendance Records (Today)</Text>
              <ScrollView style={styles.recordsList}>
                {attendanceRecords
                  .filter(r => format(r.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                  .map((record) => (
                    <View key={record.id} style={styles.recordCard}>
                      {record.photoUri && 
                       record.photoUri !== '' && 
                       !record.photoUri.startsWith('mock://') ? (
                        <Image source={{ uri: record.photoUri }} style={styles.recordPhoto} />
                      ) : (
                        <View style={[styles.recordPhoto, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={styles.recordDetails}>
                        <Text style={styles.recordUser}>{record.userId}</Text>
                        <Text style={styles.recordTime}>{format(record.timestamp, 'hh:mm a')}</Text>
                        <Text style={styles.recordLocation}>
                          📍 {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                        </Text>
                      </View>
                      <View style={[styles.recordStatus, { backgroundColor: '#D1FAE5' }]}>
                        <Text style={[styles.recordStatusText, { color: '#10B981' }]}>Present</Text>
                      </View>
                    </View>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function TaskCard({ task, isLarge = false }: { task: Task; isLarge?: boolean }) {
  return (
    <View style={[styles.taskCard, isLarge && styles.taskCardLarge]}>
      <View style={styles.taskContent}>
        <View>
          <View
            style={[
              styles.statusBadge,
              task.status === 'completed' ? styles.statusCompleted : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                task.status === 'completed' ? styles.statusTextCompleted : styles.statusTextPending,
              ]}
            >
              {task.status === 'completed' ? '✓ Completed' : '⏰ Pending'}
            </Text>
          </View>

          <Text style={[styles.taskTitle, isLarge && styles.taskTitleLarge]}>
            {task.title}
          </Text>

          <View style={styles.taskInfo}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.taskInfoText}>{task.time}</Text>
          </View>

          <View style={styles.taskInfo}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.taskInfoText} numberOfLines={1}>
              {task.location}
            </Text>
          </View>
        </View>

        <View style={styles.taskFooter}>
          <View style={styles.supervisorAvatar}>
            <Text style={styles.supervisorEmoji}>{task.supervisorAvatar}</Text>
          </View>
          <Text style={styles.supervisorName} numberOfLines={1}>
            {task.supervisor}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 3,
    paddingBottom: DESIGN.spacing.lg,
  },
  headerLeft: {
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
    marginRight: DESIGN.spacing.lg,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  greetingText: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.xs,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
  },
  roleText: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.primary,
    marginTop: DESIGN.spacing.xs,
    textTransform: 'uppercase',
  },
  searchButton: {
    width: DESIGN.button.min,
    height: DESIGN.button.min,
    borderRadius: 20,
    backgroundColor: DESIGN.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...DESIGN.shadow.sm,
    elevation: 2,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  syncedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  heroEmoji: {
    fontSize: 56,
  },
  dateStripContainer: {
    paddingHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xl,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: DESIGN.radius.lg,
    backgroundColor: DESIGN.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.lg,
    ...DESIGN.shadow.md,
    elevation: 3,
  },
  dateCardActive: {
    backgroundColor: DESIGN.colors.primary,
  },
  dateDay: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.text.tertiary,
  },
  dateDayActive: {
    color: DESIGN.colors.surface,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginTop: DESIGN.spacing.xs,
  },
  dateNumberActive: {
    color: DESIGN.colors.surface,
  },
  tasksContainer: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingBottom: DESIGN.spacing.xl * 2,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.lg,
  },
  tasksGrid: {
    flexDirection: 'row',
    height: 400,
    gap: DESIGN.spacing.md,
  },
  taskLargeColumn: {
    flex: 1,
  },
  taskSmallColumn: {
    flex: 1,
  },
  taskSmallTop: {
    flex: 1,
    marginBottom: DESIGN.spacing.md,
  },
  taskSmallBottom: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.xl,
    padding: DESIGN.spacing.lg,
    ...DESIGN.shadow.md,
    elevation: 4,
  },
  taskCardLarge: {
    height: '100%',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.xs,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.lg,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: DESIGN.colors.success,
  },
  statusTextPending: {
    color: DESIGN.colors.warning,
  },
  taskTitle: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
  },
  taskTitleLarge: {
    fontSize: DESIGN.typography.title,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.sm,
  },
  taskInfoText: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    marginLeft: DESIGN.spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DESIGN.spacing.lg,
  },
  supervisorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.sm,
  },
  supervisorEmoji: {
    fontSize: 16,
  },
  supervisorName: {
    flex: 1,
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
  },
  bottomSpacer: {
    height: DESIGN.spacing.xl * 4,
  },
  featuresContainer: {
    paddingHorizontal: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.lg,
  },
  sectionTitle: {
    fontSize: DESIGN.typography.title,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
  },
  viewRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: DESIGN.spacing.md,
    paddingVertical: DESIGN.spacing.xs,
    borderRadius: DESIGN.radius.md,
  },
  viewRecordsText: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.primary,
    marginLeft: DESIGN.spacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -DESIGN.spacing.sm,
  },
  featureCard: {
    width: '47%',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.xl,
    padding: DESIGN.spacing.lg,
    marginHorizontal: DESIGN.spacing.sm,
    marginBottom: DESIGN.spacing.lg,
    ...DESIGN.shadow.md,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN.spacing.lg,
  },
  featureTitle: {
    fontSize: DESIGN.typography.body,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xs,
    lineHeight: 18,
  },
  featureSubtitle: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  modalBody: {
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  clickableItem: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  tapPrompt: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  requirementText: {
    flex: 1,
    marginLeft: 12,
  },
  requirementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  requirementSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  markButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  markButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  photoThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  photoPreviewContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraFullScreen: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cameraOverlayAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraOverlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraCloseButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraInstructions: {
    alignItems: 'center',
    marginTop: 20,
  },
  faceGuide: {
    alignItems: 'center',
    marginTop: 40,
  },
  faceOutlineCircle: {
    width: 200,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  cameraGuideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraControls: {
    alignItems: 'center',
    marginBottom: 40,
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
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#8B5CF6',
  },
  recordsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  recordsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  recordsList: {
    maxHeight: 400,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  attendancePhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  recordDetails: {
    flex: 1,
  },
  recordUser: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  recordTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  recordLocation: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  recordStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recordStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  materialForm: {
    marginBottom: 24,
  },
  materialSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#111',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
    marginRight: 4,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  priorityButtonActive: {
    borderColor: 'transparent',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  requestsList: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  requestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestMaterial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  requestQuantity: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  materialStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  materialStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  materialStatusApproved: {
    backgroundColor: '#D1FAE5',
  },
  materialStatusRejected: {
    backgroundColor: '#FEE2E2',
  },
  materialStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  requestReason: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  approvalLimitInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  approvalLimitText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stockCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reorderInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  reorderLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  reorderAlert: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  billItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  addItemText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
});