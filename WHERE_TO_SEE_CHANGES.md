# Where to See the Changes - Complete Guide

## 📍 **1. In the App UI (Frontend)**

### Access the Features Screen:
1. **Open the app** and navigate to the **Features tab** (bottom navigation)
2. Or go directly to: `app/(tabs)/features.tsx` - This is the features hub screen

### Available Feature Screens:
All 6 features are accessible from the Features screen:

1. **Contractor Rating** → `app/(features)/contractors.tsx`
   - Route: `/(features)/contractors`
   - ✅ **UPDATED** - Now uses real API

2. **Face-Recall** → `app/(features)/face-recall.tsx`
   - Route: `/(features)/face-recall`
   - Ready for API integration

3. **Tool Library** → `app/(features)/tool-library.tsx`
   - Route: `/(features)/tool-library`
   - Ready for API integration

4. **OTP Permit-to-Work** → `app/(features)/permit-otp.tsx`
   - Route: `/(features)/permit-otp`
   - Ready for API integration

5. **Petty Cash Wallet** → `app/(features)/petty-cash.tsx`
   - Route: `/(features)/petty-cash`
   - ✅ **UPDATED** - Now uses real API with GPS

6. **Consumption Variance** → `app/(features)/consumption-variance.tsx`
   - Route: `/(features)/consumption-variance`
   - Ready for API integration

### How to Navigate:
```
App → Features Tab → Select any feature card
```

---

## 📁 **2. Code Files Location**

### **Backend API Routes** (Server-side):
```
server/
├── contractor-routes.ts          ← NEW: Contractor Rating API
├── face-recall-routes.ts         ← NEW: Face Recognition API
├── tool-routes.ts                ← NEW: Tool Library API
├── permit-routes.ts              ← NEW: OTP Permit API
├── petty-cash-routes.ts         ← NEW: Petty Cash API
├── consumption-variance-routes.ts ← NEW: Consumption Variance API
└── routes.ts                    ← UPDATED: All routes registered here
```

### **Database Schema**:
```
shared/
└── schema.ts                    ← UPDATED: Added 6 new tables
```

### **API Constants**:
```
constants/
└── api.ts                       ← UPDATED: Added all new endpoint constants
```

### **API Client**:
```
lib/
└── feature-api.ts               ← NEW: Complete API client for all features
```

### **Frontend Components**:
```
app/(features)/
├── contractors.tsx              ← UPDATED: Uses real API
├── face-recall.tsx               ← Ready for API
├── tool-library.tsx              ← Ready for API
├── permit-otp.tsx               ← Ready for API
├── petty-cash.tsx                ← UPDATED: Uses real API with GPS
└── consumption-variance.tsx      ← Ready for API
```

---

## 🧪 **3. Testing the APIs**

### **Start the Server**:
```bash
npm run server
# or
node server/index.js
```

### **Test Endpoints** (using curl, Postman, or browser):

#### **Contractor Rating**:
```bash
# Get all contractors
GET http://localhost:3001/api/contractors

# Create contractor
POST http://localhost:3001/api/contractors
Body: {
  "name": "ABC Construction",
  "siteId": 1
}
```

#### **Face Recall**:
```bash
# Get daily wagers
GET http://localhost:3001/api/daily-wagers

# Recognize face
POST http://localhost:3001/api/face-recall/recognize
Body: {
  "photoUri": "file://...",
  "gpsLat": "19.076",
  "gpsLon": "72.8777"
}
```

#### **Tool Library**:
```bash
# Get all tools
GET http://localhost:3001/api/tools?siteId=1

# Scan QR code
POST http://localhost:3001/api/tools/scan-qr
Body: {
  "qrCode": "TOOL-ABC123",
  "userId": 1,
  "action": "checkout"
}
```

#### **OTP Permit**:
```bash
# Request permit
POST http://localhost:3001/api/permits/request
Body: {
  "taskName": "Electrical Work",
  "workerId": 1,
  "siteId": 1
}

# Verify OTP
POST http://localhost:3001/api/permits/1/verify
Body: {
  "otp": "1234",
  "verifiedBy": 2
}
```

