import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';
import { DESIGN } from '../../constants/designSystem';

type EnrollmentStep = 'enter-code' | 'validate-code' | 'confirm-details' | 'enrolling' | 'success';

type SiteInfo = {
  id: string;
  name: string;
  location: string;
  projectType: string;
  remainingSlots: number | null;
  expiresAt: string | null;
};

export default function WorkerEnrollment() {
  const router = useRouter();
  const { user, setUser } = useUser();
  
  const [step, setStep] = useState<EnrollmentStep>('enter-code');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Worker details
  const [workerName, setWorkerName] = useState(user?.name || '');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerRole, setWorkerRole] = useState<'labour' | 'engineer' | 'supervisor'>('labour');

  const handleCodeChange = (text: string) => {
    // Only allow digits, max 6 characters
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setEnrollmentCode(cleaned);
  };

  const validateCode = async () => {
    if (enrollmentCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit enrollment code');
      return;
    }

    try {
      setLoading(true);
      setStep('validate-code');

      const response = await fetch('http://localhost:3000/api/enrollment/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentCode }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setSiteInfo(data.site);
        setStep('confirm-details');
      } else {
        Alert.alert('Invalid Code', data.error || 'This enrollment code is invalid or expired');
        setStep('enter-code');
      }
    } catch (error) {
      console.error('Validation error:', error);
      Alert.alert('Error', 'Unable to validate code. Please check your internet connection.');
      setStep('enter-code');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!workerName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!workerPhone.trim() || workerPhone.length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      setStep('enrolling');

      // Get device ID for offline sync
      const deviceId = await AsyncStorage.getItem('deviceId') || `device_${Date.now()}`;
      await AsyncStorage.setItem('deviceId', deviceId);

      const response = await fetch('http://localhost:3000/api/enrollment/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentCode,
          workerPhoneNumber: workerPhone,
          workerName,
          workerRole,
          deviceId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store enrollment data locally for offline-first
        await AsyncStorage.setItem('enrollmentData', JSON.stringify({
          workerId: data.enrollment.workerId,
          siteId: data.enrollment.siteId,
          siteName: data.enrollment.siteName,
          enrolledAt: data.enrollment.enrolledAt,
          needsVerification: data.enrollment.needsVerification,
        }));

        // Update user context (ensure required fields are present)
        setUser({
          role: workerRole, // 'labour' | 'engineer' | 'supervisor'
          name: workerName,
          phoneNumber: workerPhone,
          location: user?.location ?? 'Mumbai, Maharashtra',
          currentSiteId: data.enrollment.siteId,
          currentSiteName: data.enrollment.siteName,
          enrollmentStatus: 'active',
        });

        setStep('success');

        // Auto-redirect after 3 seconds
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 3000);
      } else {
        if (response.status === 400 && data.error === 'Already enrolled') {
          Alert.alert(
            'Already Enrolled',
            data.message,
            [
              {
                text: 'Contact Manager',
                onPress: () => router.back(),
              },
              {
                text: 'OK',
              },
            ]
          );
        } else {
          Alert.alert('Enrollment Failed', data.error || 'Unable to complete enrollment');
        }
        setStep('confirm-details');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      Alert.alert('Error', 'Unable to complete enrollment. Please check your internet connection.');
      setStep('confirm-details');
    } finally {
      setLoading(false);
    }
  };

  const renderCodeInput = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.iconGradient}>
          <Ionicons name="key" size={48} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Enter Enrollment Code</Text>
      <Text style={styles.stepSubtitle}>
        Ask your site manager for the 6-digit enrollment code
      </Text>

      <View style={styles.codeInputContainer}>
        <TextInput
          style={styles.codeInput}
          value={enrollmentCode}
          onChangeText={handleCodeChange}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          placeholderTextColor="#D1D5DB"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, enrollmentCode.length !== 6 && styles.buttonDisabled]}
        onPress={validateCode}
        disabled={enrollmentCode.length !== 6 || loading}
      >
        <Text style={styles.primaryButtonText}>Validate Code</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderValidating = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.loadingText}>Validating code...</Text>
    </View>
  );

  const renderConfirmDetails = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContainer}>
        <View style={styles.siteInfoCard}>
          <Ionicons name="business" size={32} color="#8B5CF6" />
          <Text style={styles.siteInfoName}>{siteInfo?.name}</Text>
          <Text style={styles.siteInfoLocation}>{siteInfo?.location}</Text>
          <View style={styles.siteInfoBadge}>
            <Text style={styles.siteInfoBadgeText}>{siteInfo?.projectType}</Text>
          </View>
          {siteInfo?.remainingSlots && (
            <Text style={styles.siteInfoSlots}>
              {siteInfo.remainingSlots} spots remaining
            </Text>
          )}
        </View>

        <Text style={styles.formTitle}>Your Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={workerName}
            onChangeText={setWorkerName}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={workerPhone}
            onChangeText={setWorkerPhone}
            placeholder="10-digit phone number"
            keyboardType="phone-pad"
            maxLength={15}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Your Role *</Text>
          <View style={styles.roleButtons}>
            {['labour', 'engineer', 'supervisor'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleButton,
                  workerRole === role && styles.roleButtonActive,
                ]}
                onPress={() => setWorkerRole(role as 'labour' | 'engineer' | 'supervisor')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    workerRole === role && styles.roleButtonTextActive,
                  ]}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoBoxText}>
            Your manager will verify your enrollment before you can access all features
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEnroll}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>Complete Enrollment</Text>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            setStep('enter-code');
            setEnrollmentCode('');
            setSiteInfo(null);
          }}
        >
          <Text style={styles.secondaryButtonText}>Change Code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderEnrolling = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.loadingText}>Enrolling you to {siteInfo?.name}...</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      </View>
      
      <Text style={styles.successTitle}>Enrollment Successful!</Text>
      <Text style={styles.successSubtitle}>
        You are now enrolled in {siteInfo?.name}
      </Text>

      <View style={styles.successInfo}>
        <View style={styles.successInfoRow}>
          <Ionicons name="person" size={20} color="#6B7280" />
          <Text style={styles.successInfoText}>{workerName}</Text>
        </View>
        <View style={styles.successInfoRow}>
          <Ionicons name="briefcase" size={20} color="#6B7280" />
          <Text style={styles.successInfoText}>
            {workerRole.charAt(0).toUpperCase() + workerRole.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.pendingBadge}>
        <Ionicons name="time" size={16} color="#F59E0B" />
        <Text style={styles.pendingBadgeText}>Pending Manager Verification</Text>
      </View>

      <Text style={styles.redirectText}>Redirecting to dashboard...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Enrollment</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: 
                  step === 'enter-code' ? '25%' :
                  step === 'validate-code' ? '50%' :
                  step === 'confirm-details' ? '75%' :
                  '100%',
              },
            ]}
          />
        </View>
      </View>

      {/* Step Content */}
      {step === 'enter-code' && renderCodeInput()}
      {step === 'validate-code' && renderValidating()}
      {step === 'confirm-details' && renderConfirmDetails()}
      {step === 'enrolling' && renderEnrolling()}
      {step === 'success' && renderSuccess()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 3,
    paddingBottom: DESIGN.spacing.lg,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  backButton: {
    marginRight: DESIGN.spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
  },
  progressContainer: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
  },
  progressBar: {
    height: 4,
    backgroundColor: DESIGN.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DESIGN.colors.primary,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: DESIGN.spacing.xl * 2,
    marginBottom: DESIGN.spacing.xl * 2,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.lg,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DESIGN.spacing.xl * 2.5,
    paddingHorizontal: DESIGN.spacing.lg,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: DESIGN.spacing.xl * 2,
  },
  codeInput: {
    fontSize: 48,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 12,
    borderBottomWidth: 3,
    borderBottomColor: DESIGN.colors.primary,
    paddingVertical: DESIGN.spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN.colors.primary,
    paddingVertical: DESIGN.spacing.lg,
    paddingHorizontal: DESIGN.spacing.xl,
    borderRadius: DESIGN.radius.md,
    width: '100%',
    marginBottom: DESIGN.spacing.lg,
    gap: DESIGN.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '700',
    color: DESIGN.colors.surface,
  },
  secondaryButton: {
    paddingVertical: DESIGN.spacing.md,
  },
  secondaryButtonText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
  },
  loadingText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    marginTop: DESIGN.spacing.lg,
  },
  siteInfoCard: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: DESIGN.spacing.xl * 2,
    ...DESIGN.shadow.md,
    elevation: 3,
  },
  siteInfoName: {
    fontSize: 22,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginTop: DESIGN.spacing.lg,
    marginBottom: DESIGN.spacing.xs,
    textAlign: 'center',
  },
  siteInfoLocation: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.lg,
  },
  siteInfoBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.sm,
    borderRadius: DESIGN.radius.sm,
    marginBottom: DESIGN.spacing.sm,
  },
  siteInfoBadgeText: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.primary,
  },
  siteInfoSlots: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.success,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xl,
    alignSelf: 'flex-start',
  },
  inputGroup: {
    width: '100%',
    marginBottom: DESIGN.spacing.xl,
  },
  inputLabel: {
    fontSize: DESIGN.typography.caption,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.sm,
  },
  input: {
    backgroundColor: DESIGN.colors.surface,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.md,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.lg,
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: DESIGN.spacing.xl,
    gap: DESIGN.spacing.md,
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DESIGN.spacing.sm,
  },
  roleButton: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.sm,
    borderWidth: 2,
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surface,
  },
  roleButtonActive: {
    borderColor: DESIGN.colors.primary,
    backgroundColor: '#F3E8FF',
  },
  roleButtonText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    color: DESIGN.colors.text.secondary,
  },
  roleButtonTextActive: {
    color: DESIGN.colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.lg,
    borderRadius: DESIGN.radius.md,
    marginBottom: DESIGN.spacing.xl,
    width: '100%',
    gap: DESIGN.spacing.md,
  },
  infoBoxText: {
    flex: 1,
    fontSize: DESIGN.typography.caption,
    color: '#1E40AF',
  },
  successIcon: {
    marginTop: DESIGN.spacing.xl * 2,
    marginBottom: DESIGN.spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
  },
  successSubtitle: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DESIGN.spacing.xl * 2,
  },
  successInfo: {
    backgroundColor: DESIGN.colors.background,
    borderRadius: DESIGN.radius.md,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.xl,
    width: '100%',
    marginBottom: DESIGN.spacing.lg,
    gap: DESIGN.spacing.lg,
  },
  successInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN.spacing.lg,
  },
  successInfoText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN.spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    borderRadius: DESIGN.radius.sm,
    marginBottom: DESIGN.spacing.xl,
  },
  pendingBadgeText: {
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
    color: '#92400E',
  },
  redirectText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.tertiary,
  },
});
