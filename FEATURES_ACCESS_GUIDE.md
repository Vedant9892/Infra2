# Where to Access the 6 Features - Role-Based Guide

## ✅ Features Tab Removed
The separate "Features" tab has been removed. All features are now integrated into role-specific dashboards.

---

## 📍 Where to Find Each Feature

### 1. **Contractor Rating & Management**
**Who Uses:** Site Owners
**Where to Access:**
- **Owner Dashboard** → Site Detail → Quick Actions
- Direct route: `/(features)/contractors`
- **Purpose:** View contractor ratings, payment advice, track deadlines and defects

---

### 2. **Face-Recall for Daily Wagers**
**Who Uses:** Supervisors
**Where to Access:**
- **Supervisor Dashboard** → Quick Actions → "Face Recognition"
- Already integrated at: `app/(supervisor)/(tabs)/home.tsx` (line 119-125)
- Direct route: `/(supervisor)/face-attendance/[siteId]`
- **Purpose:** Scan daily wagers' faces for attendance tracking

---

### 3. **Tool Library Check-Out**
**Who Uses:** All roles (different permissions)
**Where to Access:**
- **Labour:** Home → Quick Actions → "Request Tool"
- **Supervisor:** Home → Quick Actions → "Tool Library" (manage)
- **Owner:** Site Detail → Quick Actions → "Tools"
- Direct route: `/(features)/tool-library`
- **Purpose:** 
  - Labour: Request tools
  - Supervisor/Owner: Manage tool inventory, approve requests

---

### 4. **OTP Permit-to-Work**
**Who Uses:** Labour (request), Supervisor/Engineer (verify)
**Where to Access:**
- **Labour:** Home → Quick Actions → "Request Permit"
- **Supervisor:** Home → Quick Actions → "Verify Permits"
- Direct route: `/(features)/permit-otp`
- **Purpose:**
  - Labour: Request safety clearance for dangerous tasks
  - Supervisor/Engineer: Verify OTP and grant clearance

---

### 5. **Petty Cash Wallet with Geotags**
**Who Uses:** Labour (submit), Owner/Supervisor (approve)
**Where to Access:**
- **Labour:** Home → Quick Actions → "Petty Cash"
- **Owner:** Site Detail → Financial section → "Petty Cash"
- Direct route: `/(features)/petty-cash`
- **Purpose:**
  - Labour: Submit expense receipts with GPS validation
  - Owner/Supervisor: Approve/reject expenses

---

### 6. **Real-Time Consumption Variance**
**Who Uses:** Owner, Engineer
**Where to Access:**
- **Owner:** Site Detail → Reports → "Consumption Variance"
- **Engineer:** Dashboard → Material Tracking → "Variance"
- Direct route: `/(features)/consumption-variance`
- **Purpose:** Track theoretical vs actual material usage, detect wastage

---

## 🎯 Integration Points

### Owner Dashboard (`app/(owner)/site-detail.tsx`)
Add these to Quick Actions:
```typescript
{
  id: 'contractors',
  icon: 'star',
  title: 'Contractor Rating',
  onPress: () => router.push('/(features)/contractors'),
},
{
  id: 'consumption',
  icon: 'analytics',
  title: 'Consumption Variance',
  onPress: () => router.push('/(features)/consumption-variance'),
},
{
  id: 'petty-cash',
  icon: 'wallet',
  title: 'Petty Cash',
  onPress: () => router.push('/(features)/petty-cash'),
},
```

### Supervisor Dashboard (`app/(supervisor)/(tabs)/home.tsx`)
Add these to actions array:
```typescript
{
  id: 'tools',
  icon: 'construct',
  title: 'Tool Library',
  onPress: () => router.push('/(features)/tool-library'),
},
{
  id: 'permit-verify',
  icon: 'key',
  title: 'Verify Permits',
  onPress: () => router.push('/(features)/permit-otp'),
},
// Face-Recall already exists (line 119-125)
```

### Labour Dashboard (`app/(tabs)/home.tsx`)
Add these to quickActions:
```typescript
{
  id: 'tools',
  icon: 'construct',
  title: 'Request Tool',
  onPress: () => router.push('/(features)/tool-library'),
},
{
  id: 'permit',
  icon: 'key',
  title: 'Request Permit',
  onPress: () => router.push('/(features)/permit-otp'),
},
{
  id: 'petty-cash',
  icon: 'wallet',
  title: 'Petty Cash',
  onPress: () => router.push('/(features)/petty-cash'),
},
```

---

## 📱 Navigation Flow

### For Labour:
1. Open app → Home tab
2. See Quick Actions
3. Tap "Request Tool" / "Request Permit" / "Petty Cash"
4. Feature screen opens

### For Supervisor:
1. Open app → Supervisor Home
2. See Quick Actions
3. Tap "Tool Library" / "Verify Permits" / "Face Recognition"
4. Feature screen opens

### For Owner:
1. Open app → Sites → Select Site
2. See Site Detail with Quick Actions
3. Tap "Contractor Rating" / "Consumption Variance" / "Petty Cash"
4. Feature screen opens

---

## ✅ Benefits of This Approach

1. **Role-Based Access** - Each role sees only relevant features
2. **Natural Workflow** - Features appear where they're needed
3. **Cleaner UI** - No separate "Features" tab cluttering navigation
4. **Better UX** - Features integrated into daily workflows
5. **Context-Aware** - Features appear in the right context (e.g., site detail for owner)

---

## 🔧 Next Steps

To fully integrate, add the feature actions to:
1. ✅ Owner dashboard - Add contractor rating, consumption variance
2. ✅ Supervisor dashboard - Add tool library, permit verification
3. ✅ Labour dashboard - Add tool request, permit request, petty cash

The feature screens (`app/(features)/*.tsx`) remain unchanged and are accessed via role dashboards.
