# InfraTrace – CFMA Implementation Plan (2hr Speed Hackathon)

**Project:** Construction Field Management Application (PS02 – CFMA)  
**Scope:** Login (6 roles), Owner map/GPS, Attendance (hourly SQL + supervisor approval), Tasks (Engineer → Supervisor → Labour), essential datasets.

---

## 1. Roles & Auth

| Role | Sign Up | Dashboard | Key Actions |
|------|---------|-----------|-------------|
| **Labour** | Yes | Tabs (Home, Projects, Stats, Profile) | Mark attendance (GPS+photo), view assigned tasks |
| **Site Supervisor** | Yes | Tabs | Verify/approve attendance, assign tasks to labour |
| **Junior Site Engineer** | Yes | Tabs | Assign tasks to supervisor, material requests |
| **Senior Site Engineer** | Yes | Tabs | Same + onsite verification, approvals |
| **Site Manager** | Yes | Owner-like | Sites, workers, enrollments, approvals |
| **Site Owner** | Yes | Owner flow | Register → Sites → Add Site → GPS map, dashboard |

**Auth flow:** Landing → **Select Role** (6) → **Sign In / Sign Up** → Phone + OTP → Role-specific redirect.

---

## 2. Owner Flow (Phase 1)

1. **Login** as Owner → **Setup Profile** (first-time): company name, owner name, email, GST, PAN, address (street, city, state, pincode).
2. **Sites Listing** → "Add Site" → **Site Registration Step 1:**  
   Site name, location name, address, pincode, project type (Residential/Commercial/Industrial/Infrastructure), budget.
3. **Site Registration Step 2 – GPS:**  
   **Interactive map** (web: Leaflet/OSM; native: react-native-maps) → **Tap to set site center** → **Adjust radius (50–500 m)** → Confirm → Register site → back to Sites Listing.

**Map fix (web):** Replace `SiteMap.web` / `SiteBoundary.web` placeholders with Leaflet + OpenStreetMap. Tap = set center; radius slider 50–500 m; persist `latitude`, `longitude`, `radius`.

---

## 3. Worker Onboarding (Phase 2)

- **Owner** opens Site → Site Dashboard → **Add Workers**.
- **Worker details:** Name, phone, **Role** (Labour / Engineer / Supervisor / Manager), **Assign to THIS site** (`site_id`), daily wage/salary, ID proof upload.
- Worker receives credentials (SMS/WhatsApp); first login → "You are assigned to: [Site Name]".

**Enrollment:** Keep existing 6-digit code flow; extend roles to include Junior/Senior Engineer, Site Manager where relevant.

---

## 4. Attendance (Phase 3)

- **Labour:** "Mark Attendance" → GPS check (within site radius) → live photo (front camera) → submit.  
  Payload: `photo_uri`, `gps_lat`, `gps_lon`, `timestamp`, `site_id`, `worker_id`.
- **SQL updates:**  
  Attendance records **statically updated every hour** (cron/job) based on **shift windows** (e.g. 8–12, 12–16, 16–20). Logic: if worker marked present in that hour+site → count present for that shift slot; else absent for that slot. Store per `(worker_id, site_id, date, shift_slot)`.
- **Approval:** **On-site supervisor** approves/rejects pending attendance. Only approved records contribute to payroll/dashboard.

**DB:** `attendance` – add `shift_slot` (e.g. `morning`/`afternoon`/`evening`), `approved_by` (supervisor id), `approval_status` (`pending`|`approved`|`rejected`), `approved_at`. Hourly job updates aggregated shift attendance.

---

## 5. Task Assignment (Phase 4)

- **Engineer** (Junior/Senior): Creates tasks → **assigns to Site Supervisor** (not directly to labour).
- **Site Supervisor:** Receives tasks from engineer → **assigns to specific Labour**.
- **Labour:** Sees "My Assigned Tasks" only.

**DB:** `tasks` – add `assigned_to_supervisor_id`, `assigned_to_labour_id`, `created_by_engineer_id`, `site_id`. APIs:  
- Engineer: `POST /api/tasks` (assign to supervisor), `GET /api/tasks?site=…`  
- Supervisor: `PATCH /api/tasks/:id/assign-labour`, `GET /api/tasks?assigned_to_me=supervisor`  
- Labour: `GET /api/tasks?assigned_to_me=labour`

---

## 6. Essential Datasets (for Perplexity / External)

See **PERPLEXITY_DATASETS_PROMPTS.md** for copy-paste prompts. Use these to derive:

- **Site field calculation** (e.g. cost per flat casting, per unit area, material norms).
- **Indian construction:** labour rates, material rates, typical shift patterns, GST rules.

---

