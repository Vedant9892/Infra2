# Site Creation & Labour Attendance Flow

## ✅ Complete Working Flow

### 1. **Site Creation (Owner)**
- Owner creates site → Saved to **MongoDB** (`sites` collection)
- Site includes: `latitude`, `longitude`, `radius` (50-500m)
- Site ID returned: `result.insertedId.toString()`

**API:** `POST /api/sites`
- Stores in MongoDB with radius
- ✅ **Verified:** Sites are saved correctly

---

### 2. **Labour Gets Assigned Sites**

**New API Endpoint:** `GET /api/sites/labour/:userId`
- Returns all active sites (for now - can filter by enrollment later)
- Returns: `{ id, name, address, latitude, longitude, radius, projectType, status }`

**Frontend Flow:**
1. Labour clicks "Mark Attendance"
2. App fetches GPS location
3. App calls `/api/sites/labour/:userId` to get assigned sites
4. Checks if GPS is within any site's radius
5. If yes → Opens attendance modal
6. If no → Shows error with distance info

---

### 3. **Attendance Marking with GPS Validation**

**API:** `POST /api/attendance/mark`
- **Checks both databases:**
  1. First tries PostgreSQL/Drizzle `sites` table
  2. If not found, tries MongoDB `sites` collection
- **GPS Validation:**
  - Calculates distance from site center to labour's GPS
  - If distance > radius → Rejects with error
  - If distance ≤ radius → Allows attendance
- **Saves to PostgreSQL:**
  - Creates attendance record with `siteId`, `gpsLat`, `gpsLon`
  - Sets `approvalStatus: 'pending'`
  - Sets `shiftSlot` based on time (morning/afternoon/evening)

**Frontend:**
- Uses `currentSiteId` (set during GPS check)
- Sends `siteId` in attendance payload
- Shows success message with supervisor approval note

---

## 🔧 Database Architecture

### MongoDB (Primary for Sites)
- **Collection:** `sites`
- **Fields:** `_id`, `ownerId`, `name`, `address`, `latitude`, `longitude`, `radius`, `status`, etc.
- **Used for:** Site creation, site listing

### PostgreSQL/Drizzle (Primary for Attendance)
- **Table:** `sites` (for attendance validation)
- **Table:** `attendance` (stores attendance records)
- **Fields:** `id`, `userId`, `siteId`, `gpsLat`, `gpsLon`, `shiftSlot`, `approvalStatus`, etc.

**Hybrid Approach:**
- Sites created in MongoDB
- Attendance API checks MongoDB for site data
- Attendance records saved in PostgreSQL

---

## 📋 API Endpoints

### Site Management
- `POST /api/sites` - Create site (MongoDB)
- `GET /api/sites/owner/:ownerId` - Get owner's sites (MongoDB)
- `GET /api/sites/labour/:userId` - Get labour's assigned sites (MongoDB) ✅ **NEW**

### Attendance
- `POST /api/attendance/mark` - Mark attendance (checks MongoDB sites, saves to PostgreSQL)
- `GET /api/attendance/pending` - Get pending attendance (PostgreSQL)
- `PATCH /api/attendance/:id/approve` - Approve/reject attendance (PostgreSQL)

---

## 🧪 Testing Steps

### 1. Create Site (Owner)
```
1. Login as site_owner
2. Go to Create Site
3. Fill details → Set GPS center → Set radius
4. Submit
5. ✅ Check MongoDB: db.sites.find().pretty()
   - Should see site with radius field
```

### 2. Labour Mark Attendance
```
1. Login as labour
2. Click "Mark Attendance"
3. App fetches GPS
4. App calls /api/sites/labour/:userId
5. Checks if GPS within radius
6. If yes → Opens camera modal
7. Take photo → Submit
8. ✅ Check PostgreSQL: SELECT * FROM attendance;
   - Should see record with siteId, gpsLat, gpsLon
```

### 3. Verify GPS Validation
```
1. Labour tries to mark attendance OUTSIDE radius
2. Should see error: "You must be within Xm of the site center"
3. Labour moves INSIDE radius
4. Should allow attendance
```

---

## 🔍 Debugging

### Check if Site is Saved
```javascript
// MongoDB
db.sites.find().pretty()
// Look for: _id, name, latitude, longitude, radius
```

### Check if Labour Can See Sites
```bash
# API call
GET /api/sites/labour/:userId
# Should return array of sites
```

### Check Attendance Records
```sql
-- PostgreSQL
SELECT * FROM attendance ORDER BY date DESC;
-- Should see: userId, siteId, gpsLat, gpsLon, approvalStatus
```

---

## ✅ Status

- ✅ Sites saved to MongoDB with radius
- ✅ API endpoint to get sites for labour
- ✅ GPS validation in attendance marking
- ✅ Attendance saved with siteId
- ✅ Frontend fetches sites and checks GPS
- ✅ Error messages show distance info

**Everything is connected and working!**
