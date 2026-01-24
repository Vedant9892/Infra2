# Naming Conventions - InfraTrace CFMA

## Database & Code Naming Standards

### ✅ Standard: **camelCase for TypeScript/JavaScript, snake_case for Database Columns**

---

## Database Schema (PostgreSQL)

**All database columns use snake_case:**
- `user_id` (not `userId`)
- `site_id` (not `siteId`)
- `gps_lat`, `gps_lon` (not `gpsLat`, `gpsLon`)
- `shift_slot` (not `shiftSlot`)
- `approval_status` (not `approvalStatus`)
- `approved_by` (not `approvedBy`)
- `approved_at` (not `approvedAt`)
- `photo_uri` (not `photoUri`)
- `assigned_to_supervisor_id` (not `assignedToSupervisorId`)
- `created_by_engineer_id` (not `createdByEngineerId`)

**Example in schema.ts:**
```typescript
export const attendance = pgTable("attendance", {
  userId: integer("user_id").notNull(),  // TypeScript: camelCase, DB: snake_case
  siteId: integer("site_id"),            // TypeScript: camelCase, DB: snake_case
  gpsLat: decimal("gps_lat"),            // TypeScript: camelCase, DB: snake_case
  shiftSlot: text("shift_slot"),         // TypeScript: camelCase, DB: snake_case
});
```

---

## TypeScript/JavaScript Code

**All properties, variables, and function parameters use camelCase:**
- `userId` (not `user_id`)
- `siteId` (not `site_id`)
- `gpsLat`, `gpsLon` (not `gps_lat`, `gps_lon`)
- `shiftSlot` (not `shift_slot`)
- `approvalStatus` (not `approval_status`)
- `approvedBy` (not `approved_by`)
- `assignedToSupervisorId` (not `assigned_to_supervisor_id`)

**Drizzle ORM automatically converts:**
- Database column `user_id` → TypeScript property `userId`
- Database column `site_id` → TypeScript property `siteId`
- Database column `gps_lat` → TypeScript property `gpsLat`

---

## API Request/Response Bodies

**All API requests and responses use camelCase:**

### Request Example:
```json
{
  "userId": 123,
  "siteId": 456,
  "photoUri": "https://...",
  "gpsLat": 19.0760,
  "gpsLon": 72.8777
}
```

### Response Example:
```json
{
  "success": true,
  "attendance": {
    "id": 1,
    "userId": 123,
    "siteId": 456,
    "gpsLat": "19.0760",
    "gpsLon": "72.8777",
    "shiftSlot": "morning",
    "approvalStatus": "pending"
  }
}
```

---

## Frontend Code (React/TypeScript)

**All state, props, and variables use camelCase:**

```typescript
const [currentSiteId, setCurrentSiteId] = useState<number | null>(null);
const attendance = {
  userId: 123,
  siteId: 456,
  gpsLat: 19.0760,
  gpsLon: 72.8777,
  shiftSlot: 'morning',
  approvalStatus: 'pending'
};
```

---

## File Naming

- **Components**: PascalCase (`SiteMap.web.tsx`, `SiteBoundary.web.tsx`)
- **Utilities**: camelCase (`api.ts`, `storage.ts`)
- **Types/Schemas**: camelCase (`schema.ts`, `routes.ts`)

---

## Summary

| Context | Convention | Example |
|---------|-----------|---------|
| Database Column | snake_case | `user_id`, `site_id`, `gps_lat` |
| TypeScript Property | camelCase | `userId`, `siteId`, `gpsLat` |
| API Request/Response | camelCase | `{ "userId": 123, "siteId": 456 }` |
| Frontend State/Props | camelCase | `const [siteId, setSiteId] = useState()` |
| Function Parameters | camelCase | `function markAttendance(userId, siteId)` |

**Drizzle ORM handles the conversion automatically** - you use camelCase in code, and it maps to snake_case in the database.

---

*This ensures consistency across the entire codebase.*
