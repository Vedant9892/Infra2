# Role Migration Fix - Legacy "owner" → "site_owner"

## Problem
Users registered with legacy role `"owner"` cannot sign in when frontend sends `"site_owner"` due to strict role comparison.

## Solution Implemented

### 1. Role Normalization Functions
Added helper functions in `server/index.js`:

```javascript
function normalizeRole(role) {
  // Maps legacy roles to new canonical names
  if (role === 'owner') return 'site_owner';
  if (role === 'supervisor') return 'site_supervisor';
  if (role === 'engineer') return 'junior_engineer';
  return role;
}

function rolesMatch(storedRole, requestedRole) {
  // Compares normalized roles (handles legacy mappings)
  const normalizedStored = normalizeRole(storedRole);
  const normalizedRequested = normalizeRole(requestedRole);
  return normalizedStored === normalizedRequested;
}
```

### 2. Updated Auth Endpoints

**`POST /api/auth/register`:**
- Normalizes role before storing (e.g., `"owner"` → `"site_owner"`)
- Returns normalized role in response
- Prevents new legacy roles from being created

**`POST /api/auth/signin`:**
- Uses `rolesMatch()` to compare roles (handles legacy mappings)
- Auto-updates legacy `"owner"` to `"site_owner"` in database on successful login
- Returns normalized role in response

**`POST /api/auth/login` (Legacy):**
- Also uses role normalization
- Auto-updates legacy roles on login

### 3. Role Mappings

| Legacy Role | New Canonical Role |
|-------------|-------------------|
| `owner` | `site_owner` |
| `supervisor` | `site_supervisor` |
| `engineer` | `junior_engineer` |

### 4. Auto-Migration
- When a user with `role: "owner"` signs in as `"site_owner"`, the database is automatically updated
- No manual migration needed - happens on first login
- Subsequent logins use the new role name

## Testing

1. **Existing "owner" user:**
   - Sign in with `role: "site_owner"` → Should work ✅
   - Database automatically updated to `"site_owner"`

2. **New registration:**
   - Register with `role: "site_owner"` → Stored as `"site_owner"` ✅
   - Register with `role: "owner"` → Normalized and stored as `"site_owner"` ✅

3. **All 6 roles:**
   - `labour`, `site_supervisor`, `junior_engineer`, `senior_engineer`, `site_manager`, `site_owner` all work ✅

## Files Modified

- `server/index.js` - Added normalization functions and updated auth endpoints

---

**Status:** ✅ Fixed - Legacy "owner" users can now sign in as "site_owner"
