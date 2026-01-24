# Database Fix Guide - Common Errors & Solutions

## 🔍 Common Terminal Errors & Fixes

### 1. **Missing Import Error in routes.ts**
**Error:** `registerSitesRoutes is not defined` or `Cannot find module './sites-routes'`

**Fix:** ✅ Already fixed - Added import in `server/routes.ts`:
```typescript
import { registerSitesRoutes } from "./sites-routes";
```

---

### 2. **Role Mismatch: "owner" vs "site_owner"**
**Error:** `This account is registered as owner, not site_owner`

**Root Cause:** 
- Database stores roles as: `"owner"`, `"supervisor"`, `"engineer"`
- Frontend sends: `"site_owner"`, `"site_supervisor"`, `"junior_engineer"`

**Fix:** ✅ Already fixed - Updated `normalizeRole()` function in `server/index.js`:
- Maps `"site_owner"` → `"owner"` (for database)
- Maps `"site_supervisor"` → `"supervisor"`
- Maps `"junior_engineer"` / `"senior_engineer"` → `"engineer"`

**Database Action Required:**
- ✅ No migration needed - normalization handles it automatically
- Users with `"owner"` in DB can sign in as `"site_owner"` (frontend)

---

### 3. **MongoDB Connection Error**
**Error:** `MongoDB connection failed` or `Missing MONGODB_URI in environment`

**Fix:**
1. Check `.env` file exists in `Infra2/` directory
2. Add/verify:
   ```
   MONGODB_URI=mongodb://localhost:27017/infratrace
   ```
   OR for MongoDB Atlas:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/infratrace
   ```
3. Restart server: `npm run dev`

---

### 4. **PostgreSQL/Drizzle Connection Error**
**Error:** `Cannot find module './db'` or Drizzle connection errors

**Fix:**
1. Check `server/db.ts` exists
2. Verify `.env` has:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```
3. Run migrations:
   ```bash
   npm run db:push
   # or
   npx drizzle-kit push
   ```

---

### 5. **Port Already in Use**
**Error:** `EADDRINUSE: address already in use :::4000`

**Fix:**
1. Find process using port:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :4000
   # Kill process (replace PID)
   taskkill /PID <PID> /F
   ```
2. Or change PORT in `.env`:
   ```
   PORT=4001
   ```

---

### 6. **Missing Collection/Table**
**Error:** `Collection 'users' not found` or `relation "users" does not exist`

**Fix:**

**For MongoDB:**
- Collections are created automatically on first insert
- No action needed

**For PostgreSQL:**
- Run migrations:
  ```bash
  npm run db:push
  ```
- Or manually create tables using `shared/schema.ts`

---

### 7. **TypeScript Compilation Errors**
**Error:** Type errors in `routes.ts` or other `.ts` files

**Fix:**
1. Check all imports are correct
2. Verify TypeScript version: `npm list typescript`
3. Rebuild: `npm run build`
4. Check `tsconfig.json` settings

---

## 🗄️ Database Schema Consistency

### MongoDB Collections Expected:
- `users` - User accounts with `role` field
- `sites` - Site information
- `attendance` - Attendance records

### PostgreSQL Tables (Drizzle):
- `users` - User accounts
- `tasks` - Task assignments
- `attendance` - GPS attendance with approval
- `sites` - Site locations with radius

---

## 🔧 Quick Diagnostic Commands

```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/infratrace"

# Check PostgreSQL connection
psql -U postgres -d dbname

# View recent errors in server
# Check terminal output

# Verify environment variables
cat .env | grep MONGODB_URI
cat .env | grep DATABASE_URL
```

---

## 📝 Current Status

✅ **Fixed:**
- Missing `registerSitesRoutes` import
- Role normalization (`site_owner` → `owner`)

⚠️ **To Verify:**
- MongoDB connection string in `.env`
- PostgreSQL connection (if using Drizzle routes)
- Port availability (4000)

---

## 🚀 Next Steps if Errors Persist

1. **Check server logs** - Look for specific error messages
2. **Verify database is running:**
   - MongoDB: `mongod` service running
   - PostgreSQL: `postgresql` service running
3. **Check `.env` file** - All required variables present
4. **Restart server** - `Ctrl+C` then `npm run dev`

---

**Last Updated:** After fixing role normalization and routes import
