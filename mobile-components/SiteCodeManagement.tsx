import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

type SiteCodeManagementProps = {
  siteId: string;
  siteName: string;
};

export default function SiteCodeManagement({ siteId, siteName }: SiteCodeManagementProps) {
  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [maxEnrollments, setMaxEnrollments] = useState<number | null>(null);
  const [isEnrollmentActive, setIsEnrollmentActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentCode();
  }, [siteId]);

  const fetchCurrentCode = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${siteId}/enrollment-code`);
      
      if (response.ok) {
        const data = await response.json();
        setEnrollmentCode(data.code);
        setCodeExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
        setUsageCount(data.usageCount);
        setMaxEnrollments(data.maxEnrollments);
        setIsEnrollmentActive(data.isActive);
      }
    } catch (error) {
      console.error('Error fetching code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    Alert.alert(
      'Generate New Code',
      'Choose code settings:',
      [
        {
          text: 'No Expiry, Unlimited',
          onPress: () => generateCode(null, null),
        },
        {
          text: '7 Days, 50 Workers',
          onPress: () => generateCode(7, 50),
        },
        {
          text: '30 Days, 100 Workers',
          onPress: () => generateCode(30, 100),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const generateCode = async (expiresInDays: number | null, maxEnrollments: number | null) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/enrollment/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          expiresInDays,
          maxEnrollments,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEnrollmentCode(data.enrollmentCode);
        setCodeExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
        setUsageCount(0);
        setMaxEnrollments(maxEnrollments);
        
        Alert.alert(
          'Code Generated!',
          `New enrollment code: ${data.enrollmentCode}\n\nShare this with workers to let them join ${siteName}.`,
          [
            { text: 'Copy Code', onPress: () => copyCode(data.enrollmentCode) },
            { text: 'Share Code', onPress: () => shareCode(data.enrollmentCode) },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Generate code error:', error);
      Alert.alert('Error', 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Code copied to clipboard');
  };

  const shareCode = async (code: string) => {
    try {
      await Share.share({
        message: `Join ${siteName} construction site!\n\nEnrollment Code: ${code}\n\nDownload the app and enter this code to get started.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const toggleEnrollment = async () => {
    try {
      const response = await fetch(`/api/enrollment/pause/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: isEnrollmentActive }),
      });

      if (response.ok) {
        setIsEnrollmentActive(!isEnrollmentActive);
        Alert.alert(
          'Success',
          isEnrollmentActive ? 'Enrollment paused' : 'Enrollment resumed'
        );
      }
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Failed to update enrollment status');
    }
  };

  const formatExpiryDate = (date: Date | null) => {
    if (!date) return 'Never expires';
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  if (loading && !enrollmentCode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="key" size={24} color="#8B5CF6" />
        <Text style={styles.headerTitle}>Enrollment Code</Text>
      </View>

      {enrollmentCode ? (
        <>
          {/* Code Display */}
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.codeCard}
          >
            <Text style={styles.codeLabel}>Current Code</Text>
            <Text style={styles.codeText}>{enrollmentCode}</Text>
            
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.codeActionButton}
                onPress={() => copyCode(enrollmentCode)}
              >
                <Ionicons name="copy-outline" size={20} color="#fff" />
                <Text style={styles.codeActionText}>Copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.codeActionButton}
                onPress={() => shareCode(enrollmentCode)}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.codeActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Code Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Workers Enrolled</Text>
                <Text style={styles.infoValue}>
                  {usageCount}{maxEnrollments ? ` / ${maxEnrollments}` : ''}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Expiry</Text>
                <Text style={styles.infoValue}>
                  {formatExpiryDate(codeExpiresAt)}
                </Text>
              </View>
            </View>

            {/* Status Toggle */}
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusLabel}>Accept New Enrollments</Text>
                <Text style={styles.statusSubtext}>
                  {isEnrollmentActive ? 'Workers can join' : 'Enrollment paused'}
                </Text>
              </View>
              <Switch
                value={isEnrollmentActive}
                onValueChange={toggleEnrollment}
                trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
                thumbColor={isEnrollmentActive ? '#8B5CF6' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={handleGenerateCode}
              disabled={loading}
            >
              <Ionicons name="refresh" size={20} color="#8B5CF6" />
              <Text style={styles.regenerateButtonText}>
                Generate New Code
              </Text>
            </TouchableOpacity>

            <Text style={styles.warningText}>
              ⚠️ Generating a new code will invalidate the current one
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noCodeSection}>
          <Ionicons name="key-outline" size={64} color="#D1D5DB" />
          <Text style={styles.noCodeTitle}>No Active Code</Text>
          <Text style={styles.noCodeText}>
            Generate an enrollment code to let workers join this site
          </Text>
          
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateCode}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.generateButtonGradient}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>Generate Code</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  codeCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 8,
    marginBottom: 20,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    alignItems: 'center',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    marginBottom: 12,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
  },
  noCodeSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCodeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  noCodeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
