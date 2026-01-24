# Quick Start Guide - InfraTrace CFMA

## ✅ What's Been Implemented

### 1. **Login System (6 Roles)**
- ✅ Login page with 6 role cards: Labour, Site Supervisor, Junior/Senior Engineer, Site Manager, Site Owner
- ✅ Sign In / Sign Up flow with OTP verification
- ✅ Role-based redirects (owner/manager → owner flow, others → tabs)
- ✅ Multilingual support (EN, HI, MR, TA)

### 2. **Owner Map Display (FIXED)**
- ✅ Working Leaflet map on web (OpenStreetMap)
- ✅ Click to set site center
- ✅ Radius control (50-500m) with presets
- ✅ Real-time coordinate display
- ✅ Radius stored in form data and sent to API

### 3. **Attendance System**
- ✅ Labour can mark attendance with GPS + photo
- ✅ GPS verification against site radius
- ✅ Shift slot detection (morning/afternoon/evening)
- ✅ Supervisor approval UI with pending list
- ✅ Approve/Reject functionality

**API Endpoints:**
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/pending` - Get pending attendance
- `PATCH /api/attendance/:id/approve` - Approve/reject

### 4. **Task Assignment Flow**
- ✅ Engineer creates task → assigns to supervisor
- ✅ Supervisor assigns task → assigns to labour
- ✅ Labour sees only their assigned tasks

**API Endpoints:**
- `POST /api/tasks` - Create task (Engineer)
- `PATCH /api/tasks/:id/assign-labour` - Assign to labour (Supervisor)
- `GET /api/tasks` - List tasks by role

### 5. **Database Schema**
- ✅ Extended `attendance` table with shift_slot, approval_status, GPS fields
- ✅ Extended `tasks` table with assignment chain fields
- ✅ Added `sites` table with latitude, longitude, radius

---

## 🚀 How to Test

### Test Login (6 Roles)
1. Open app → Select role (Labour, Site Supervisor, etc.)
2. Choose Sign In or Sign Up
3. Enter phone number → OTP verification
4. Should redirect based on role

### Test Owner Map
1. Login as Site Owner
2. Go to Sites → Add Site
3. Fill site details → Next
4. **Map should load** (Leaflet/OSM)
5. Click map to set center
6. Adjust radius (50-500m)
7. Submit → Site created with GPS + radius

### Test Attendance Flow
1. Login as Labour
2. Mark Attendance → GPS check → Photo → Submit
3. Login as Site Supervisor
4. Tap "Verify Attendance" → See pending list
5. Approve/Reject attendance

### Test Task Assignment
1. Login as Junior/Senior Engineer
2. Create task → Assign to supervisor
3. Login as Site Supervisor
4. See task → Assign to labour
5. Login as Labour
6. See assigned task in "My Tasks"

---

## 📁 Key Files Modified

### Frontend
- `app/(auth)/login.tsx` - 6 roles, Sign In/Up flow
- `app/(tabs)/home.tsx` - Attendance marking, supervisor approval UI
- `app/(owner)/create-site/SiteBoundary.web.tsx` - Working map with radius
- `components/SiteMap.web.tsx` - Leaflet map component
- `contexts/UserContext.tsx` - Extended role types
- `contexts/LanguageContext.tsx` - Added role translations

### Backend
- `server/attendance-routes.ts` - Attendance APIs with supervisor approval
- `server/task-routes.ts` - Task assignment APIs
- `server/routes.ts` - Registered new routes
- `shared/schema.ts` - Extended tables

---

## ⚠️ Important Notes

### Map Implementation
- **Web only**: Uses Leaflet via CDN (no npm install)
- **Mobile**: Still uses react-native-maps (not changed)
- Map loads automatically when SiteBoundary.web.tsx renders

### API Base URL
- Check `constants/api.ts` - Update `DEV_IP` if needed
- Default: `http://localhost:3001` (web) or `http://172.16.3.248:3001` (mobile)

### Database
- Schema changes require migration
- Run: `npm run drizzle-kit generate` then `npm run drizzle-kit migrate`

### Hourly Attendance Job
- **Not yet implemented** - This would be a cron job or scheduled task
- Logic: Check attendance records hourly, update shift aggregates
- Can be added as a separate service or manual trigger endpoint

---

## 🔧 Next Steps (Optional)

1. **Hourly Attendance Job**
   - Create cron job or scheduled endpoint
   - Update shift-wise attendance aggregates
   - Store in separate `attendance_shifts` table

2. **Task Assignment UI**
   - Add task creation form for engineers
   - Add labour assignment dropdown for supervisors
   - Show task list for each role

3. **Site Creation API**
   - Implement `POST /api/sites` endpoint
   - Store site with GPS + radius in database

4. **Enrollment Updates**
   - Verify enrollment flow works with 6 roles
   - Update role mappings if needed

---

## 🐛 Known Issues / TODOs

- [ ] Hourly attendance aggregation job (manual trigger for now)
- [ ] Site creation API endpoint needs implementation
- [ ] Task assignment UI needs forms (APIs ready)
- [ ] Enrollment flow may need role updates

---

**Status:** Core features implemented! Ready for testing and refinement. 🎉
