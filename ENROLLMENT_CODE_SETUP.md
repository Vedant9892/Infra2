# Enrollment Code Setup - Complete Guide

## ✅ What's Been Implemented

### 1. **Auto-Generated Enrollment Codes**
- When a site is created, a **6-digit enrollment code** is automatically generated
- Code is stored in MongoDB with the site document
- Code is returned in the site creation response

### 2. **Site Owner Account Creation**
- Script to create owner account for "Vasantdada Patil College"
- Phone: `111111`
- Role: `site_owner`

---

## 🚀 Quick Start

### Step 1: Create Site Owner Account

**Option A: Using the Script**
```bash
cd Infra2
node scripts/create-owner-account.js
```

**Option B: Using API Endpoint**
```bash
curl -X POST http://localhost:4000/api/admin/create-owner \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "111111",
    "name": "Vasantdada Patil College",
    "role": "site_owner"
  }'
```

**Option C: Manual Registration**
1. Open the app
2. Select "Site Owner" role
3. Enter phone: `111111`
4. Complete OTP verification
5. Account created!

---

### Step 2: Create a Site

1. Login as site owner (phone: `111111`)
2. Go to "Create Site"
3. Fill in site details:
   - Name: "Vasantdada Patil College"
   - Address: (your address)
   - Set GPS center on map
   - Set radius (50-500m)
4. Click "Create Site"
5. **✅ Enrollment code is automatically generated!**

**Response includes:**
```json
{
  "success": true,
  "site": {
    "id": "...",
    "name": "Vasantdada Patil College",
    "enrollmentCode": "123456"  // ← Auto-generated code
  },
  "enrollmentCode": "123456",  // ← Also returned separately
  "message": "Site created successfully! Enrollment Code: 123456 - Share this with labour to enroll them."
}
```

---

### Step 3: Share Enrollment Code with Labour

**The enrollment code is displayed:**
- In the site creation success message
- In the site details (when viewing site)
- In the owner's site list

**Share the code with labour via:**
- WhatsApp
- SMS
- In-person
- Display on site board

---

### Step 4: Labour Enrolls Using Code

1. Labour opens the app
2. Selects "Labour" role
3. Logs in with phone number
4. Enters the **6-digit enrollment code** (e.g., `123456`)
5. ✅ Enrolled in the site!

---

## 📋 API Endpoints

### Create Owner Account
```
POST /api/admin/create-owner
Body: {
  "phoneNumber": "111111",
  "name": "Vasantdada Patil College",
  "role": "site_owner"
}
```

### Create Site (Auto-generates code)
```
POST /api/sites
Body: {
  "ownerId": "...",
  "name": "Vasantdada Patil College",
  "address": "...",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "radius": 100
}

Response: {
  "success": true,
  "site": { ... },
  "enrollmentCode": "123456"  // ← Auto-generated
}
```

### Get Site Details (Includes code)
```
GET /api/sites/:siteId

Response: {
  "success": true,
  "site": {
    "id": "...",
    "name": "...",
    "enrollmentCode": "123456",  // ← Enrollment code
    "codeUsageCount": 0,
    "codeGeneratedAt": "..."
  }
}
```

### Get Owner's Sites (Includes codes)
```
GET /api/sites/owner/:ownerId

Response: {
  "success": true,
  "sites": [
    {
      "id": "...",
      "name": "...",
      "enrollmentCode": "123456"  // ← Enrollment code
    }
  ]
}
```

---

## 🔍 Database Schema

### MongoDB Sites Collection
```javascript
{
  _id: ObjectId("..."),
  ownerId: ObjectId("..."),
  name: "Vasantdada Patil College",
  address: "...",
  latitude: 19.0760,
  longitude: 72.8777,
  radius: 100,
  // Enrollment Code Fields
  enrollmentCode: "123456",        // 6-digit code
  codeGeneratedAt: ISODate("..."),
  codeExpiresAt: null,             // null = no expiry
  codeUsageCount: 0,                // How many times used
  maxEnrollments: null,             // null = unlimited
  // ... other fields
}
```

---

## 🧪 Testing

### Test 1: Create Owner Account
```bash
node scripts/create-owner-account.js
```
Expected: ✅ Account created with phone `111111`

### Test 2: Create Site
1. Login as owner (phone: `111111`)
2. Create site "Vasantdada Patil College"
3. Check response for `enrollmentCode`

Expected: ✅ Code generated (6 digits)

### Test 3: Verify Code in Database
```javascript
// MongoDB
db.sites.find({ name: "Vasantdada Patil College" }).pretty()
// Should see: enrollmentCode field
```

### Test 4: Labour Enrollment
1. Login as labour
2. Enter enrollment code from site
3. Should enroll successfully

---

## 📱 Frontend Integration

### Display Enrollment Code in UI

**In Site Details Screen:**
```tsx
<Text>Enrollment Code: {site.enrollmentCode}</Text>
<Button onPress={() => shareCode(site.enrollmentCode)}>
  Share Code
</Button>
```

**In Site Creation Success:**
```tsx
Alert.alert(
  'Site Created!',
  `Enrollment Code: ${enrollmentCode}\n\nShare this code with labour to enroll them.`,
  [{ text: 'OK' }]
);
```

---

## ✅ Status

- ✅ Auto-generate enrollment code on site creation
- ✅ Store code in MongoDB
- ✅ Return code in API responses
- ✅ Script to create owner account
- ✅ API endpoint to create owner account
- ✅ Code included in site details

**Everything is ready! Just create a site and the code will be generated automatically!**
