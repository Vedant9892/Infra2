# Labour Layoff 2 – Changelog & Handoff

Documentation for **Labour Layoff 2** zip. Refactor: **Home = Join only**, **Projects = List**, **Project Dashboard = Work**, **Tools Diary = Production-ready**.

---

## 1. Summary of Changes

| Area | Before | After |
|------|--------|-------|
| **Home** | Join **or** Quick Actions (Attendance, Tasks, Docs) when connected | **Only** Join: Scan QR + Enter Code. Hint when connected |
| **Projects** | "Current Projects", "Open / Manage Site" | "Active Projects", "Past Projects", **"Open Project"** |
| **Project Dashboard** | Stats, Tasks, Attendance, Chat inline | **4 cards**: Mark Attendance, My Tasks, Site Docs, **Tools Diary** |
| **Tools** | Separate bottom tab, mock data | **Removed** tab. Tools Diary **inside** Project → full API |

---

## 2. Files in This Zip

```
labour-layoff-2/
├── app/
│   └── (labour)/
│       ├── _layout.tsx              # Stack: tabs, scan-qr, manage-site, attendance, tasks, documentation, tools-diary
│       ├── (tabs)/
│       │   ├── _layout.tsx          # Home, Projects, Profile (no Tools tab)
│       │   ├── home.tsx             # Join-only UI
│       │   └── projects.tsx         # Active / Past, Open Project
│       ├── manage-site/
│       │   └── [siteId].tsx         # Project Dashboard: 4 cards
│       └── tools-diary/
│           └── [siteId].tsx         # Tools Diary screen (new)
├── constants/
│   └── api.ts                       # + LABOUR_ENDPOINTS.TOOLS
└── server/
    └── index.js                     # Tools APIs + seed
```

---

## 3. What Each File Does

### 3.1 `app/(labour)/_layout.tsx`

- Labour stack: `(tabs)`, `scan-qr`, `manage-site/[siteId]`, `attendance/[siteId]`, `tasks/[siteId]`, `documentation/[siteId]`, **`tools-diary/[siteId]`**.

### 3.2 `app/(labour)/(tabs)/_layout.tsx`

- Bottom tabs: **Home**, **Projects**, **Profile** only. **Tools tab removed.**
- Uses `LabourFloatingTabBar`.

### 3.3 `app/(labour)/(tabs)/home.tsx`

- **Home = Join only.**
- Always shows: Profile header, **Scan Site QR**, **Enter Site Code**.
- When user has sites: hint *"You have X site(s). Open Projects to work."*
- **No** Attendance, Tasks, Docs, Tools on Home.

### 3.4 `app/(labour)/(tabs)/projects.tsx`

- **Active Projects** and **Past Projects**.
- Each card: Site name, Status (Active / Completed), **Open Project**.
- **Open Project** → `manage-site/[siteId]`.

### 3.5 `app/(labour)/manage-site/[siteId].tsx`

- **Project Dashboard**: 4 cards (LabourCard style):
  1. **Mark Attendance** → `/(labour)/attendance/[siteId]`
  2. **My Assigned Tasks** → `/(labour)/tasks/[siteId]`
  3. **Site Documentation** → `/(labour)/documentation/[siteId]`
  4. **Tools Diary** → `/(labour)/tools-diary/[siteId]`
- All work actions live here; Home has none.

### 3.6 `app/(labour)/tools-diary/[siteId].tsx`

- **Available tools** (from API), **Request** per tool.
- **Request**: modal → duration (30 min, 1 h, 2 h, Custom) → `POST /api/tools/request`.
- **My requests**: list with status (pending / issued / returned / rejected).
- **Return tool**: for `issued` → `PATCH /api/tools/return/:requestId` (time auto-captured).
- Loading, empty, refresh. No mock data.

### 3.7 `constants/api.ts`

- **`LABOUR_ENDPOINTS.TOOLS`**:
  - `LIST_BY_SITE(siteId)`
  - `MY_REQUESTS(siteId)`
  - `REQUEST`
  - `RETURN(requestId)`

### 3.8 `server/index.js`

- **Tools routes:**
  - `GET /api/tools/site/:siteId` – list tools for site
  - `GET /api/tools/my-requests/:siteId` – my requests for site
  - `POST /api/tools/request` – create request (toolId, siteId, requestedDuration)
  - `PATCH /api/tools/return/:requestId` – labour returns (sets `returnedAt`)
  - `PATCH /api/tools/approve/:requestId` – authority approve (sets `issuedAt`, status `issued`)
  - `PATCH /api/tools/reject/:requestId` – authority reject
  - `PATCH /api/tools/review-return/:requestId` – timeliness, condition, remarks
- **Seed:** default tools (Hammer, Drill, Grinder, Ladder, Welding Machine, Safety Helmet) for default site.
- **Collections:** `tools`, `toolrequests` in `construction-app` DB. No new DB; use existing.

---

## 4. Flow (Final)

| Screen | Purpose |
|--------|---------|
| **Home** | Join sites only (Scan QR, Enter Code) |
| **Projects** | List Active / Past → **Open Project** |
| **Project Dashboard** | 4 cards → Attendance, Tasks, Docs, **Tools Diary** |
| **Tools Diary** | View tools, request (duration), see status, return |

---

## 5. How to Merge

1. Unzip **labour-layoff-2.zip**.
2. Overwrite project files with the unzipped `app/`, `constants/`, `server/` paths.
3. Ensure **Labour**-specific deps are installed (Expo, React Navigation, etc.).
4. Run `npm run server` (or your node server) so Tools APIs + seed run.
5. Restart app (e.g. `npx expo start -c`) and test Labour flow.

---

## 6. Dependencies (Unchanged)

- Same as existing Labour flow: Expo Router, React Navigation, `UserContext`, `LabourCard`, `LabourDashboardHeader`, `LabourFloatingTabBar`, `designSystem`, etc.
- No new npm packages.

---

## 7. Out of Scope (Not in Zip)

- Owner / Manager UI
- `scan-qr`, `attendance`, `tasks`, `documentation` screens (unchanged)
- `LabourFloatingTabBar`, `LabourCard`, etc. (unchanged)

---

*Labour Layoff 2 – Home / Projects / Project Dashboard refactor + Tools Diary.*
