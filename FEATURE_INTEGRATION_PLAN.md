# Feature Integration Plan - Remove Features Tab

## 🎯 Goal
Integrate all 6 features into role-specific dashboards where they naturally belong, instead of a separate "Features" tab.

---

## 📍 Feature Placement by Role

### 1. **Owner Dashboard** (`app/(owner)/site-detail.tsx`)
**Features to Add:**
- ✅ **Contractor Rating** - Add as a new tab or section in site detail
- ✅ **Consumption Variance** - Add to Quick Actions or Reports section
- ✅ **Petty Cash Approval** - Add to Financial/Approvals section

**Location:** `app/(owner)/site-detail.tsx` or `app/(owner)/site/[id].tsx`

---

### 2. **Supervisor Dashboard** (`app/(supervisor)/(tabs)/home.tsx`)
**Features to Add:**
- ✅ **Face-Recall** - Already exists as "Face Recognition" action (line 119-125)
- ✅ **Tool Library** - Add to Quick Actions (manage tool checkout/return)
- ✅ **OTP Permit Verification** - Add to Quick Actions (verify safety permits)

**Location:** `app/(supervisor)/(tabs)/home.tsx` - Add to `actions` array

---

### 3. **Labour Dashboard** (`app/(tabs)/home.tsx` or `app/(labour)/(tabs)/home.tsx`)
**Features to Add:**
- ✅ **Tool Library** - Add to Quick Actions (request tools)
- ✅ **OTP Permit Request** - Add to Quick Actions (request safety permits)
- ✅ **Petty Cash Submission** - Add to Quick Actions (submit expenses)

**Location:** `app/(tabs)/home.tsx` - Add to `quickActions` or role-specific features

---

### 4. **Engineer Dashboard** (if separate)
**Features to Add:**
- ✅ **Consumption Variance** - Material tracking and variance analysis
- ✅ **OTP Permit Verification** - Verify safety permits

---

## 🔧 Implementation Steps

### Step 1: Remove Features Tab
- Remove `features` tab from `app/(tabs)/_layout.tsx`
- Keep the feature screens but access them via role dashboards

### Step 2: Add to Owner Dashboard
```typescript
// In app/(owner)/site-detail.tsx
const quickActions = [
  // ... existing actions
  {
    id: 'contractors',
    icon: 'star',
    title: 'Contractor Rating',
    subtitle: 'Manage contractors',
    onPress: () => router.push('/(features)/contractors'),
  },
  {
    id: 'consumption',
    icon: 'analytics',
    title: 'Consumption Variance',
    subtitle: 'Material tracking',
    onPress: () => router.push('/(features)/consumption-variance'),
  },
];
```

### Step 3: Add to Supervisor Dashboard
```typescript
// In app/(supervisor)/(tabs)/home.tsx
const actions: QuickAction[] = [
  // ... existing actions (face-attendance already exists)
  {
    id: 'tools',
    icon: 'construct',
    title: 'Tool Library',
    subtitle: 'Manage tools',
    onPress: () => router.push('/(features)/tool-library'),
  },
  {
    id: 'permit-verify',
    icon: 'key',
    title: 'Verify Permits',
    subtitle: 'Safety clearance',
    onPress: () => router.push('/(features)/permit-otp'),
  },
];
```

### Step 4: Add to Labour Dashboard
```typescript
// In app/(tabs)/home.tsx or app/(labour)/(tabs)/home.tsx
const quickActions = [
  // ... existing actions
  {
    id: 'tools',
    icon: 'construct',
    title: 'Request Tool',
    subtitle: 'Borrow tools',
    onPress: () => router.push('/(features)/tool-library'),
  },
  {
    id: 'permit',
    icon: 'key',
    title: 'Request Permit',
    subtitle: 'Safety clearance',
    onPress: () => router.push('/(features)/permit-otp'),
  },
  {
    id: 'petty-cash',
    icon: 'wallet',
    title: 'Petty Cash',
    subtitle: 'Submit expenses',
    onPress: () => router.push('/(features)/petty-cash'),
  },
];
```

---

## 📋 Feature Access Matrix

| Feature | Owner | Supervisor | Engineer | Labour |
|---------|-------|------------|----------|--------|
| **Contractor Rating** | ✅ View/Manage | ❌ | ❌ | ❌ |
| **Face-Recall** | ❌ | ✅ Use | ❌ | ❌ |
| **Tool Library** | ✅ View | ✅ Manage | ✅ View | ✅ Request |
| **OTP Permit** | ✅ View | ✅ Verify | ✅ Verify | ✅ Request |
| **Petty Cash** | ✅ Approve | ✅ Approve | ❌ | ✅ Submit |
| **Consumption Variance** | ✅ View | ✅ View | ✅ Manage | ❌ |

---

## 🗑️ Files to Modify

1. **Remove Features Tab:**
   - `app/(tabs)/_layout.tsx` - Remove features tab

2. **Add to Owner:**
   - `app/(owner)/site-detail.tsx` - Add contractor rating, consumption variance
   - `app/(owner)/site/[id].tsx` - Add petty cash approval section

3. **Add to Supervisor:**
   - `app/(supervisor)/(tabs)/home.tsx` - Add tool library, permit verification

4. **Add to Labour:**
   - `app/(tabs)/home.tsx` - Add tool request, permit request, petty cash
   - Or `app/(labour)/(tabs)/home.tsx` if separate

5. **Keep Feature Screens:**
   - Keep all `app/(features)/*.tsx` files
   - They'll be accessed via role dashboards, not a tab

---

## ✅ Benefits

1. **Better UX** - Features appear where users need them
2. **Role-Based Access** - Each role sees only relevant features
3. **Natural Workflow** - Features integrated into daily workflows
4. **Cleaner Navigation** - No separate "features" tab cluttering UI

---

## 🚀 Next Steps

1. Remove features tab from `_layout.tsx`
2. Add features to respective role dashboards
3. Test navigation from each role
4. Update documentation
