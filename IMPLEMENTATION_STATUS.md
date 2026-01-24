# Implementation Status - InfraTrace CFMA

**Last Updated:** Implementation in progress for 2hr hackathon

---

## ✅ Completed

### 1. Planning & Documentation
- [x] **IMPLEMENTATION_PLAN.md** - Full-scale 2hr hackathon plan with timeboxes
- [x] **PERPLEXITY_DATASETS_PROMPTS.md** - 8 prompts for site field calculation datasets
- [x] **IMPLEMENTATION_STATUS.md** (this file) - Progress tracking

### 2. Login & Authentication
- [x] Updated `Role` type to support 6 roles:
  - `labour` | `site_supervisor` | `junior_engineer` | `senior_engineer` | `site_manager` | `site_owner`
- [x] Updated `app/(auth)/login.tsx`:
  - 6 role cards with proper labels and descriptions
  - Sign In / Sign Up flow
  - OTP verification
  - Role-based redirects (site_owner/site_manager → owner flow, others → tabs)
- [x] Updated `contexts/UserContext.tsx` - Role type extended
- [x] Updated `contexts/LanguageContext.tsx` - Added translations for all 6 roles (EN, HI, MR, TA)

### 3. Owner Map Display (Web)
- [x] **NEW:** `components/SiteMap.web.tsx` - Working Leaflet map with:
  - OpenStreetMap tiles
  - Click to set center
  - Draggable marker
  - Radius circle visualization
  - Real-time coordinate display
- [x] **UPDATED:** `app/(owner)/create-site/SiteBoundary.web.tsx`:
  - Integrated working SiteMap component
  - Radius control (50-500m) with +/- buttons and presets
  - Coordinate display
  - Submit button with radius stored

---

## 🚧 In Progress / Next Steps

### 4. Database Schema Extensions
**File:** `shared/schema.ts` or new migration

**Required additions:**
- [ ] `attendance` table:
  - `shift_slot` (text: 'morning'|'afternoon'|'evening')
  - `approval_status` (text: 'pending'|'approved'|'rejected')
  - `approved_by` (integer: supervisor user_id)
  - `approved_at` (timestamp)
  - `photo_uri` (text)
  - `gps_lat` (decimal)
  - `gps_lon` (decimal)
  - `site_id` (integer/uuid)

- [ ] `tasks` table:
  - `site_id` (integer/uuid)
  - `assigned_to_supervisor_id` (integer: user_id)
  - `assigned_to_labour_id` (integer: user_id, nullable)
  - `created_by_engineer_id` (integer: user_id)

- [ ] `sites` table (if not exists):
  - `latitude` (decimal)
  - `longitude` (decimal)
  - `radius` (integer, meters)

- [ ] `users` table:
  - `role` enum updated to 6 values

### 5. API Endpoints
**Files:** `server/routes.ts`, new `server/attendance-routes.ts`, `server/task-routes.ts`

**Required:**
- [ ] `POST /api/attendance` - Labour mark attendance (GPS, photo, site_id, worker_id)
- [ ] `GET /api/attendance/pending` - Supervisor: pending attendance for site
- [ ] `PATCH /api/attendance/:id/approve` - Supervisor approve/reject
- [ ] `POST /api/tasks` - Engineer create task, assign to supervisor
- [ ] `PATCH /api/tasks/:id/assign-labour` - Supervisor assign task to labour
- [ ] `GET /api/tasks` - List by role (engineer/supervisor/labour)
- [ ] `POST /api/sites` - Create site (incl. lat, lon, radius)
- [ ] Hourly cron job (or manual trigger) for shift-wise attendance aggregation

### 6. Frontend Updates

#### Attendance Flow
- [ ] `app/(tabs)/home.tsx`:
  - Labour: "Mark Attendance" button (already exists, verify GPS+photo)
  - Supervisor: "Pending Attendance" section with Approve/Reject buttons
  - Store `shift_slot` based on time window

#### Task Assignment Flow
- [ ] New `app/(tabs)/tasks.tsx` or integrate in home:
  - Engineer: "Create Task" → assign to supervisor dropdown
  - Supervisor: "My Tasks" → assign to labour dropdown
  - Labour: "My Assigned Tasks" (read-only list)

#### Enrollment
- [ ] `app/(auth)/enroll.tsx` - Verify roles align with 6-type system

---

## 📋 Testing Checklist

- [ ] Login with all 6 roles → correct redirects
- [ ] Owner: Register site → map works (tap center, set radius 50-500m) → site created
- [ ] Labour: Mark attendance → GPS check → photo → submit → stored with shift_slot
- [ ] Supervisor: View pending attendance → Approve/Reject → status updated
- [ ] Engineer: Create task → assign to supervisor → task appears in supervisor's list
- [ ] Supervisor: Assign task to labour → task appears in labour's list
- [ ] Hourly job: Updates shift-wise attendance aggregates

---

## 🔧 Technical Notes

### Map Implementation
- Uses Leaflet via CDN (no npm install needed)
- Works on web only (mobile uses react-native-maps)
- Radius circle updates in real-time
- Coordinates displayed in overlay

### Role Mapping
- Backend may still use simplified roles (labour, supervisor, engineer, manager, owner)
- Frontend uses 6 distinct roles for clarity
- API mapping layer can translate if needed

### Attendance Shift Logic
- Morning: 8:00-12:00
- Afternoon: 12:00-16:00
- Evening: 16:00-20:00
- Hourly job checks: if attendance marked in that window → count present for that shift

---

## ⏱️ Remaining Time Estimate

Based on 2hr hackathon:
- ✅ Login (6 roles): ~25 min - **DONE**
- ✅ Owner map: ~25 min - **DONE**
- ⏳ Attendance + Supervisor approval: ~25 min - **IN PROGRESS**
- ⏳ Hourly job: ~20 min - **PENDING**
- ⏳ Tasks (Engineer → Supervisor → Labour): ~20 min - **PENDING**
- ⏳ Testing: ~5 min - **PENDING**

**Total Remaining:** ~70 minutes

---

*Continue with schema updates and API implementations next.*
