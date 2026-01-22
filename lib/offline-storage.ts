/**
 * Offline-First Storage for Site Enrollment
 * Handles local data persistence and sync with backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  DEVICE_ID: 'deviceId',
  ENROLLMENT_DATA: 'enrollmentData',
  SITE_DATA: 'siteData',
  PENDING_ACTIONS: 'pendingActions',
  LAST_SYNC: 'lastSync',
  USER_DATA: 'userData',
};

// ============================================================================
// TYPES
// ============================================================================

export type EnrollmentData = {
  workerId: string;
  siteId: string;
  siteName: string;
  enrolledAt: string;
  needsVerification: boolean;
  lastSynced?: string;
};

export type SiteData = {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  projectType: string;
  status: string;
};

export type PendingAction = {
  id: string;
  type: 'attendance' | 'material_request' | 'task_update' | 'photo_upload';
  data: any;
  timestamp: string;
  retryCount: number;
};

// ============================================================================
// DEVICE MANAGEMENT
// ============================================================================

/**
 * Get or generate unique device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `device_${Date.now()}`;
  }
}

// ============================================================================
// ENROLLMENT DATA
// ============================================================================

/**
 * Save enrollment data locally
 */
export async function saveEnrollmentData(data: EnrollmentData): Promise<void> {
  try {
    const dataWithSync = {
      ...data,
      lastSynced: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.ENROLLMENT_DATA, JSON.stringify(dataWithSync));
  } catch (error) {
    console.error('Error saving enrollment data:', error);
    throw error;
  }
}

/**
 * Get enrollment data from local storage
 */
export async function getEnrollmentData(): Promise<EnrollmentData | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLMENT_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting enrollment data:', error);
    return null;
  }
}

/**
 * Clear enrollment data (when worker leaves site)
 */
export async function clearEnrollmentData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ENROLLMENT_DATA);
  } catch (error) {
    console.error('Error clearing enrollment data:', error);
  }
}

// ============================================================================
// SITE DATA CACHING
// ============================================================================

/**
 * Cache site data for offline access
 */
export async function cacheSiteData(site: SiteData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SITE_DATA, JSON.stringify(site));
  } catch (error) {
    console.error('Error caching site data:', error);
  }
}

/**
 * Get cached site data
 */
export async function getCachedSiteData(): Promise<SiteData | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SITE_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached site data:', error);
    return null;
  }
}

// ============================================================================
// PENDING ACTIONS QUEUE
// ============================================================================

/**
 * Add action to pending queue (for offline operations)
 */
export async function queuePendingAction(action: Omit<PendingAction, 'id' | 'retryCount'>): Promise<void> {
  try {
    const existing = await getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
    };
    
    const updated = [...existing, newAction];
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error queuing pending action:', error);
  }
}

/**
 * Get all pending actions
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
}

/**
 * Remove action from pending queue (after successful sync)
 */
export async function removePendingAction(actionId: string): Promise<void> {
  try {
    const existing = await getPendingActions();
    const updated = existing.filter(action => action.id !== actionId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing pending action:', error);
  }
}

/**
 * Increment retry count for failed action
 */
export async function incrementRetryCount(actionId: string): Promise<void> {
  try {
    const existing = await getPendingActions();
    const updated = existing.map(action => 
      action.id === actionId 
        ? { ...action, retryCount: action.retryCount + 1 }
        : action
    );
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error incrementing retry count:', error);
  }
}

// ============================================================================
// SYNC MANAGEMENT
// ============================================================================

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
}

/**
 * Sync enrollment data with backend
 */
export async function syncEnrollmentData(): Promise<{ success: boolean; error?: string }> {
  try {
    const online = await isOnline();
    if (!online) {
      return { success: false, error: 'No internet connection' };
    }

    const enrollmentData = await getEnrollmentData();
    if (!enrollmentData) {
      return { success: false, error: 'No enrollment data to sync' };
    }

    // Fetch latest data from backend
    const response = await fetch(`http://localhost:3000/api/enrollment/worker/${enrollmentData.workerId}/current`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch enrollment data' };
    }

    const data = await response.json();

    if (data.enrolled) {
      // Update local cache with latest data
      await saveEnrollmentData({
        workerId: enrollmentData.workerId,
        siteId: data.site.id,
        siteName: data.site.name,
        enrolledAt: data.enrollment.enrolledAt,
        needsVerification: !data.enrollment.verified,
      });

      // Cache site data for offline access
      await cacheSiteData(data.site);

      // Update last sync timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      return { success: true };
    } else {
      // Worker no longer enrolled (revoked?)
      await clearEnrollmentData();
      return { success: false, error: 'Enrollment has been revoked' };
    }
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: 'Sync failed' };
  }
}

/**
 * Sync pending actions with backend
 */
export async function syncPendingActions(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  try {
    const online = await isOnline();
    if (!online) {
      return { synced, failed };
    }

    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      // Skip actions that have failed too many times
      if (action.retryCount >= 5) {
        console.warn(`Action ${action.id} exceeded retry limit, skipping`);
        await removePendingAction(action.id);
        failed++;
        continue;
      }

      try {
        // Sync based on action type
        let endpoint = '';
        let method = 'POST';

        switch (action.type) {
          case 'attendance':
            endpoint = '/api/attendance';
            break;
          case 'material_request':
            endpoint = '/api/materials/request';
            break;
          case 'task_update':
            endpoint = '/api/tasks/update';
            break;
          case 'photo_upload':
            endpoint = '/api/photos/upload';
            break;
        }

        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });

        if (response.ok) {
          await removePendingAction(action.id);
          synced++;
        } else {
          await incrementRetryCount(action.id);
          failed++;
        }
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        await incrementRetryCount(action.id);
        failed++;
      }
    }
  } catch (error) {
    console.error('Error syncing pending actions:', error);
  }

  return { synced, failed };
}

/**
 * Full sync (enrollment + pending actions)
 */
export async function performFullSync(): Promise<void> {
  try {
    // Sync enrollment data
    const enrollmentResult = await syncEnrollmentData();
    
    if (enrollmentResult.success) {
      // Sync pending actions
      const actionsResult = await syncPendingActions();
      console.log(`Sync complete: ${actionsResult.synced} synced, ${actionsResult.failed} failed`);
    } else {
      console.warn('Enrollment sync failed:', enrollmentResult.error);
    }
  } catch (error) {
    console.error('Full sync error:', error);
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

// ============================================================================
// AUTO-SYNC SETUP
// ============================================================================

/**
 * Setup automatic sync when device comes online
 */
export function setupAutoSync(): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      console.log('Device online, triggering sync...');
      performFullSync();
    }
  });

  // Initial sync
  performFullSync();

  return unsubscribe;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all local data (logout)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ENROLLMENT_DATA,
      STORAGE_KEYS.SITE_DATA,
      STORAGE_KEYS.PENDING_ACTIONS,
      STORAGE_KEYS.LAST_SYNC,
      STORAGE_KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
}

/**
 * Get storage size (for debugging)
 */
export async function getStorageSize(): Promise<string> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }

    const kb = totalSize / 1024;
    return `${kb.toFixed(2)} KB`;
  } catch (error) {
    console.error('Error getting storage size:', error);
    return '0 KB';
  }
}
