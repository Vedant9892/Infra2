import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ENROLLMENT: '@enrollment_data',
  SITE_CODE: '@site_code',
  PENDING_ENROLLMENT: '@pending_enrollment',
};

export type StoredEnrollment = {
  workerId: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  enrolledAt: string;
  status: 'active' | 'revoked';
};

// Save enrollment data locally for offline usage
export const saveEnrollmentLocally = async (enrollment: StoredEnrollment): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLMENT, JSON.stringify(enrollment));
  } catch (error) {
    console.error('Error saving enrollment locally:', error);
  }
};

// Get locally stored enrollment
export const getLocalEnrollment = async (): Promise<StoredEnrollment | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLMENT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting local enrollment:', error);
    return null;
  }
};

// Remove local enrollment (when revoked or logged out)
export const removeLocalEnrollment = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ENROLLMENT);
  } catch (error) {
    console.error('Error removing local enrollment:', error);
  }
};

// Check if worker is enrolled
export const isWorkerEnrolled = async (): Promise<boolean> => {
  const enrollment = await getLocalEnrollment();
  return enrollment !== null && enrollment.status === 'active';
};

// Save pending enrollment for when app comes online
export const savePendingEnrollment = async (siteCode: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ENROLLMENT, siteCode);
  } catch (error) {
    console.error('Error saving pending enrollment:', error);
  }
};

// Get pending enrollment
export const getPendingEnrollment = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ENROLLMENT);
  } catch (error) {
    console.error('Error getting pending enrollment:', error);
    return null;
  }
};

// Clear pending enrollment
export const clearPendingEnrollment = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_ENROLLMENT);
  } catch (error) {
    console.error('Error clearing pending enrollment:', error);
  }
};