## 7. Database Schema Additions

- **users / workers:** `role` enum – `labour` | `site_supervisor` | `junior_engineer` | `senior_engineer` | `site_manager` | `site_owner`.
- **attendance:** `shift_slot`, `approval_status`, `approved_by`, `approved_at`, `photo_uri`, `gps_lat`, `gps_lon`, `site_id`.
- **tasks:** `site_id`, `assigned_to_supervisor_id`, `assigned_to_labour_id`, `created_by_engineer_id`.
- **sites:** `latitude`, `longitude`, `radius` (already in enrollment-schema).

---

## 8. API Additions / Changes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Register (phone, role, …) – support 6 roles |
| POST | `/api/auth/signin` | Sign in (phone, role, OTP) |
| GET | `/api/sites/owner/:ownerId` | Owner’s sites (existing) |
| POST | `/api/sites` | Create site (incl. lat, lon, radius) |
| POST | `/api/attendance` | Labour mark attendance (GPS, photo, site_id, worker_id) |
| GET | `/api/attendance/pending` | Supervisor: pending attendance for site |
| PATCH | `/api/attendance/:id/approve` | Supervisor approve/reject |
| *Cron* | Hourly | Update shift-wise attendance aggregates |
| POST | `/api/tasks` | Engineer create task, assign to supervisor |
| PATCH | `/api/tasks/:id/assign-labour` | Supervisor assign task to labour |
| GET | `/api/tasks` | List by role (engineer/supervisor/labour) |

---

## 9. 2hr Hackathon Timebox

| Block | Duration | Focus |
|-------|----------|--------|
| **0:00–0:25** | 25 min | Login: 6 roles, Sign In/Up, OTP, redirect by role. UserContext + LanguageContext compatible. |
| **0:25–0:50** | 25 min | Owner map: Leaflet in `SiteBoundary.web` + `SiteMap.web`. Tap center, radius 50–500 m, wire to create-site. |
| **0:50–1:15** | 25 min | Attendance: mark endpoint, DB fields (shift, approval). Supervisor approve API + minimal UI. |
| **1:15–1:35** | 20 min | Hourly attendance job: stub cron logic (or manual trigger) that updates shift-wise attendance. |
| **1:35–1:55** | 20 min | Tasks: Engineer → Supervisor → Labour. APIs + assign forms. |
| **1:55–2:00** | 5 min | Smoke test: Owner map, Labour attendance, Supervisor approve, Engineer assign → Supervisor → Labour. |

---

## 10. UI Notes

- **Login:** Clear role cards (Labour, Site Supervisor, Junior/Senior Engineer, Site Manager, Site Owner), then Sign In vs Sign Up, then phone + OTP. Use existing DESIGN tokens.
- **Owner:** Map must be usable on **web** (primary fix). Mobile can keep react-native-maps.
- **Attendance:** Labour – big "Mark Attendance"; Supervisor – "Pending" list + Approve/Reject.
- **Tasks:** Engineer: "Assign to Supervisor"; Supervisor: "Assign to Labour"; Labour: "My Tasks" list.

---

## 11. Files to Touch

| Area | Files |
|------|--------|
| Login | `app/(auth)/login.tsx`, `contexts/UserContext.tsx` |
| Map | `components/SiteMap.web.tsx`, `app/(owner)/create-site/SiteBoundary.web.tsx`, `add-site` if used |
| Create site | `app/(owner)/create-site/index.tsx`, `SiteForm.tsx` |
| Schema | `shared/schema.ts`, `shared/enrollment-schema.ts` (or dedicated migrations) |
| APIs | `server/routes.ts`, `server/enrollment-routes.ts`, new `attendance-routes`, `task-routes` |
| Attendance | `app/(tabs)/home.tsx` (mark + supervisor approve UI), `server/storage.ts` |
| Tasks | New `app/(tabs)/tasks.tsx` or integrate in home; task APIs |
| Enroll | `app/(auth)/enroll.tsx` – roles align with 6-type system |

---

## 12. Success Criteria

- [ ] User can sign up / sign in as any of the 6 roles.
- [ ] Owner can register a site with **working web map** (tap center, set radius 50–500 m).
- [ ] Labour can mark attendance (GPS + photo); records stored with `site_id`, `worker_id`, `shift_slot`.
- [ ] Supervisor can approve/reject attendance.
- [ ] Hourly (or manual) job updates shift-wise attendance in SQL.
- [ ] Engineer assigns tasks to supervisor; supervisor assigns to labour; labour sees only their tasks.
- [ ] Clean, robust UI; no crashes on role switch or map interaction.

---

*Last updated: Implementation plan for 2hr speed hackathon. Adjust timeboxes as needed.*
