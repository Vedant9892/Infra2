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
            <Ionicons name="close" size={28} color="#111" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>{t('login.selectLanguage')}</Text>

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
              >
                {lang.name}
              </Text>
              {language === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
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
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to +91 {phoneNumber}</Text>
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
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.button, otp.every(d => d !== '') && styles.buttonActive]} 
            onPress={handleVerifyOtp}
            disabled={!otp.every(d => d !== '')}
          >
            <Text style={styles.buttonText}>Verify & Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendOtp} style={styles.resendButton}>
            <Text style={styles.resendText}>Resend OTP</Text>
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
            <Ionicons name="language" size={24} color="#8B5CF6" />
            <Text style={styles.languageButtonText}>
              {languages.find((l) => l.code === language)?.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>🏗️</Text>
            <Text style={styles.title}>InfraTrace</Text>
            <Text style={styles.subtitle}>Digitising Indian Construction Sites</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('login.selectRole')}</Text>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#BEE7E8' }]}
            onPress={() => setSelectedRole('labour')}
          >
            <Text style={styles.roleEmoji}>👷</Text>
            <Text style={styles.roleTitle}>{t('login.labour')}</Text>
            <Text style={styles.roleDesc}>Daily attendance & task tracking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#FFD166' }]}
            onPress={() => setSelectedRole('supervisor')}
          >
            <Text style={styles.roleEmoji}>👨‍💼</Text>
            <Text style={styles.roleTitle}>{t('login.supervisor')}</Text>
            <Text style={styles.roleDesc}>Manage teams & approve tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#F6C1CC' }]}
            onPress={() => setSelectedRole('engineer')}
          >
            <Text style={styles.roleEmoji}>👨‍🔧</Text>
            <Text style={styles.roleTitle}>{t('login.engineer')}</Text>
            <Text style={styles.roleDesc}>Technical oversight & planning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: '#D4A5FF' }]}
            onPress={() => setSelectedRole('owner')}
          >
            <Text style={styles.roleEmoji}>👔</Text>
            <Text style={styles.roleTitle}>{t('login.owner')}</Text>
            <Text style={styles.roleDesc}>Full site analytics & control</Text>
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
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>We'll send you an OTP to verify</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('login.phoneNumber')}</Text>
          <View style={styles.phoneInput}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder={t('login.phonePlaceholder')}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, phoneNumber.length === 10 && styles.buttonActive]} 
          onPress={handleSendOtp}
          disabled={phoneNumber.length !== 10}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
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
    padding: 24,
    paddingTop: 60,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContent: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 32,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageName: {
    flex: 1,
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  languageNameActive: {
    color: '#8B5CF6',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E73',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  roleCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#6E6E73',
    marginBottom: 8,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  prefix: {
    fontSize: 18,
    color: '#1C1C1E',
    marginRight: 8,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1C1C1E',
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    opacity: 0.5,
  },
  buttonActive: {
    opacity: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1C1C1E',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
});
