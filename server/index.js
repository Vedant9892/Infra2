const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const PORT = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('Missing MONGODB_URI in environment');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let db;
async function connectDb() {
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  try {
    await client.connect();
    db = client.db('infratrace');
    await db.collection('users').createIndex({ phoneNumber: 1 }, { unique: true });
    await db.collection('materialRequests').createIndex({ status: 1, siteId: 1, createdAt: -1 });
    await db.collection('materialRequests').createIndex({ requestedBy: 1, createdAt: -1 });
    await db.collection('attendance').createIndex({ siteId: 1, approvalStatus: 1, date: -1 });
    await db.collection('tasks').createIndex({ siteId: 1, assignedToSupervisorId: 1, assignedToLabourId: 1 });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}
const usersCollection = () => {
  if (!db) throw new Error('DB not initialized');
  return db.collection('users');
};

const sitesCollection = () => {
  if (!db) throw new Error('DB not initialized');
  return db.collection('sites');
};

const attendanceCollection = () => {
  if (!db) throw new Error('DB not initialized');
  return db.collection('attendance');
};

const materialRequestsCollection = () => {
  if (!db) throw new Error('DB not initialized');
  return db.collection('materialRequests');
};

const stockCollection = () => {
  if (!db) throw new Error('DB not initialized');
  return db.collection('stock');
};

const billsCollection = () => {
  if (!db) throw new Error('DB not initialized');
  return db.collection('bills');
};

async function resolveUserRole(identifier) {
  if (!identifier) return null;
  const users = usersCollection();
  if (typeof identifier === 'string' && identifier.length === 24) {
    try {
      const user = await users.findOne({ _id: new ObjectId(identifier) });
      if (user?.role) return user.role;
    } catch (err) {
      return null;
    }
  }
  const user = await users.findOne({ phoneNumber: identifier });
  return user?.role || null;
}

// ==================== ADMIN API ====================

// Create site owner account (for Vasantdada Patil College)
app.post('/api/admin/create-owner', async (req, res) => {
  try {
    const { phoneNumber = '111111', name = 'Vasantdada Patil College', role = 'site_owner' } = req.body;
    
    const users = usersCollection();
    
    // Check if user already exists
    const existingUser = await users.findOne({ phoneNumber });
    
    if (existingUser) {
      // Update role if needed
      if (existingUser.role !== 'site_owner' && existingUser.role !== 'owner') {
        await users.updateOne(
          { _id: existingUser._id },
          { $set: { role: 'site_owner', updatedAt: new Date() } }
        );
      }
      
      return res.json({
        success: true,
        userId: existingUser._id.toString(),
        phoneNumber: phoneNumber,
        role: existingUser.role,
        message: 'User already exists'
      });
    }
    
    // Create new user
    const newUser = {
      phoneNumber,
      role: 'site_owner',
      profileCompleted: false,
      name: name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(newUser);
    
    console.log(`✅ Site Owner Account Created: ${name} (Phone: ${phoneNumber})`);
    
    return res.json({
      success: true,
      userId: result.insertedId.toString(),
      phoneNumber: phoneNumber,
      role: newUser.role,
      name: name,
      message: 'Site owner account created successfully'
    });
  } catch (err) {
    console.error('Create owner account error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== SITES API ====================

// Create new site
app.post('/api/sites', async (req, res) => {
  try {
    const {
      ownerId,
      name,
      description,
      address,
      latitude,
      longitude,
      radius, // Attendance radius in meters (50-500)
      boundary,
      overlayImage,
      overlaySettings,
      projectType
    } = req.body || {};

    if (!ownerId || !name || !address) {
      return res.status(400).json({
        success: false,
        message: 'ownerId, name, and address are required'
      });
    }

    // Radius validation - use default if not provided
    const finalRadius = radius || 100; // Default 100m if not provided

    const sites = sitesCollection();

    // Generate 6-digit enrollment code for this site
    function generateEnrollmentCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    let enrollmentCode = generateEnrollmentCode();
    // Ensure code is unique (check if exists, regenerate if needed)
    let codeExists = await sites.findOne({ enrollmentCode: enrollmentCode });
    let attempts = 0;
    while (codeExists && attempts < 10) {
      enrollmentCode = generateEnrollmentCode();
      codeExists = await sites.findOne({ enrollmentCode: enrollmentCode });
      attempts++;
    }

    const newSite = {
      ownerId: new ObjectId(ownerId),
      name,
      description: description || '',
      address,
      latitude: latitude || 19.0760,
      longitude: longitude || 72.8777,
      radius: finalRadius, // Attendance radius in meters
      boundary: boundary || [], // Optional for web
      overlayImage: overlayImage || null,
      overlaySettings: overlaySettings || null,
      projectType: projectType || 'residential',
      status: 'active',
      workersCount: 0,
      progress: 0,
      budget: null,
      // Enrollment code fields
      enrollmentCode: enrollmentCode,
      codeGeneratedAt: new Date(),
      codeExpiresAt: null, // No expiry by default
      codeUsageCount: 0,
      maxEnrollments: null, // Unlimited by default
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await sites.insertOne(newSite);

    console.log(`✅ Site created: ${name} (ID: ${result.insertedId.toString()}) with radius ${finalRadius}m`);
    console.log(`📝 Enrollment Code: ${enrollmentCode} - Share this code with labour to enroll them in this site`);

    return res.json({
      success: true,
      site: {
        id: result.insertedId.toString(),
        ownerId: ownerId,
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude,
        radius: finalRadius,
        projectType: projectType || 'residential',
        status: 'active',
        enrollmentCode: enrollmentCode, // Include enrollment code in response
      },
      siteId: result.insertedId.toString(), // Keep for backward compat
      enrollmentCode: enrollmentCode, // Also return separately for easy access
      message: `Site created successfully! Enrollment Code: ${enrollmentCode} - Share this with labour to enroll them.`
    });
  } catch (err) {
    console.error('Create site error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get sites for a labour user (based on enrollment/assignment)
app.get('/api/sites/labour/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const users = usersCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // For now, return all active sites (in production, filter by enrollment)
    // TODO: Filter by user's enrolledSiteId or enrollment records
    const sites = sitesCollection();
    const allSites = await sites.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .toArray();

    // Format sites for frontend
    const formattedSites = allSites.map(site => ({
      id: site._id.toString(),
      name: site.name,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      radius: site.radius || 100,
      projectType: site.projectType,
      status: site.status,
      enrollmentCode: site.enrollmentCode || null, // Include enrollment code
    }));

    console.log(`📋 Found ${formattedSites.length} sites for labour user ${userId}`);

    return res.json({
      success: true,
      sites: formattedSites,
      count: formattedSites.length,
    });
  } catch (err) {
    console.error('Get labour sites error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all sites for an owner
app.get('/api/sites/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({ success: false, message: 'ownerId is required' });
    }

    const sites = sitesCollection();
    const ownerSites = await sites.find({ ownerId: new ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Format sites for frontend - include ALL fields needed by UI
    const formattedSites = ownerSites.map(site => ({
      id: site._id.toString(),
      name: site.name,
      location: site.address || site.location || '',
      address: site.address || site.location || '',
      latitude: site.latitude || 19.0760,
      longitude: site.longitude || 72.8777,
      radius: site.radius || 100,
      status: site.status || 'active',
      projectType: site.projectType || 'residential',
      workersCount: site.workersCount || 0,
      progress: site.progress || 0,
      tasksCompleted: site.tasksCompleted || 0,
      tasksPending: site.tasksPending || 0,
      budget: site.budget || '₹0',
      startDate: site.createdAt || new Date(),
      lastUpdated: site.updatedAt || site.createdAt || new Date(),
      imageUrl: site.overlayImage || null,
      enrollmentCode: site.enrollmentCode || null, // Include enrollment code
      codeUsageCount: site.codeUsageCount || 0,
    }));
    
    console.log(`📋 Returning ${formattedSites.length} sites for owner ${ownerId}`);

    return res.json({
      success: true,
      sites: formattedSites
    });
  } catch (err) {
    console.error('Get owner sites error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get single site details
app.get('/api/sites/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    const sites = sitesCollection();
    const site = await sites.findOne({ _id: new ObjectId(siteId) });

    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

      // Format site data with all details
      const siteData = {
        id: site._id.toString(),
        name: site.name,
        description: site.description,
        address: site.address,
        location: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        radius: site.radius || 100,
        boundary: site.boundary,
        overlayImage: site.overlayImage,
        overlaySettings: site.overlaySettings,
        projectType: site.projectType,
        status: site.status,
        enrollmentCode: site.enrollmentCode || null, // Include enrollment code
        codeGeneratedAt: site.codeGeneratedAt || null,
        codeUsageCount: site.codeUsageCount || 0,
        stats: {
          workers: site.workersCount || 0,
          progress: site.progress || 0,
          budget: site.budget || '₹0',
          spent: site.spent || '₹0',
          issues: site.issues || 0,
          tasksCompleted: site.tasksCompleted || 0,
          tasksPending: site.tasksPending || 0
        },
        attendance: site.attendance || [
          { day: 'Mon', present: 0 },
          { day: 'Tue', present: 0 },
          { day: 'Wed', present: 0 },
          { day: 'Thu', present: 0 },
          { day: 'Fri', present: 0 },
          { day: 'Sat', present: 0 }
        ],
        createdAt: site.createdAt,
        updatedAt: site.updatedAt
      };

    return res.json({
      success: true,
      site: siteData
    });
  } catch (err) {
    console.error('Get site details error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update site
app.put('/api/sites/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const updates = req.body || {};

    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    const sites = sitesCollection();

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.ownerId;
    delete updates.createdAt;

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    const result = await sites.updateOne(
      { _id: new ObjectId(siteId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    return res.json({
      success: true,
      message: 'Site updated successfully'
    });
  } catch (err) {
    console.error('Update site error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete site
app.delete('/api/sites/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    const sites = sitesCollection();
    const result = await sites.deleteOne({ _id: new ObjectId(siteId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    return res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (err) {
    console.error('Delete site error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== AUTH API ====================

// Helper function to normalize role names
// Maps frontend role names to database role names (database uses "owner", frontend uses "site_owner")
// Also handles reverse mapping for flexible matching
function normalizeRole(role) {
  if (!role) return role;
  // Map "site_owner" (frontend) to "owner" (database)
  if (role === 'site_owner' || role === 'owner') return 'owner';
  // Map "site_supervisor" and "site_manager" (frontend) to "supervisor" (database)
  // site_manager IS supervisor in the old database
  if (role === 'site_supervisor' || role === 'site_manager' || role === 'supervisor') return 'supervisor';
  // Map "junior_engineer" and "senior_engineer" (frontend) to "engineer" (database)
  if (role === 'junior_engineer' || role === 'senior_engineer' || role === 'engineer') return 'engineer';
  // For now, keep other roles as-is (labour, etc.)
  return role;
}

// Helper function to check if roles match (handles legacy roles)
function rolesMatch(storedRole, requestedRole) {
  const normalizedStored = normalizeRole(storedRole);
  const normalizedRequested = normalizeRole(requestedRole);
  return normalizedStored === normalizedRequested;
}

// Sign Up - Create new account
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phoneNumber, role } = req.body || {};
    if (!phoneNumber || !role) {
      return res.status(400).json({ success: false, message: 'phoneNumber and role are required' });
    }

    const users = usersCollection();

    // Check if user already exists
    const existingUser = await users.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Account already exists with this phone number. Please sign in instead.'
      });
    }

    // Normalize role before storing (site_manager → supervisor, site_owner → owner, etc.)
    // This ensures database consistency with old structure
    const normalizedRole = normalizeRole(role);
    const newUser = {
      phoneNumber,
      role: normalizedRole, // Store normalized role (e.g., "site_manager" → "supervisor")
      profileCompleted: false,
      createdAt: new Date()
    };
    const inserted = await users.insertOne(newUser);

    // Return frontend role name (not normalized) for consistency
    return res.json({
      success: true,
      userId: inserted.insertedId.toString(),
      user: {
        _id: inserted.insertedId.toString(),
        phoneNumber: phoneNumber,
        role: role, // Return original frontend role
      },
      profileCompleted: false
    });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Sign In - Authenticate existing account
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { phoneNumber, role } = req.body || {};
    if (!phoneNumber || !role) {
      return res.status(400).json({ success: false, message: 'phoneNumber and role are required' });
    }

    const users = usersCollection();
    const user = await users.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please sign up first.'
      });
    }

    // DEBUG: Log what we received
    console.log(`🔍 Signin attempt: phone=${phoneNumber}, frontendRole="${role}", dbRole="${user.role}"`);
    
    // AUTO-ASSIGN LABOUR TO VASANTDADA SITE
    if (role === 'labour' || user.role === 'labour') {
      const sites = sitesCollection();
      // Find Vasantdada Patil College site
      const vasantdadaSite = await sites.findOne({ 
        name: { $regex: /vasantdada|patil/i } 
      });
      
      if (vasantdadaSite && !user.currentSiteId) {
        // Auto-assign labour to Vasantdada site
        await users.updateOne(
          { _id: user._id },
          { 
            $set: { 
              currentSiteId: vasantdadaSite._id.toString(),
              enrolledSiteId: vasantdadaSite._id.toString(),
              enrollmentStatus: 'active',
              enrolledAt: new Date(),
              updatedAt: new Date()
            } 
          }
        );
        console.log(`✅ Auto-assigned labour ${phoneNumber} to site: ${vasantdadaSite.name} (${vasantdadaSite._id})`);
        user.currentSiteId = vasantdadaSite._id.toString();
        user.enrolledSiteId = vasantdadaSite._id.toString();
      }
    }

    // BULLETPROOF FIX: If frontend sends "site_owner" and DB has "owner", ALLOW IT
    const dbRole = String(user.role || '').trim();
    const frontendRole = String(role || '').trim();
    
    let roleMatches = false;
    
    // Direct match
    if (dbRole === frontendRole) {
      roleMatches = true;
      console.log(`✅ Direct match: ${dbRole} === ${frontendRole}`);
    }
    // "site_owner" (frontend) matches "owner" (database) - THIS IS THE KEY FIX
    else if (frontendRole === 'site_owner' && dbRole === 'owner') {
      roleMatches = true;
      console.log(`✅ Owner match: site_owner (frontend) === owner (DB)`);
    }
    // "owner" (frontend) matches "site_owner" (database) - just in case
    else if (frontendRole === 'owner' && dbRole === 'site_owner') {
      roleMatches = true;
      console.log(`✅ Owner match: owner (frontend) === site_owner (DB)`);
    }
    // For other roles, use normalization
    else {
      const normalizedDb = normalizeRole(dbRole);
      const normalizedFrontend = normalizeRole(frontendRole);
      roleMatches = (normalizedDb === normalizedFrontend);
      console.log(`🔧 Normalized check: ${normalizedDb} === ${normalizedFrontend}? ${roleMatches}`);
    }

    if (!roleMatches) {
      console.log(`❌ Role mismatch: DB has "${dbRole}" (type: ${typeof dbRole}), Frontend sent "${frontendRole}" (type: ${typeof frontendRole})`);
      console.log(`❌ Comparison: "${dbRole}" === "${frontendRole}" = ${dbRole === frontendRole}`);
      console.log(`❌ site_owner check: frontendRole === 'site_owner' = ${frontendRole === 'site_owner'}, dbRole === 'owner' = ${dbRole === 'owner'}`);
      return res.status(400).json({
        success: false,
        message: `This account is registered as ${dbRole}, not ${frontendRole}. Please select the correct role.`
      });
    }

    // Always return frontend role names if database has normalized names
    let returnRole = dbRole;
    if (dbRole === 'owner') returnRole = 'site_owner';
    // supervisor in DB can be site_supervisor or site_manager in frontend (they're the same)
    if (dbRole === 'supervisor') returnRole = 'site_supervisor';
    if (dbRole === 'engineer') returnRole = 'junior_engineer';

    console.log(`✅ Login successful: ${phoneNumber} as ${returnRole} (DB had: ${dbRole})`);

    return res.json({
      success: true,
      userId: user._id.toString(),
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: returnRole,
        profilePhoto: user.profilePhoto,
        location: user.location,
        profileCompleted: user.profileCompleted,
        enrolledSiteId: user.enrolledSiteId || user.currentSiteId || null,
        currentSiteId: user.currentSiteId || user.enrolledSiteId || null,
      },
      profileCompleted: !!user.profileCompleted
    });
  } catch (err) {
    console.error('Sign in error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Legacy login endpoint (kept for backward compatibility)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phoneNumber, role } = req.body || {};
    if (!phoneNumber || !role) {
      return res.status(400).json({ success: false, message: 'phoneNumber and role are required' });
    }
    const users = usersCollection();
    let user = await users.findOne({ phoneNumber });
    if (!user) {
      // Normalize role before storing
      const normalizedRole = normalizeRole(role);
      const newUser = { phoneNumber, role: normalizedRole, profileCompleted: false, createdAt: new Date() };
      const inserted = await users.insertOne(newUser);
      user = { ...newUser, _id: inserted.insertedId };
    } else {
      // Check role match with normalization
      if (!rolesMatch(user.role, role)) {
        return res.status(400).json({
          success: false,
          message: `This account is registered as ${user.role}, not ${role}`
        });
      }
      // Auto-update legacy roles
      const normalizedRole = normalizeRole(role);
      if (user.role !== normalizedRole) {
        await users.updateOne({ _id: user._id }, { $set: { role: normalizedRole } });
        user.role = normalizedRole;
      }
    }
    return res.json({ 
      success: true, 
      userId: user._id.toString(), 
      user: {
        _id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        role: normalizeRole(user.role), // Return normalized role
      },
      profileCompleted: !!user.profileCompleted 
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.phoneNumber) {
      const user = await usersCollection().findOne({ phoneNumber: req.body.phoneNumber });
      return res.json({ 
        success: true, 
        userId: user._id.toString(), 
        user: {
          _id: user._id.toString(),
          phoneNumber: user.phoneNumber,
          role: user.role, // Return database role
        },
        profileCompleted: !!user.profileCompleted 
      });
    }
    console.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Complete user profile (updated to include email and mobile)
app.post('/api/users/complete-profile', async (req, res) => {
  try {
    const { userId, name, email, phoneNumber, profilePhoto } = req.body || {};
    if (!userId || !name || !profilePhoto) {
      return res.status(400).json({ success: false, message: 'userId, name, and profilePhoto are required' });
    }

    const users = usersCollection();
    const updateData = {
      name,
      profilePhoto,
      profileCompleted: true
    };

    // Add email if provided
    if (email) {
      updateData.email = email;
    }

    // Add phoneNumber if provided (for verification)
    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }

    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updated.value) return res.status(404).json({ success: false, message: 'User not found' });
    const user = updated.value;
    return res.json({ success: true, user: { ...user, _id: user._id.toString() } });
  } catch (err) {
    console.error('Complete profile error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update user profile (for owner profile editing)
app.put('/api/users/update-profile', async (req, res) => {
  try {
    const { userId, name, profilePhoto } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const users = usersCollection();
    const updateData = {};

    if (name) updateData.name = name;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;

    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updated.value) return res.status(404).json({ success: false, message: 'User not found' });
    const user = updated.value;
    return res.json({ success: true, user: { ...user, _id: user._id.toString() } });
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Submit attendance (with address and proof photos)
app.post('/api/attendance/submit', async (req, res) => {
  try {
    const { userId, photoUri, proofPhotos, latitude, longitude, address } = req.body || {};

    if (!userId || !photoUri || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'userId, photoUri, latitude, and longitude are required'
      });
    }

    const attendanceRecord = {
      userId,
      photoUri,
      proofPhotos: proofPhotos || [],
      latitude,
      longitude,
      address: address || 'Address not available',
      timestamp: new Date(),
      status: 'present'
    };

    const attendance = db.collection('attendance');
    const inserted = await attendance.insertOne(attendanceRecord);

    return res.json({
      success: true,
      attendanceId: inserted.insertedId.toString(),
      message: 'Attendance marked successfully'
    });
  } catch (err) {
    console.error('Submit attendance error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== LABOUR API ENDPOINTS ====================

// Join site via enrollment code (for labour) - Simplified version using existing sites
app.post('/api/sites/join', async (req, res) => {
  try {
    const { siteCode, userId } = req.body || {};
    
    if (!siteCode || !userId) {
      return res.status(400).json({ error: 'siteCode and userId are required' });
    }

    const sites = sitesCollection();
    // Find site by enrollment code (stored in enrollmentCode field)
    const site = await sites.findOne({ 
      enrollmentCode: siteCode.toUpperCase(),
      status: 'active'
    });

    if (!site) {
      return res.status(400).json({ error: 'Invalid site code' });
    }

    // Update user's currentSiteId and enrolledSiteId
    const users = usersCollection();
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          currentSiteId: site._id.toString(),
          enrolledSiteId: site._id.toString(),
          enrollmentStatus: 'active',
          enrolledAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ User ${userId} joined site: ${site.name} (${site._id})`);

    return res.status(201).json({
      success: true,
      site: {
        _id: site._id.toString(),
        name: site.name,
        address: site.address,
      },
      role: 'worker',
    });
  } catch (err) {
    console.error('Join site error:', err);
    return res.status(400).json({ error: err.message || 'Failed to join site' });
  }
});

// Get user's sites (for labour) - Simplified using existing API
app.get('/api/sites/my-sites', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const users = usersCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sites = sitesCollection();
    let siteList = [];

    // If user has currentSiteId, return that site
    if (user.currentSiteId || user.enrolledSiteId) {
      const siteId = user.currentSiteId || user.enrolledSiteId;
      const site = await sites.findOne({ _id: new ObjectId(siteId) });
      if (site) {
        siteList = [{
          _id: site._id.toString(),
          name: site.name,
          address: site.address,
          role: 'worker',
          isActive: site.status === 'active',
        }];
      }
    }

    return res.json(siteList);
  } catch (err) {
    console.error('Get my-sites error:', err);
    return res.status(400).json({ error: err.message || 'Failed to fetch sites' });
  }
});

// Site documentation: upload work photo (labour)
app.post('/api/sites/:siteId/documentation', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { photoUrl, userId } = req.body || {};
    
    if (!siteId || !photoUrl || !userId) {
      return res.status(400).json({ error: 'Missing siteId, photoUrl, or userId' });
    }

    // Store work photo in MongoDB (can create a workphotos collection)
    const workphotos = db.collection('workphotos');
    await workphotos.insertOne({
      siteId: new ObjectId(siteId),
      userId: new ObjectId(userId),
      photoUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({ success: true, message: 'Work photo uploaded' });
  } catch (err) {
    console.error('Documentation upload error:', err);
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
});

// ==================== ATTENDANCE APPROVAL API (Supervisor) ====================

// Get pending attendance for supervisor approval
app.get('/api/attendance/pending', async (req, res) => {
  try {
    const { siteId, supervisorId } = req.query;
    
    if (!siteId) {
      return res.status(400).json({ error: 'siteId is required' });
    }

    const attendance = attendanceCollection();
    
    // Get pending attendance records for this site
    const pending = await attendance.find({
      siteId: siteId.toString(),
      approvalStatus: 'pending'
    }).sort({ date: -1 }).toArray();

    const formattedPending = pending.map((item) => ({
      id: item._id.toString(),
      userId: item.userId?.toString() || item.userId,
      siteId: item.siteId?.toString() || item.siteId,
      date: item.date || item.timestamp,
      status: item.status,
      photoUri: item.photoUri || item.photoUrl,
      gpsLat: item.gpsLat ? String(item.gpsLat) : null,
      gpsLon: item.gpsLon ? String(item.gpsLon) : null,
      shiftSlot: item.shiftSlot,
      approvalStatus: item.approvalStatus,
      approvedBy: item.approvedBy,
      approvedAt: item.approvedAt,
      location: item.location,
    }));

    res.json({
      success: true,
      pending: formattedPending,
      count: formattedPending.length,
    });
  } catch (error) {
    console.error('Get pending attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or reject attendance (Supervisor)
app.patch('/api/attendance/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, supervisorId, reason } = req.body || {};
    
    if (typeof approved !== 'boolean' || !supervisorId) {
      return res.status(400).json({ error: 'approved (boolean) and supervisorId are required' });
    }

    const attendance = attendanceCollection();
    const now = new Date();
    
    const attendanceId = typeof id === 'string' && id.length === 24 ? new ObjectId(id) : new ObjectId(id);
    
    const updated = await attendance.findOneAndUpdate(
      { _id: attendanceId },
      {
        $set: {
          approvalStatus: approved ? 'approved' : 'rejected',
          approvedBy: supervisorId.toString(),
          approvedAt: now,
          status: approved ? 'present' : 'absent',
          ...(reason && { rejectionReason: reason }),
        }
      },
      { returnDocument: 'after' }
    );

    if (!updated.value) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const formattedUpdated = {
      id: updated.value._id.toString(),
      userId: updated.value.userId?.toString() || updated.value.userId,
      siteId: updated.value.siteId?.toString() || updated.value.siteId,
      date: updated.value.date || updated.value.timestamp,
      status: updated.value.status,
      photoUri: updated.value.photoUri || updated.value.photoUrl,
      gpsLat: updated.value.gpsLat ? String(updated.value.gpsLat) : null,
      gpsLon: updated.value.gpsLon ? String(updated.value.gpsLon) : null,
      shiftSlot: updated.value.shiftSlot,
      approvalStatus: updated.value.approvalStatus,
      approvedBy: updated.value.approvedBy,
      approvedAt: updated.value.approvedAt,
      location: updated.value.location,
    };

    res.json({
      success: true,
      attendance: formattedUpdated,
      message: approved ? 'Attendance approved' : 'Attendance rejected',
    });
  } catch (error) {
    console.error('Approve attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== TASK ASSIGNMENT API ====================

// Engineer: Create task and assign to supervisor
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, time, location, priority, siteId, assignedToSupervisorId, createdByEngineerId } = req.body || {};
    
    if (!title || !siteId || !assignedToSupervisorId || !createdByEngineerId) {
      return res.status(400).json({ error: 'title, siteId, assignedToSupervisorId, and createdByEngineerId are required' });
    }

    // Get supervisor name
    const users = usersCollection();
    const supervisor = await users.findOne({ _id: new ObjectId(assignedToSupervisorId.toString()) });

    const tasks = db.collection('tasks');
    const task = {
      title,
      time: time || new Date().toISOString(),
      location: location || '',
      status: 'pending',
      priority: priority || 'medium',
      siteId: siteId.toString(),
      assignedToSupervisorId: assignedToSupervisorId.toString(),
      createdByEngineerId: createdByEngineerId.toString(),
      supervisor: supervisor?.name || 'Supervisor',
      supervisorAvatar: '👨‍💼',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const inserted = await tasks.insertOne(task);

    res.status(201).json({
      success: true,
      task: { ...task, id: inserted.insertedId.toString(), _id: inserted.insertedId.toString() },
      message: 'Task created and assigned to supervisor',
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supervisor: Assign task to labour
app.patch('/api/tasks/:id/assign-labour', async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedToLabourId, supervisorId } = req.body || {};
    
    if (!assignedToLabourId || !supervisorId) {
      return res.status(400).json({ error: 'assignedToLabourId and supervisorId are required' });
    }

    const tasks = db.collection('tasks');
    const taskId = typeof id === 'string' && id.length === 24 ? new ObjectId(id) : new ObjectId(id);
    
    // Verify task is assigned to this supervisor
    const existingTask = await tasks.findOne({ _id: taskId });
    
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (existingTask.assignedToSupervisorId?.toString() !== supervisorId.toString()) {
      return res.status(403).json({ error: 'You are not assigned to this task' });
    }

    // Update task with labour assignment
    const updated = await tasks.findOneAndUpdate(
      { _id: taskId },
      {
        $set: {
          assignedToLabourId: assignedToLabourId.toString(),
          updatedAt: new Date(),
        }
      },
      { returnDocument: 'after' }
    );

    if (!updated.value) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      task: { ...updated.value, id: updated.value._id.toString() },
      message: 'Task assigned to labour',
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks (for labour, supervisor, engineer)
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId, role, siteId } = req.query;
    
    const tasks = db.collection('tasks');
    let query = {};
    
    if (role === 'labour' && userId) {
      // Labour sees tasks assigned to them
      query = { assignedToLabourId: userId.toString() };
    } else if (role === 'site_supervisor' && userId) {
      // Supervisor sees tasks assigned to them
      query = { assignedToSupervisorId: userId.toString() };
    } else if ((role === 'junior_engineer' || role === 'senior_engineer') && userId) {
      // Engineer sees tasks they created
      query = { createdByEngineerId: userId.toString() };
    }
    
    if (siteId) {
      query.siteId = siteId.toString();
    }

    const taskList = await tasks.find(query).sort({ date: -1 }).toArray();

    const formattedTasks = taskList.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      time: task.time,
      location: task.location,
      status: task.status,
      priority: task.priority,
      siteId: task.siteId,
      assignedToSupervisorId: task.assignedToSupervisorId,
      assignedToLabourId: task.assignedToLabourId,
      createdByEngineerId: task.createdByEngineerId,
      supervisor: task.supervisor,
      supervisorAvatar: task.supervisorAvatar,
      date: task.date,
    }));

    res.json({
      success: true,
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task status
app.patch('/api/tasks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const tasks = db.collection('tasks');
    const taskId = typeof id === 'string' && id.length === 24 ? new ObjectId(id) : new ObjectId(id);
    
    const updated = await tasks.findOneAndUpdate(
      { _id: taskId },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        }
      },
      { returnDocument: 'after' }
    );

    if (!updated.value) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      task: { ...updated.value, id: updated.value._id.toString() },
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== MATERIAL FLOW API ENDPOINTS ====================

// Create material request (Engineer)
app.post('/api/materials/request', async (req, res) => {
  try {
    const {
      materialName,
      quantity,
      unit,
      notes,
      siteId,
      requestedBy,
      requestedByName,
      requestedByRole,
      priority,
    } = req.body || {};

    if (!materialName || !quantity || !unit || !siteId || !requestedBy) {
      return res.status(400).json({
        success: false,
        message: 'materialName, quantity, unit, siteId, and requestedBy are required',
      });
    }

    const resolvedRole = requestedByRole || (await resolveUserRole(requestedBy));
    if (resolvedRole !== 'engineer' && resolvedRole !== 'junior_engineer' && resolvedRole !== 'senior_engineer') {
      return res.status(403).json({
        success: false,
        message: 'Only site engineers can submit material requests',
      });
    }

    const requests = materialRequestsCollection();
    const request = {
      materialName,
      quantity: Number(quantity),
      unit,
      notes: notes || '',
      priority: priority || 'medium',
      siteId,
      requestedBy,
      requestedByName: requestedByName || 'Unknown',
      requestedByRole: resolvedRole,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const inserted = await requests.insertOne(request);
    return res.json({
      success: true,
      request: { ...request, _id: inserted.insertedId.toString() },
    });
  } catch (err) {
    console.error('Material request error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch pending material requests (Manager/Owner)
app.get('/api/materials/pending', async (req, res) => {
  try {
    const { approverId, approverRole, siteId } = req.query || {};
    const resolvedRole = approverRole || (await resolveUserRole(approverId));
    // Normalize the role to match database structure (site_manager → supervisor)
    const normalizedResolvedRole = normalizeRole(resolvedRole);

    // site_manager is actually supervisor in the database
    if (!['owner', 'supervisor'].includes(normalizedResolvedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers or owners can view pending requests',
      });
    }

    const requests = materialRequestsCollection();
    const query = { status: 'pending' };
    if (siteId) query.siteId = String(siteId);

    const list = await requests.find(query).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, requests: list.map(r => ({ ...r, _id: r._id.toString() })) });
  } catch (err) {
    console.error('Pending materials error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch material requests created by a specific engineer
app.get('/api/materials/mine', async (req, res) => {
  try {
    const { requestedBy, siteId } = req.query || {};
    if (!requestedBy) {
      return res.status(400).json({ success: false, message: 'requestedBy is required' });
    }

    const requests = materialRequestsCollection();
    const query = { requestedBy: String(requestedBy) };
    if (siteId) query.siteId = String(siteId);

    const list = await requests.find(query).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, requests: list.map(r => ({ ...r, _id: r._id.toString() })) });
  } catch (err) {
    console.error('My materials error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Approve or reject material request (Manager/Owner)
app.patch('/api/materials/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, approvedByName, approverRole, rejectionReason } = req.body || {};

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const resolvedRole = approverRole || (await resolveUserRole(approvedBy));
    // Normalize the role to match database structure (site_manager → supervisor)
    const normalizedResolvedRole = normalizeRole(resolvedRole);

    // site_manager is actually supervisor in the database
    if (!['owner', 'supervisor'].includes(normalizedResolvedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers or owners can approve or reject requests',
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const requests = materialRequestsCollection();
    const update = {
      status,
      approvedBy,
      approvedByName: approvedByName || 'Unknown',
      approvalTimestamp: new Date(),
      rejectionReason: status === 'rejected' ? rejectionReason : null,
      updatedAt: new Date(),
    };

    const updated = await requests.findOneAndUpdate(
      { _id: new ObjectId(id), status: 'pending' },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!updated.value) {
      return res.status(409).json({ success: false, message: 'Request is already finalized or not found' });
    }

    return res.json({
      success: true,
      request: { ...updated.value, _id: updated.value._id.toString() },
    });
  } catch (err) {
    console.error('Update material request error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== STOCK TRACKING API ====================

// Get all stock items for a site
app.get('/api/stock/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    const stock = stockCollection();
    const items = await stock.find({ siteId: String(siteId) }).sort({ createdAt: -1 }).toArray();
    
    return res.json({
      success: true,
      items: items.map(item => ({
        id: item._id.toString(),
        siteId: item.siteId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minThreshold: item.minThreshold,
        location: item.location,
        notes: item.notes,
        lastUpdated: item.lastUpdated || item.createdAt,
        createdAt: item.createdAt,
      }))
    });
  } catch (err) {
    console.error('Get stock error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add new stock item
app.post('/api/stock', async (req, res) => {
  try {
    const { siteId, name, category, quantity, unit, minThreshold, location, notes } = req.body || {};
    
    if (!siteId || !name || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'siteId, name, and quantity are required' });
    }

    const stock = stockCollection();
    const newItem = {
      siteId: String(siteId),
      name: String(name).trim(),
      category: category ? String(category).trim() : 'General',
      quantity: Number(quantity),
      unit: unit ? String(unit).trim() : 'units',
      minThreshold: minThreshold ? Number(minThreshold) : 0,
      location: location ? String(location).trim() : '',
      notes: notes ? String(notes).trim() : '',
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    const result = await stock.insertOne(newItem);
    
    return res.json({
      success: true,
      item: {
        id: result.insertedId.toString(),
        ...newItem,
      }
    });
  } catch (err) {
    console.error('Add stock error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update stock item
app.put('/api/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, unit, minThreshold, location, notes } = req.body || {};
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    const stock = stockCollection();
    const update = { lastUpdated: new Date() };
    
    if (name !== undefined) update.name = String(name).trim();
    if (category !== undefined) update.category = String(category).trim();
    if (quantity !== undefined) update.quantity = Number(quantity);
    if (unit !== undefined) update.unit = String(unit).trim();
    if (minThreshold !== undefined) update.minThreshold = Number(minThreshold);
    if (location !== undefined) update.location = String(location).trim();
    if (notes !== undefined) update.notes = String(notes).trim();

    const result = await stock.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    return res.json({
      success: true,
      item: {
        id: result.value._id.toString(),
        ...result.value,
      }
    });
  } catch (err) {
    console.error('Update stock error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete stock item
app.delete('/api/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    const stock = stockCollection();
    const result = await stock.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    return res.json({ success: true, message: 'Stock item deleted successfully' });
  } catch (err) {
    console.error('Delete stock error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== GST BILLING API ====================

// Get all bills for a site
app.get('/api/bills/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    const bills = billsCollection();
    const billList = await bills.find({ siteId: String(siteId) }).sort({ createdAt: -1 }).toArray();
    
    return res.json({
      success: true,
      bills: billList.map(bill => ({
        id: bill._id.toString(),
        siteId: bill.siteId,
        amount: bill.amount,
        reason: bill.reason,
        billImageUrl: bill.billImageUrl,
        ocrData: bill.ocrData,
        gstNumber: bill.gstNumber,
        vendorName: bill.vendorName,
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        createdAt: bill.createdAt,
        createdBy: bill.createdBy,
      }))
    });
  } catch (err) {
    console.error('Get bills error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get bills for a specific supervisor (filtered by createdBy)
app.get('/api/bills/supervisor/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { siteId } = req.query || {};
    
    if (!supervisorId) {
      return res.status(400).json({ success: false, message: 'supervisorId is required' });
    }

    const bills = billsCollection();
    const query = { createdBy: String(supervisorId) };
    
    // Optionally filter by siteId if provided
    if (siteId) {
      query.siteId = String(siteId);
    }
    
    const billList = await bills.find(query).sort({ createdAt: -1 }).toArray();
    
    return res.json({
      success: true,
      bills: billList.map(bill => ({
        id: bill._id.toString(),
        siteId: bill.siteId,
        amount: bill.amount,
        reason: bill.reason,
        billImageUrl: bill.billImageUrl,
        createdAt: bill.createdAt,
        createdBy: bill.createdBy,
      }))
    });
  } catch (err) {
    console.error('Get supervisor bills error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add new bill
app.post('/api/bills', async (req, res) => {
  try {
    const { siteId, amount, reason, billImageUrl, ocrData, gstNumber, vendorName, billNumber, billDate, createdBy } = req.body || {};
    
    if (!siteId || !amount || !reason) {
      return res.status(400).json({ success: false, message: 'siteId, amount, and reason are required' });
    }

    const bills = billsCollection();
    const newBill = {
      siteId: String(siteId),
      amount: Number(amount),
      reason: String(reason).trim(),
      billImageUrl: billImageUrl || null,
      ocrData: ocrData || null,
      gstNumber: gstNumber ? String(gstNumber).trim() : null,
      vendorName: vendorName ? String(vendorName).trim() : null,
      billNumber: billNumber ? String(billNumber).trim() : null,
      billDate: billDate ? new Date(billDate) : new Date(),
      createdAt: new Date(),
      createdBy: createdBy || null,
    };

    const result = await bills.insertOne(newBill);
    
    return res.json({
      success: true,
      bill: {
        id: result.insertedId.toString(),
        ...newBill,
      }
    });
  } catch (err) {
    console.error('Add bill error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update bill
app.put('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, billImageUrl, ocrData, gstNumber, vendorName, billNumber, billDate } = req.body || {};
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    const bills = billsCollection();
    const update = {};
    
    if (amount !== undefined) update.amount = Number(amount);
    if (reason !== undefined) update.reason = String(reason).trim();
    if (billImageUrl !== undefined) update.billImageUrl = billImageUrl;
    if (ocrData !== undefined) update.ocrData = ocrData;
    if (gstNumber !== undefined) update.gstNumber = gstNumber ? String(gstNumber).trim() : null;
    if (vendorName !== undefined) update.vendorName = vendorName ? String(vendorName).trim() : null;
    if (billNumber !== undefined) update.billNumber = billNumber ? String(billNumber).trim() : null;
    if (billDate !== undefined) update.billDate = billDate ? new Date(billDate) : new Date();

    const result = await bills.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    return res.json({
      success: true,
      bill: {
        id: result.value._id.toString(),
        ...result.value,
      }
    });
  } catch (err) {
    console.error('Update bill error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete bill
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    const bills = billsCollection();
    const result = await bills.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    return res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (err) {
    console.error('Delete bill error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// OCR endpoint for bill scanning (basic implementation - can be enhanced with actual OCR service)
app.post('/api/bills/ocr', async (req, res) => {
  try {
    const { imageUrl, imageBase64 } = req.body || {};
    
    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ success: false, message: 'imageUrl or imageBase64 is required' });
    }

    // TODO: Integrate actual OCR service (e.g., Google Vision API, Tesseract.js, etc.)
    // For now, return a placeholder response
    // In production, you would:
    // 1. Process the image with OCR service
    // 2. Extract text, amounts, GST numbers, dates, etc.
    // 3. Return structured data
    
    return res.json({
      success: true,
      ocrData: {
        extractedText: 'OCR processing would extract text from the bill image here',
        amount: null,
        gstNumber: null,
        vendorName: null,
        billNumber: null,
        billDate: null,
        note: 'OCR feature requires integration with an OCR service. Please enter details manually or upload image for record keeping.',
      }
    });
  } catch (err) {
    console.error('OCR error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== SERVER START ====================

connectDb()
  .then(() => app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API listening on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Access from device: http://172.16.3.248:${PORT}`);
    console.log(`💻 Access from localhost: http://localhost:${PORT}`);
  }))
  .catch((err) => {
    console.error('MongoDB connection failed', err.message);
    console.error('Please verify MONGODB_URI in your .env file');
    process.exit(1);
  });
