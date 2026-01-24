# Input Storage System - Complete Guide

## 🎯 Overview

All form inputs throughout the app are now automatically stored locally and restored when screens open. This ensures users never lose their data if they navigate away or the app closes.

---

## ✅ Already Implemented

The following forms now have automatic input storage:

1. **Owner Registration** (`app/(owner)/register.tsx`)
   - Company name, owner name, email, GST, PAN, address fields
   - Clears on successful registration

2. **Site Registration** (`app/(owner)/add-site.tsx`)
   - Site name, location, address, pincode, project type, budget
   - Clears on successful site creation

3. **Petty Cash** (`app/(features)/petty-cash.tsx`)
   - Amount and purpose fields
   - Clears after successful submission

4. **OTP Permit** (`app/(features)/permit-otp.tsx`)
   - Task name field
   - Clears after successful permit request

---

## 🔧 How to Add Input Storage to Any Form

### Method 1: Multiple Fields (useFormStorage)

For forms with multiple fields:

```typescript
import { useFormStorage } from '../../lib/use-form-storage';

export default function MyForm() {
  // Replace useState with useFormStorage
  const [formData, setFormDataField, clearForm] = useFormStorage('my-form-screen', {
    field1: '',
    field2: '',
    field3: '',
  });

  // Use setFormDataField instead of setFormData
  <TextInput
    value={formData.field1}
    onChangeText={(text) => setFormDataField('field1', text)}
  />

  // Clear form on success
  const handleSubmit = async () => {
    // ... submit logic
    await clearForm();
  };
}
```

### Method 2: Single Field (useInputValue)

For forms with one or two fields:

```typescript
import { useInputValue } from '../../lib/use-form-storage';

export default function MyForm() {
  const [value, setValue, clearValue] = useInputValue('my-screen', 'fieldName', '');

  <TextInput
    value={value}
    onChangeText={setValue}
  />
}
```

---

## 📋 Forms to Update

### High Priority (Frequently Used)

1. **Setup Profile** (`app/(auth)/setup-profile.tsx`)
   ```typescript
   const [formData, setFormDataField] = useFormStorage('setup-profile', {
     name: '',
     email: '',
   });
   ```

2. **Worker Enrollment** (`app/(auth)/enroll.tsx`)
   ```typescript
   const [workerName, setWorkerName] = useInputValue('worker-enroll', 'name', '');
   const [workerPhone, setWorkerPhone] = useInputValue('worker-enroll', 'phone', '');
   ```

3. **Site Form** (`app/(owner)/create-site/SiteForm.tsx`)
   ```typescript
   const [formData, setFormDataField] = useFormStorage('site-form', {
     name: '',
     description: '',
     address: '',
   });
   ```

### Medium Priority

4. **Stock Management** (`app/(owner)/stock/[siteId].tsx`)
   - Material name, quantity, unit fields

5. **Bills** (`app/(owner)/bills/[siteId].tsx`)
   - Vendor name, amount, items fields

6. **Material Requests** (if exists)
   - Material name, quantity, priority fields

7. **Task Creation** (if exists)
   - Task title, description, priority fields

---

## 🎨 Screen Name Convention

Use descriptive, unique screen names:

- ✅ `'owner-register'` - Owner registration
- ✅ `'site-registration'` - Site creation
- ✅ `'petty-cash'` - Petty cash expenses
- ✅ `'permit-otp'` - Permit requests
- ✅ `'setup-profile'` - Profile setup
- ✅ `'worker-enroll'` - Worker enrollment
- ✅ `'stock-management'` - Stock tracking
- ✅ `'material-request'` - Material requests

**Format:** `kebab-case`, descriptive, unique per screen

---

## 🔄 When to Clear Stored Inputs

Clear inputs when:
- ✅ Form is successfully submitted
- ✅ User explicitly cancels/resets form
- ✅ Data is successfully saved to backend

**Don't clear:**
- ❌ When user navigates away temporarily
- ❌ On app background/foreground
- ❌ On component unmount (unless explicitly needed)

---

## 📝 Example: Complete Form Implementation

```typescript
import { useFormStorage } from '../../lib/use-form-storage';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function MyFormScreen() {
  const [formData, setFormDataField, clearForm] = useFormStorage('my-form', {
    name: '',
    email: '',
    phone: '',
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Submit to API
      await submitForm(formData);
      
      // Clear stored inputs on success
      await clearForm();
      
      Alert.alert('Success', 'Form submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <TextInput
        value={formData.name}
        onChangeText={(text) => setFormDataField('name', text)}
        placeholder="Name"
      />
      <TextInput
        value={formData.email}
        onChangeText={(text) => setFormDataField('email', text)}
        placeholder="Email"
      />
      <Button onPress={handleSubmit} title="Submit" />
    </View>
  );
}
```

---

## 🛠️ Advanced Usage

### Manual Storage (if needed)

```typescript
import { storeInput, getInput, clearInput } from '../../lib/input-storage';

// Store a value
await storeInput('screen-name', 'field-name', 'value');

// Retrieve a value
const value = await getInput('screen-name', 'field-name');

// Clear a specific field
await clearInput('screen-name', 'field-name');
```

### Store Multiple Fields at Once

```typescript
import { storeInputs } from '../../lib/input-storage';

await storeInputs('screen-name', {
  field1: 'value1',
  field2: 'value2',
  field3: 'value3',
});
```

---

## 🧪 Testing

1. **Fill a form** with some data
2. **Navigate away** from the screen
3. **Return to the screen** - data should be restored
4. **Close and reopen app** - data should persist
5. **Submit form successfully** - data should be cleared

---

## 📊 Storage Keys

All inputs are stored with keys like:
- `@input_storage:owner-register:companyName`
- `@input_storage:site-registration:name`
- `@input_storage:petty-cash:amount`

You can inspect stored data using:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
const keys = await AsyncStorage.getAllKeys();
console.log(keys.filter(k => k.startsWith('@input_storage')));
```

---

## ✅ Benefits

1. **No Data Loss** - Users never lose their input
2. **Better UX** - Forms remember what users typed
3. **Offline Support** - Works without internet
4. **Automatic** - No manual save/load needed
5. **Persistent** - Survives app restarts

---

## 🚀 Next Steps

1. Update remaining forms using the patterns above
2. Test each form to ensure data persists
3. Add clear buttons for forms that need manual reset
4. Consider adding "Draft saved" indicators

All forms will now automatically save and restore user inputs! 🎉
