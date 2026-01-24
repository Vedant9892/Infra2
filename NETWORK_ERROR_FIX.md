# Network Request Failed - Fix Guide

## 🔍 Problem
The app is trying to connect to `http://172.16.3.248:3001` but getting "Network request failed" errors.

## ✅ Root Causes & Solutions

### 1. **Server Not Running**
**Symptom:** All API calls fail with "Network request failed

**Solution:**
```bash
# Start the server
cd Infra2
npm run dev
# OR
node server/index.js
```

**Expected Output:**
```
Connected to MongoDB
API listening on 3001
```

---

### 2. **Port Mismatch**
**Symptom:** Server running on different port than app expects

**Check:**
- App expects: `http://172.16.3.248:3001` (from `constants/api.ts`)
- Server default: Port 4000 (from `server/index.js`)
- `.env` file: `PORT=3001`

**Fix Option A: Update .env (Recommended)**
```bash
# In Infra2/.env
PORT=3001
```

**Fix Option B: Update API Base URL**
```typescript
// In constants/api.ts
android: `http://${DEV_IP}:4000`,  // Change 3001 to 4000
```

---

### 3. **Wrong IP Address**
**Symptom:** Connection timeout, server running but can't connect

**Check Your IP:**
```bash
# Windows
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)

# Linux/Mac
ifconfig
# OR
ip addr show
```

**Update IP in `constants/api.ts`:**
```typescript
const DEV_IP = '192.168.1.100'; // ← Your actual IP
```

---

### 4. **Firewall Blocking Connection**
**Symptom:** Server running, IP correct, but still can't connect

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Node.js or your terminal
4. Allow both Private and Public networks

**Or temporarily disable firewall for testing:**
```bash
# PowerShell (as Admin)
netsh advfirewall set allprofiles state off
```

---

### 5. **Server Not Binding to 0.0.0.0**
**Symptom:** Server only accessible from localhost, not from device

**Check `server/index.js`:**
```javascript
// Should be:
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on ${PORT}`);
});

// NOT:
app.listen(PORT, 'localhost', () => { ... });
```

---

## 🧪 Quick Diagnostic Steps

### Step 1: Verify Server is Running
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Should show Node.js process
```

### Step 2: Test Server from Browser
Open: `http://localhost:3001/api/sites/owner/test`

Should return JSON (even if error, means server is running)

### Step 3: Test from Device/Emulator
```bash
# From Android emulator/device
curl http://172.16.3.248:3001/api/sites/owner/test

# Should return JSON response
```

### Step 4: Check Server Logs
Look for:
```
✅ Connected to MongoDB
✅ API listening on 3001
```

If you see errors, fix them first.

---

## 🔧 Quick Fix Commands

### Start Server (if not running)
```bash
cd Infra2
npm run dev
```

### Check Port
```bash
# Windows
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID> /F
```

### Update IP Address
1. Run `ipconfig` to get your IP
2. Update `constants/api.ts` with your IP
3. Restart Expo app

---

## 📋 Current Configuration

**App Configuration (`constants/api.ts`):**
- IP: `172.16.3.248`
- Port: `3001`
- URL: `http://172.16.3.248:3001`

**Server Configuration (`server/index.js`):**
- Default Port: `4000`
- Env Port: `3001` (from `.env`)
- Should run on: `3001` (if `.env` loaded)

**Mismatch:** Server might be running on 4000, but app expects 3001

---

## ✅ Recommended Fix

1. **Ensure `.env` has `PORT=3001`**
2. **Start server:** `npm run dev`
3. **Verify server logs show:** `API listening on 3001`
4. **If still fails, check:**
   - IP address is correct (`ipconfig`)
   - Firewall allows Node.js
   - Server is binding to `0.0.0.0` (not just localhost)

---

## 🚨 Common Errors

### Error: "Network request failed"
- **Cause:** Server not running or wrong port/IP
- **Fix:** Start server, verify port/IP

### Error: "Connection refused"
- **Cause:** Server not binding to 0.0.0.0
- **Fix:** Update `app.listen()` to bind to `0.0.0.0`

### Error: "Timeout"
- **Cause:** Firewall blocking or wrong IP
- **Fix:** Check firewall, verify IP address

---

**Last Updated:** After fixing port mismatch issue
