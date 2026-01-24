import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { API_BASE_URL } from '../../constants/api';
import { DESIGN } from '../../constants/designSystem';
import { OTPInput } from '../../components/OTPInput';

type Role = 'labour' | 'site_supervisor' | 'junior_engineer' | 'senior_engineer' | 'site_manager' | 'site_owner';

export default function LoginScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { setUser, setToken } = useUser();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (selectedRole && phoneNumber && phoneNumber.length === 10) {
      // Generate random 6-digit OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setShowOtpScreen(true);
      // In production, send this OTP via SMS API
      console.log('OTP sent:', randomOtp);
      alert(`OTP sent to your phone: ${randomOtp}`); // For testing
    }
  };

  const handleVerifyOtp = async (otpToVerify?: string) => {
    const otpValue = otpToVerify || otp;
    if (otpValue === generatedOtp) {
      // After successful OTP verification
      try {
        setShowOtpScreen(false);
        setLoading(true);

        // Different API calls based on auth mode
        const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/signin';
        console.log('📡 Calling API:', `${API_BASE_URL}${endpoint}`);
        console.log('📦 Payload:', { phoneNumber, role: selectedRole });

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            role: selectedRole,
          }),
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success) {
          console.log(`✓ ${authMode === 'signup' ? 'Sign up' : 'Sign in'} successful`);

          // Set token if provided (for labour API authentication)
          if (data.token) {
            setToken(data.token);
          }

          // Update user context
          setUser({
            role: selectedRole!,
            phoneNumber,
            name: data.user?.name || '',
            email: data.user?.email || '',
            id: data.userId || data.user?._id,
            location: data.user?.location || 'Mumbai, Maharashtra',
            profilePhoto: data.user?.profilePhoto || null,
            currentSiteId: data.user?.currentSiteId || data.user?.enrolledSiteId || null,
            enrolledSiteId: data.user?.enrolledSiteId || data.user?.currentSiteId || null,
          });

          if (authMode === 'signup') {
            // New user - go to profile setup
            console.log('→ Navigating to SetupProfile');
            router.replace({
              pathname: '/(auth)/setup-profile',
              params: { userId: data.userId, phoneNumber, role: selectedRole },
            });
          } else {
            // Existing user - go to dashboard
            console.log('→ Navigating to Dashboard');
            let dashboardPath = '/(tabs)/home';
            if (selectedRole === 'site_owner' || selectedRole === 'site_manager') {
              dashboardPath = '/(owner)/sites';
            } else if (selectedRole === 'labour') {
              // Labour goes to labour-specific dashboard
              dashboardPath = '/(labour)/(tabs)/home';
            } else if (selectedRole === 'site_supervisor') {
              // Supervisor goes to supervisor-specific dashboard
              dashboardPath = '/(supervisor)/(tabs)/home';
            }
            router.replace(dashboardPath);
          }
        } else {
          // Handle specific error cases
          console.error('❌ API returned error:', data.message);
          if (authMode === 'signup' && data.message?.includes('already exists')) {
            alert('Account already exists. Please sign in instead.');
          } else if (authMode === 'signin' && data.message?.includes('not found')) {
            alert('Account not found. Please sign up first.');
          } else {
            alert(data.message || `${authMode === 'signup' ? 'Sign up' : 'Sign in'} failed. Please try again.`);
          }
          setShowOtpScreen(true);
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
        console.error('Error details:', error.message);
        alert('Error during authentication. Please try again.');
        setShowOtpScreen(true);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  const handleOtpComplete = (enteredOtp: string) => {
    setOtp(enteredOtp);
    // Auto-verify when OTP is complete (6 digits)
    // Pass the enteredOtp directly to avoid state timing issues
    if (enteredOtp.length === 6) {
      handleVerifyOtp(enteredOtp);
    }
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'hi' as const, name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr' as const, name: 'मराठी', flag: '🇮🇳' },
    { code: 'ta' as const, name: 'தமிழ்', flag: '🇮🇳' },
  ];

  if (showLanguageModal) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={() => setShowLanguageModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={DESIGN.colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.modalTitle} allowFontScaling={false}>
            {t('login.selectLanguage')}
          </Text>

          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                language === lang.code && styles.languageCardActive,
              ]}
              onPress={() => {
                setLanguage(lang.code);
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageName,
                  language === lang.code && styles.languageNameActive,
                ]}
                allowFontScaling={false}
              >
                {lang.name}
              </Text>
              {language === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color={DESIGN.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (showOtpScreen) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setShowOtpScreen(false)} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={DESIGN.colors.primary} />
            <Text style={styles.backText} allowFontScaling={false}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.title} allowFontScaling={false}>
              Verify OTP
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Enter the 6-digit code sent to +91 {phoneNumber}
            </Text>
          </View>

          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleOtpComplete}
          />

          <TouchableOpacity
            style={[styles.button, otp.length === 6 && styles.buttonActive]}
            onPress={() => handleVerifyOtp(otp)}
            disabled={otp.length !== 6}
          >
            <Text style={styles.buttonText} allowFontScaling={false}>
              Verify & Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendOtp} style={styles.resendButton}>
            <Text style={styles.resendText} allowFontScaling={false}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Auth Mode Selection Screen (Sign In vs Sign Up)
  if (selectedRole && !authMode) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={DESIGN.colors.primary} />
            <Text style={styles.backText} allowFontScaling={false}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.title} allowFontScaling={false}>
              Welcome!
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              How would you like to proceed?
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.authModeCard, { backgroundColor: '#E0F2FE' }]}
            onPress={() => setAuthMode('signin')}
          >
            <View style={styles.authModeIcon}>
              <Ionicons name="log-in-outline" size={32} color="#0284C7" />
            </View>
            <View style={styles.authModeContent}>
              <Text style={styles.authModeTitle} allowFontScaling={false}>
                Sign In to Existing Account
              </Text>
              <Text style={styles.authModeDesc} allowFontScaling={false}>
                Already have an account? Sign in to continue
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authModeCard, { backgroundColor: '#F3E8FF' }]}
            onPress={() => setAuthMode('signup')}
          >
            <View style={styles.authModeIcon}>
              <Ionicons name="person-add-outline" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.authModeContent}>
              <Text style={styles.authModeTitle} allowFontScaling={false}>
                Create New Account
              </Text>
              <Text style={styles.authModeDesc} allowFontScaling={false}>
                New user? Create your account to get started
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Role Selection Screen
  if (!selectedRole) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons name="language" size={20} color={DESIGN.colors.primary} />
            <Text style={styles.languageButtonText} allowFontScaling={false}>
              {languages.find((l) => l.code === language)?.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🏗️</Text>
            <Text style={styles.title} allowFontScaling={false}>
              InfraTrace
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Digitising Indian Construction Sites
            </Text>
          </View>

          <Text style={styles.sectionTitle} allowFontScaling={false}>
            {t('login.selectRole')}
          </Text>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#BEE7E8' }]}
            onPress={() => setSelectedRole('labour')}
          >
            <Text style={styles.roleEmoji}>👷</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.labour')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Daily attendance & task tracking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#FFD166' }]}
            onPress={() => setSelectedRole('site_supervisor')}
          >
            <Text style={styles.roleEmoji}>👨‍💼</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.site_supervisor')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Verify attendance & assign tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#F6C1CC' }]}
            onPress={() => setSelectedRole('junior_engineer')}
          >
            <Text style={styles.roleEmoji}>👨‍🔧</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.junior_engineer')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Assign tasks to supervisors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#C1E7E3' }]}
            onPress={() => setSelectedRole('senior_engineer')}
          >
            <Text style={styles.roleEmoji}>👨‍🏭</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.senior_engineer')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Technical oversight & approvals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#FFE5B4' }]}
            onPress={() => setSelectedRole('site_manager')}
          >
            <Text style={styles.roleEmoji}>👔</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.site_manager')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Manage sites, workers & enrollments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#D4A5FF' }]}
            onPress={() => setSelectedRole('site_owner')}
          >
            <Text style={styles.roleEmoji}>🏢</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.site_owner')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Full site analytics & control
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setAuthMode(null)} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={DESIGN.colors.primary} />
          <Text style={styles.backText} allowFontScaling={false}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title} allowFontScaling={false}>
            {t('login.title')}
          </Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            We'll send you an OTP to verify
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label} allowFontScaling={false}>
            {t('login.phoneNumber')}
          </Text>
          <View style={styles.phoneInput}>
            <Text style={styles.prefix} allowFontScaling={false}>
              +91
            </Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder={t('login.phonePlaceholder')}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              placeholderTextColor={DESIGN.colors.text.tertiary}
              allowFontScaling={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, phoneNumber.length === 10 && styles.buttonActive]}
          onPress={handleSendOtp}
          disabled={phoneNumber.length !== 10}
        >
          <Text style={styles.buttonText} allowFontScaling={false}>
            Send OTP
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  content: {
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 2,
    paddingBottom: DESIGN.spacing.xl,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.sm,
    borderRadius: 20,
    marginBottom: DESIGN.spacing.xl,
    ...DESIGN.shadow.sm,
    elevation: 3,
  },
  languageButtonText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.primary,
    fontWeight: '600',
    marginLeft: DESIGN.spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: DESIGN.spacing.lg,
    paddingTop: DESIGN.spacing.xl * 3,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: DESIGN.spacing.xl,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xl * 2,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surface,
    padding: DESIGN.spacing.lg,
    borderRadius: DESIGN.radius.lg,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardActive: {
    borderColor: DESIGN.colors.primary,
    backgroundColor: '#F3E8FF',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: DESIGN.spacing.lg,
  },
  languageName: {
    flex: 1,
    fontSize: DESIGN.typography.subtitle,
    color: DESIGN.colors.text.secondary,
    fontWeight: '600',
  },
  languageNameActive: {
    color: DESIGN.colors.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: DESIGN.spacing.xl * 2.5,
  },
  emoji: {
    fontSize: 60,
    marginBottom: DESIGN.spacing.lg,
  },
  title: {
    fontSize: DESIGN.typography.title,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.sm,
  },
  subtitle: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xl,
  },
  roleCard: {
    padding: DESIGN.spacing.xl,
    borderRadius: DESIGN.radius.xl,
    marginBottom: DESIGN.spacing.lg,
    alignItems: 'center',
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: DESIGN.spacing.sm,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xs,
  },
  roleDesc: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    textAlign: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN.spacing.xl,
  },
  backText: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.primary,
    fontWeight: '600',
    marginLeft: DESIGN.spacing.sm,
  },
  inputContainer: {
    marginBottom: DESIGN.spacing.xl,
  },
  label: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    marginBottom: DESIGN.spacing.sm,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    paddingHorizontal: DESIGN.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  prefix: {
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.primary,
    marginRight: DESIGN.spacing.sm,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: DESIGN.typography.body,
    color: DESIGN.colors.text.primary,
    paddingVertical: DESIGN.spacing.lg,
    paddingHorizontal: DESIGN.spacing.sm,
  },
  button: {
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.lg,
    paddingVertical: DESIGN.spacing.lg + 2,
    alignItems: 'center',
    opacity: 0.5,
  },
  buttonActive: {
    opacity: 1,
  },
  buttonText: {
    color: DESIGN.colors.surface,
    fontSize: DESIGN.typography.subtitle,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.xl * 2,
  },
  otpInput: {
    flex: 1,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    paddingVertical: DESIGN.spacing.xl,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: DESIGN.colors.text.primary,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: DESIGN.spacing.lg,
  },
  resendText: {
    color: DESIGN.colors.primary,
    fontSize: DESIGN.typography.body,
    fontWeight: '600',
  },
  authModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DESIGN.spacing.xl,
    borderRadius: DESIGN.radius.lg,
    marginBottom: DESIGN.spacing.lg,
    ...DESIGN.shadow.sm,
    elevation: 3,
  },
  authModeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN.spacing.lg,
  },
  authModeContent: {
    flex: 1,
  },
  authModeTitle: {
    fontSize: DESIGN.typography.subtitle,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    marginBottom: DESIGN.spacing.xs,
  },
  authModeDesc: {
    fontSize: DESIGN.typography.caption,
    color: DESIGN.colors.text.secondary,
    lineHeight: 16,
  },
});
