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

type Role = 'labour' | 'supervisor' | 'engineer' | 'owner';

export default function LoginScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { setUser } = useUser();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp === generatedOtp) {
      // After successful OTP verification
      try {
        setShowOtpScreen(false);
        setLoading(true);

        // Call login API
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            role: selectedRole,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const userId = data.userId;
          console.log('✓ Login successful, userId:', userId);
          
          // Update user context
          setUser({
            role: selectedRole!,
            phoneNumber,
            name: '',
            location: 'Mumbai, Maharashtra',
          });

          // Navigate to profile setup
          console.log('→ Navigating to SetupProfile');
          router.replace({
            pathname: '/(auth)/setup-profile',
            params: { userId },
          });
        } else {
          alert('Login failed. Please try again.');
          setShowOtpScreen(true);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Error during login. Please try again.');
        setShowOtpScreen(true);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
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

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.otpInput}
                autoFocus={index === 0}
                allowFontScaling={false}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.button, otp.every(d => d !== '') && styles.buttonActive]} 
            onPress={handleVerifyOtp}
            disabled={!otp.every(d => d !== '')}
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
            onPress={() => setSelectedRole('supervisor')}
          >
            <Text style={styles.roleEmoji}>👨‍💼</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.supervisor')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Manage teams & approve tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#F6C1CC' }]}
            onPress={() => setSelectedRole('engineer')}
          >
            <Text style={styles.roleEmoji}>👨‍🔧</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.engineer')}
            </Text>
            <Text style={styles.roleDesc} allowFontScaling={false}>
              Technical oversight & planning
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#D4A5FF' }]}
            onPress={() => setSelectedRole('owner')}
          >
            <Text style={styles.roleEmoji}>👔</Text>
            <Text style={styles.roleTitle} allowFontScaling={false}>
              {t('login.owner')}
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
        <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.back}>
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
});
