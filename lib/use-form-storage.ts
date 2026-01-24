/**
 * React Hook for Form Input Storage
 * Automatically saves and restores form inputs
 */

import { useState, useEffect, useCallback } from 'react';
import { storeInput, getAllInputs, clearInputs } from './input-storage';

/**
 * Hook to automatically store and restore form inputs
 * 
 * @param screenName - Unique identifier for the screen/form
 * @param initialValues - Initial form values
 * @returns [values, setValue, clearForm]
 * 
 * @example
 * const [formData, setFormData, clearForm] = useFormStorage('owner-register', {
 *   companyName: '',
 *   ownerName: '',
 *   email: '',
 * });
 * 
 * // Use in TextInput
 * <TextInput
 *   value={formData.companyName}
 *   onChangeText={(text) => setFormData('companyName', text)}
 * />
 */
export function useFormStorage<T extends Record<string, string>>(
  screenName: string,
  initialValues: T
): [
  T,
  (fieldName: keyof T, value: string) => void,
  () => Promise<void>
] {
  const [values, setValues] = useState<T>(initialValues);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stored inputs when component mounts
  useEffect(() => {
    const loadStoredInputs = async () => {
      try {
        const stored = await getAllInputs(screenName);
        if (Object.keys(stored).length > 0) {
          setValues((prev) => ({ ...prev, ...stored } as T));
        }
      } catch (error) {
        console.error(`Error loading stored inputs for ${screenName}:`, error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStoredInputs();
  }, [screenName]);

  // Update a single field value and store it
  const setValue = useCallback(
    async (fieldName: keyof T, value: string) => {
      setValues((prev) => {
        const updated = { ...prev, [fieldName]: value } as T;
        // Store asynchronously (don't await to keep UI responsive)
        storeInput(screenName, fieldName as string, value).catch((err) =>
          console.error(`Error storing ${fieldName}:`, err)
        );
        return updated;
      });
    },
    [screenName]
  );

  // Clear all form inputs
  const clearForm = useCallback(async () => {
    await clearInputs(screenName);
    setValues(initialValues);
  }, [screenName, initialValues]);

  return [values, setValue, clearForm];
}

/**
 * Hook for storing a single input value
 * Useful for simple forms with one or two fields
 */
export function useInputValue(
  screenName: string,
  fieldName: string,
  initialValue: string = ''
): [string, (value: string) => void, () => Promise<void>] {
  const [value, setValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stored value on mount
  useEffect(() => {
    const loadStored = async () => {
      try {
        const stored = await getAllInputs(screenName);
        if (stored[fieldName]) {
          setValue(stored[fieldName]);
        }
      } catch (error) {
        console.error(`Error loading stored value for ${screenName}.${fieldName}:`, error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStored();
  }, [screenName, fieldName]);

  // Update value and store it
  const updateValue = useCallback(
    async (newValue: string) => {
      setValue(newValue);
      await storeInput(screenName, fieldName, newValue);
    },
    [screenName, fieldName]
  );

  // Clear stored value
  const clearValue = useCallback(async () => {
    const { clearInput } = await import('./input-storage');
    await clearInput(screenName, fieldName);
    setValue(initialValue);
  }, [screenName, fieldName, initialValue]);

  return [value, updateValue, clearValue];
}