#### **Petty Cash**:
```bash
# Create expense
POST http://localhost:3001/api/petty-cash
Body: {
  "userId": 1,
  "amount": "500.00",
  "purpose": "Materials",
  "gpsLat": "19.076",
  "gpsLon": "72.8777",
  "address": "Site location"
}
```

#### **Consumption Variance**:
```bash
# Create variance
POST http://localhost:3001/api/consumption-variance
Body: {
  "siteId": 1,
  "materialName": "Cement",
  "theoreticalQty": "100",
  "actualQty": "110",
  "unit": "bags"
}
```

---

## 🗄️ **4. Database Changes**

### **New Tables Created**:
After running migration, you'll see these tables in your database:

1. `contractors` - Contractor rating data
2. `daily_wagers` - Daily wager profiles
3. `face_attendance` - Face recognition attendance
4. `tools` - Tool inventory with QR codes
5. `tool_requests` - Tool checkout/return records
6. `work_permits` - OTP permit-to-work records
7. `petty_cash` - Petty cash expenses with GPS
8. `consumption_variance` - Material consumption tracking

### **Run Migration**:
```bash
npx drizzle-kit push
```

---

## 📱 **5. In the Mobile App**

### **Step-by-Step to See Features**:

1. **Start the app**:
   ```bash
   npm start
   # or
   npx expo start
   ```

2. **Navigate to Features**:
   - Open app → Tap "Features" tab at bottom
   - Or go to: `app/(tabs)/features.tsx`

3. **Select a Feature**:
   - Tap any feature card (Contractors, Face-Recall, Tools, etc.)
   - Screen will open showing the feature

4. **Test the Updated Features**:
   - **Contractors**: Shows list from API (may be empty initially)
   - **Petty Cash**: Try adding an expense - it will request GPS permission

---

## 🔍 **6. What to Check**

### **In Code Editor**:

1. **Check API Routes**:
   - Open `server/routes.ts` - See all routes registered
   - Open any `server/*-routes.ts` file to see endpoint implementations

2. **Check API Client**:
   - Open `lib/feature-api.ts` - See all API functions

3. **Check Constants**:
   - Open `constants/api.ts` - See all endpoint URLs

4. **Check Components**:
   - Open `app/(features)/contractors.tsx` - See real API usage
   - Open `app/(features)/petty-cash.tsx` - See GPS integration

### **In Browser/Postman**:

1. **Test Backend**:
   - Start server: `npm run server`
   - Open: `http://localhost:3001/api/contractors`
   - Should return JSON (empty array if no data)

2. **Check Server Logs**:
   - Look for route registrations in console

---

## 📝 **7. Quick Reference**

| Feature | Frontend File | Backend Route | API Client |
|---------|--------------|---------------|-----------|
| Contractors | `app/(features)/contractors.tsx` | `/api/contractors` | `contractorApi` |
| Face-Recall | `app/(features)/face-recall.tsx` | `/api/daily-wagers` | `faceRecallApi` |
| Tool Library | `app/(features)/tool-library.tsx` | `/api/tools` | `toolApi` |
| OTP Permit | `app/(features)/permit-otp.tsx` | `/api/permits` | `permitApi` |
| Petty Cash | `app/(features)/petty-cash.tsx` | `/api/petty-cash` | `pettyCashApi` |
| Consumption | `app/(features)/consumption-variance.tsx` | `/api/consumption-variance` | `consumptionVarianceApi` |

---

## 🚀 **Next Steps to See Everything Working**:

1. **Run Database Migration**:
   ```bash
   npx drizzle-kit push
   ```

2. **Start Backend Server**:
   ```bash
   npm run server
   ```

3. **Start Frontend App**:
   ```bash
   npm start
   ```

4. **Navigate to Features**:
   - Open app → Features tab → Select any feature

5. **Test APIs**:
   - Use Postman or curl to test endpoints
   - Or use the app UI to interact with features

---

## 💡 **Tips**:

- **Empty Lists**: If you see empty lists, that's normal - create some test data via API
- **GPS Permission**: Petty Cash will ask for location permission on first use
- **API Errors**: Check server console for detailed error messages
- **Database**: Make sure DATABASE_URL is set in `.env` file

---

**All changes are ready to use!** 🎉
