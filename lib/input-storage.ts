/**
 * Input Storage System
 * Stores all form inputs locally and restores them when screens open
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key prefix
const STORAGE_PREFIX = '@input_storage:';

/**
 * Generate storage key for a screen/component
 */
function getStorageKey(screenName: string, fieldName?: string): string {
  if (fieldName) {
    return `${STORAGE_PREFIX}${screenName}:${fieldName}`;
  }
  return `${STORAGE_PREFIX}${screenName}`;
}

/**
 * Store a single input value
 */
export async function storeInput(
  screenName: string,
  fieldName: string,
  value: string
): Promise<void> {
  try {
    const key = getStorageKey(screenName, fieldName);
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error storing input ${screenName}.${fieldName}:`, error);
  }
}

/**
 * Retrieve a single input value
 */
export async function getInput(
  screenName: string,
  fieldName: string
): Promise<string | null> {
  try {
    const key = getStorageKey(screenName, fieldName);
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting input ${screenName}.${fieldName}:`, error);
    return null;
  }
}

/**
 * Store multiple inputs at once (object)
 */
export async function storeInputs(
  screenName: string,
  inputs: Record<string, string>
): Promise<void> {
  try {
    const promises = Object.entries(inputs).map(([fieldName, value]) =>
      storeInput(screenName, fieldName, value)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error(`Error storing inputs for ${screenName}:`, error);
  }
}

/**
 * Retrieve all inputs for a screen
 */
export async function getAllInputs(
  screenName: string
): Promise<Record<string, string>> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const screenKeys = keys.filter((key) =>
      key.startsWith(getStorageKey(screenName))
    );

    const inputs: Record<string, string> = {};
    const values = await AsyncStorage.multiGet(screenKeys);

    for (const [key, value] of values) {
      if (value) {
        // Extract field name from key: "@input_storage:screenName:fieldName"
        const parts = key.split(':');
        if (parts.length >= 3) {
          const fieldName = parts.slice(2).join(':'); // Handle field names with colons
          inputs[fieldName] = value;
        }
      }
    }

    return inputs;
  } catch (error) {
    console.error(`Error getting all inputs for ${screenName}:`, error);
    return {};
  }
}

/**
 * Clear all inputs for a screen
 */
export async function clearInputs(screenName: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const screenKeys = keys.filter((key) =>
      key.startsWith(getStorageKey(screenName))
    );
    await AsyncStorage.multiRemove(screenKeys);
  } catch (error) {
    console.error(`Error clearing inputs for ${screenName}:`, error);
  }
}

/**
 * Clear a specific input field
 */
export async function clearInput(
  screenName: string,
  fieldName: string
): Promise<void> {
  try {
    const key = getStorageKey(screenName, fieldName);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing input ${screenName}.${fieldName}:`, error);
  }
}

/**
 * React hook for automatic input storage
 */
export function useInputStorage<T extends Record<string, string>>(
  screenName: string,
  initialValues: T
): [T, (fieldName: keyof T, value: string) => void, () => void] {
  const [values, setValues] = React.useState<T>(initialValues);
  const [loaded, setLoaded] = React.useState(false);

  // Load stored inputs on mount
  React.useEffect(() => {
    const loadStoredInputs = async () => {
      try {
        const stored = await getAllInputs(screenName);
        if (Object.keys(stored).length > 0) {
          setValues((prev) => ({ ...prev, ...stored } as T));
        }
        setLoaded(true);
      } catch (error) {
        console.error('Error loading stored inputs:', error);
        setLoaded(true);
      }
    };

    loadStoredInputs();
  }, [screenName]);

  // Update value and store it
  const updateValue = React.useCallback(
    async (fieldName: keyof T, value: string) => {
      setValues((prev) => ({ ...prev, [fieldName]: value } as T));
      await storeInput(screenName, fieldName as string, value);
    },
    [screenName]
  );

  // Clear all inputs
  const clearAll = React.useCallback(async () => {
    await clearInputs(screenName);
    setValues(initialValues);
  }, [screenName, initialValues]);

  return [values, updateValue, clearAll];
}

// Import React for the hook
import React from 'react';
