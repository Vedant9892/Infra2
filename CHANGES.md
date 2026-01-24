# Changed Files Summary

This archive contains **entire site manager** (owner/supervisor dashboard), **Chat** (hierarchical, backend, photos), and **Projects** tab.

---

## 1. Site manager (owner / supervisor dashboard)

### Backend: `server/index.js`

- Sites: `GET /api/sites`, `GET /api/sites/current`, `GET /api/sites/by-code/:code`, `GET /api/sites/id/:id`, `POST /api/sites`, `GET /api/sites/:siteId/workers`
- Enroll: `POST /api/sites/enroll`
- Memberships: `PATCH /api/sites/memberships/:id/approve`, `PATCH /api/sites/memberships/:id/reject`
- Tasks, material requests, visibility, etc.
- **Chat API:** `GET /api/chat/contacts`, `GET /api/chat/conversations`, `GET /api/chat/messages`, `POST /api/chat/messages`, `PATCH /api/chat/messages/:id/read`

### Owner app routes

| Path | Description |
|------|-------------|
| `app/(owner)/_layout.tsx` | Owner stack (sites, site-detail, create-site, add-site) |
| `app/(owner)/sites.tsx` | Sites list; fetch `/api/sites`; nav to site-detail, create-site, add-site |
| `app/(owner)/site-detail.tsx` | Site detail, workers, approve/reject, SiteCodeManagement (QR), quick actions |
| `app/(owner)/add-site.tsx` | Map-based site registration (SiteMap, location, radius) |
| `app/(owner)/create-site/` | Form-based create: `index.tsx`, `SiteForm.tsx`, `SiteBoundary*`, `_styles`, `_types` |
| `app/(owner)/profile.tsx` | Owner profile, image picker, update profile |
| `app/(owner)/register.tsx` | Owner register |

### Shared components

| Path | Description |
|------|-------------|
| `mobile-components/SiteCodeManagement.tsx` | Site code + QR; copy/share; “Labourers scan QR to join” |
| `components/SiteMap.tsx` | Map for add-site (React Native) |
| `components/SiteMap.web.tsx` | Map for add-site (web) |

---

## 2. Chat (`app/(tabs)/chat.tsx`)

- Fetches `GET /api/chat/conversations`, `GET /api/chat/messages`
- Sends text + photos (`POST /api/chat/messages`); photos via Image Picker → Supabase `profile-photos` → `photoUrl`
- Hierarchical contacts; loading, refresh, empty states

---

## 3. Projects (`app/(tabs)/projects.tsx`)

- **Owner/Supervisor:** `GET /api/sites` → tasks per site; progress, team from `workersCount`
- **Labour/Engineer:** `GET /api/sites/current` → one project; tasks + workers for progress/team
- Filters: All | Active | Completed | On Hold; refresh; tap → `/(owner)/site-detail`

---

## Extract & overwrite

Unzip into the project root so paths match. The archive contains:

```
server/index.js
app/(tabs)/chat.tsx
app/(tabs)/projects.tsx
app/(owner)/_layout.tsx
app/(owner)/sites.tsx
app/(owner)/site-detail.tsx
app/(owner)/add-site.tsx
app/(owner)/profile.tsx
app/(owner)/register.tsx
app/(owner)/create-site/index.tsx
app/(owner)/create-site/SiteForm.tsx
app/(owner)/create-site/SiteBoundary.tsx
app/(owner)/create-site/SiteBoundary.native.tsx
app/(owner)/create-site/SiteBoundary.web.tsx
app/(owner)/create-site/_styles.ts
app/(owner)/create-site/_types.ts
mobile-components/SiteCodeManagement.tsx
components/SiteMap.tsx
components/SiteMap.web.tsx
CHANGES.md
```

Ensure `API_BASE_URL` in `constants/api.ts` points to your backend, and run `node server/index.js`.
