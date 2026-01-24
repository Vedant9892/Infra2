const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const PORT = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('Missing MONGODB_URI in environment');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let db;
let dbClient;
async function connectDb() {
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  try {
    await client.connect();
    dbClient = client;
    db = client.db('infratrace');
    await db.collection('users').createIndex({ phoneNumber: 1 }, { unique: true });
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
const getConstructionDb = () => {
  if (!dbClient) throw new Error('DB client not initialized');
  return dbClient.db('construction-app');
};

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

    // Create new user
    const newUser = {
      phoneNumber,
      role,
      profileCompleted: false,
      createdAt: new Date()
    };
    const inserted = await users.insertOne(newUser);
    const userId = inserted.insertedId.toString();
    const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      userId,
      token,
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

    // Verify role matches
    if (user.role !== role) {
      return res.status(400).json({
        success: false,
        message: `This account is registered as ${user.role}, not ${role}`
      });
    }

    const userId = user._id.toString();
    const token = jwt.sign({ id: userId, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      userId,
      token,
      user: {
        _id: userId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePhoto: user.profilePhoto,
        location: user.location,
        profileCompleted: user.profileCompleted
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
      const newUser = { phoneNumber, role, profileCompleted: false, createdAt: new Date() };
      const inserted = await users.insertOne(newUser);
      user = { ...newUser, _id: inserted.insertedId };
    }
    return res.json({ success: true, userId: user._id.toString(), profileCompleted: !!user.profileCompleted });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.phoneNumber) {
      const user = await usersCollection().findOne({ phoneNumber: req.body.phoneNumber });
      return res.json({ success: true, userId: user._id.toString(), profileCompleted: !!user.profileCompleted });
    }
    console.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Complete user profile (updated to include email, mobile, skills)
app.post('/api/users/complete-profile', async (req, res) => {
  try {
    const { userId, name, email, phoneNumber, profilePhoto, skills } = req.body || {};
    if (!userId || !name || !profilePhoto) {
      return res.status(400).json({ success: false, message: 'userId, name, and profilePhoto are required' });
    }

    const users = usersCollection();
    const updateData = {
      name,
      profilePhoto,
      profileCompleted: true
    };

    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (Array.isArray(skills)) updateData.skills = skills;

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

// Join site via code (for labour)
app.post('/api/sites/join', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      console.error('JWT verify error:', e);
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = decoded.id;
    const { siteCode } = req.body;
    if (!siteCode || !userId) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    console.log('Join site request:', { siteCode, userId });
    const constructionDb = getConstructionDb();
    const sites = constructionDb.collection('sites');
    const memberships = constructionDb.collection('sitememberships');
    const site = await sites.findOne({ siteCode: siteCode.toUpperCase(), isActive: true });
    if (!site) {
      console.log('Site not found for code:', siteCode.toUpperCase());
      return res.status(400).json({ error: 'Invalid site code' });
    }
    console.log('Site found:', site.name);
    const userIdObj = new ObjectId(userId);
    const existing = await memberships.findOne({ userId: userIdObj, siteId: site._id });
    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this site' });
    }
    await memberships.insertOne({
      userId: userIdObj,
      siteId: site._id,
      role: 'worker',
      joinedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Membership created successfully');
    res.status(201).json({
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
    res.status(400).json({ error: err.message || 'Failed to join site' });
  }
});

// Get user sites (for labour)
app.get('/api/sites/my-sites', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = new ObjectId(decoded.id);
    const constructionDb = getConstructionDb();
    const memberships = constructionDb.collection('sitememberships');
    const sites = constructionDb.collection('sites');
    const userMemberships = await memberships.find({ userId }).toArray();
    if (userMemberships.length === 0) {
      return res.json([]);
    }
    const siteIds = userMemberships.map((m) => {
      // Handle both ObjectId and string formats
      return m.siteId instanceof ObjectId ? m.siteId : new ObjectId(m.siteId);
    });
    const siteDocs = await sites.find({ _id: { $in: siteIds } }).toArray();
    const siteMap = new Map(siteDocs.map((s) => [s._id.toString(), s]));
    const result = userMemberships
      .filter((m) => {
        const sid = m.siteId instanceof ObjectId ? m.siteId.toString() : m.siteId.toString();
        return siteMap.has(sid);
      })
      .map((m) => {
        const sid = m.siteId instanceof ObjectId ? m.siteId.toString() : m.siteId.toString();
        const site = siteMap.get(sid);
        return {
          _id: site._id.toString(),
          name: site.name,
          description: site.description || '',
          address: site.address,
          role: m.role || 'worker',
          joinedAt: m.joinedAt,
          isActive: site.isActive !== false,
        };
      });
    res.json(result);
  } catch (err) {
    console.error('Get my-sites error:', err);
    res.status(400).json({ error: err.message || 'Failed to fetch sites' });
  }
});

// Site documentation: upload work photo (labour)
app.post('/api/sites/:siteId/documentation', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = new ObjectId(decoded.id);
    const { siteId } = req.params;
    const { photoUrl } = req.body || {};
    if (!siteId || !photoUrl) {
      return res.status(400).json({ error: 'Missing siteId or photoUrl' });
    }
    const constructionDb = getConstructionDb();
    const workphotos = constructionDb.collection('workphotos');
    const siteIdObj = new ObjectId(siteId);
    await workphotos.insertOne({
      siteId: siteIdObj,
      userId,
      photoUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(201).json({ success: true, message: 'Work photo uploaded' });
  } catch (err) {
    console.error('Documentation upload error:', err);
    res.status(400).json({ error: err.message || 'Upload failed' });
  }
});

// ----- Tools (Labour) -----
function authUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.id ? new ObjectId(decoded.id) : null;
  } catch {
    return null;
  }
}

app.get('/api/tools/site/:siteId', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { siteId } = req.params;
    if (!siteId) return res.status(400).json({ error: 'Missing siteId' });
    const constructionDb = getConstructionDb();
    const tools = constructionDb.collection('tools');
    const list = await tools.find({ siteId: new ObjectId(siteId) }).toArray();
    res.json(list.map((t) => ({
      _id: t._id.toString(),
      name: t.name,
      available: t.available !== false,
    })));
  } catch (err) {
    console.error('Tools list error:', err);
    res.status(400).json({ error: err.message || 'Failed to fetch tools' });
  }
});

app.get('/api/tools/my-requests/:siteId', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { siteId } = req.params;
    if (!siteId) return res.status(400).json({ error: 'Missing siteId' });
    const constructionDb = getConstructionDb();
    const requests = constructionDb.collection('toolrequests');
    const tools = constructionDb.collection('tools');
    const list = await requests.find({ userId: uid, siteId: new ObjectId(siteId) }).sort({ createdAt: -1 }).toArray();
    const toolIds = [...new Set(list.map((r) => r.toolId.toString()))];
    const toolDocs = await tools.find({ _id: { $in: toolIds.map((id) => new ObjectId(id)) } }).toArray();
    const toolMap = new Map(toolDocs.map((t) => [t._id.toString(), t]));
    const out = list.map((r) => ({
      _id: r._id.toString(),
      toolId: r.toolId.toString(),
      toolName: toolMap.get(r.toolId.toString())?.name ?? 'Tool',
      requestedDuration: r.requestedDuration,
      status: r.status || 'pending',
      issuedAt: r.issuedAt,
      returnedAt: r.returnedAt,
      createdAt: r.createdAt,
    }));
    res.json(out);
  } catch (err) {
    console.error('My requests error:', err);
    res.status(400).json({ error: err.message || 'Failed to fetch requests' });
  }
});

app.post('/api/tools/request', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { toolId, siteId, requestedDuration } = req.body || {};
    if (!toolId || !siteId) return res.status(400).json({ error: 'Missing toolId or siteId' });
    const constructionDb = getConstructionDb();
    const tools = constructionDb.collection('tools');
    const requests = constructionDb.collection('toolrequests');
    const tool = await tools.findOne({ _id: new ObjectId(toolId), siteId: new ObjectId(siteId) });
    if (!tool) return res.status(400).json({ error: 'Tool not found' });
    const duration = requestedDuration || '1 hour';
    const doc = {
      toolId: new ObjectId(toolId),
      userId: uid,
      siteId: new ObjectId(siteId),
      requestedDuration: duration,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const inserted = await requests.insertOne(doc);
    res.status(201).json({
      _id: inserted.insertedId.toString(),
      toolId,
      toolName: tool.name,
      requestedDuration: duration,
      status: 'pending',
    });
  } catch (err) {
    console.error('Tool request error:', err);
    res.status(400).json({ error: err.message || 'Failed to create request' });
  }
});

app.patch('/api/tools/return/:requestId', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { requestId } = req.params;
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const constructionDb = getConstructionDb();
    const requests = constructionDb.collection('toolrequests');
    const reqId = new ObjectId(requestId);
    const r = await requests.findOne({ _id: reqId, userId: uid });
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.status !== 'issued') return res.status(400).json({ error: 'Tool not issued to you' });
    const returnedAt = new Date();
    await requests.updateOne(
      { _id: reqId },
      { $set: { status: 'returned', returnedAt, updatedAt: returnedAt } }
    );
    res.json({ success: true, returnedAt, status: 'returned' });
  } catch (err) {
    console.error('Tool return error:', err);
    res.status(400).json({ error: err.message || 'Failed to return tool' });
  }
});

app.patch('/api/tools/approve/:requestId', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { requestId } = req.params;
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const constructionDb = getConstructionDb();
    const requests = constructionDb.collection('toolrequests');
    const reqId = new ObjectId(requestId);
    const r = await requests.findOne({ _id: reqId });
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.status !== 'pending') return res.status(400).json({ error: 'Request not pending' });
    const issuedAt = new Date();
    await requests.updateOne(
      { _id: reqId },
      { $set: { status: 'issued', issuedAt, updatedAt: issuedAt } }
    );
    res.json({ success: true, status: 'issued', issuedAt });
  } catch (err) {
    console.error('Tool approve error:', err);
    res.status(400).json({ error: err.message || 'Failed to approve' });
  }
});

app.patch('/api/tools/reject/:requestId', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { requestId } = req.params;
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const constructionDb = getConstructionDb();
    const requests = constructionDb.collection('toolrequests');
    const reqId = new ObjectId(requestId);
    const r = await requests.findOne({ _id: reqId });
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.status !== 'pending') return res.status(400).json({ error: 'Request not pending' });
    const updatedAt = new Date();
    await requests.updateOne(
      { _id: reqId },
      { $set: { status: 'rejected', updatedAt } }
    );
    res.json({ success: true, status: 'rejected' });
  } catch (err) {
    console.error('Tool reject error:', err);
    res.status(400).json({ error: err.message || 'Failed to reject' });
  }
});

app.patch('/api/tools/review-return/:requestId', async (req, res) => {
  try {
    const uid = authUserId(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const { requestId } = req.params;
    const { timeliness, condition, remarks } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const constructionDb = getConstructionDb();
    const requests = constructionDb.collection('toolrequests');
    const reqId = new ObjectId(requestId);
    const r = await requests.findOne({ _id: reqId });
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.status !== 'returned') return res.status(400).json({ error: 'Tool not returned yet' });
    const updatedAt = new Date();
    const update = { updatedAt, returnReviewedAt: updatedAt };
    if (timeliness != null) update.timeliness = timeliness;
    if (condition != null) update.conditionRating = condition;
    if (remarks != null) update.remarks = remarks;
    await requests.updateOne({ _id: reqId }, { $set: update });
    res.json({ success: true });
  } catch (err) {
    console.error('Tool review-return error:', err);
    res.status(400).json({ error: err.message || 'Failed to review' });
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

// Seed default site SPIT-11223 (if not exists)
async function seedDefaultSite() {
  try {
    const constructionDb = getConstructionDb();
    const sites = constructionDb.collection('sites');
    const users = constructionDb.collection('users');
    
    // Check/create default owner
    let owner = await users.findOne({ phone: '0000000000', role: 'owner' });
    if (!owner) {
      const ownerResult = await users.insertOne({
        name: 'System Owner',
        phone: '0000000000',
        email: 'system@infratrace.app',
        role: 'owner',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      owner = { _id: ownerResult.insertedId };
      console.log('✅ Default owner created');
    }
    
    // Check/create default site
    let site = await sites.findOne({ siteCode: 'SPIT-11223' });
    if (!site) {
      const siteInsert = await sites.insertOne({
        siteCode: 'SPIT-11223',
        name: 'SPIT Construction Site',
        description: 'Default construction site',
        address: 'SPIT Construction Site, Mumbai',
        coordinates: { latitude: 19.1136, longitude: 72.8697 },
        ownerId: owner._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      site = { _id: siteInsert.insertedId };
      console.log('✅ Default site SPIT-11223 created');
    }

    // Seed default tools for default site
    const tools = constructionDb.collection('tools');
    const defaultToolNames = ['Hammer', 'Drill', 'Grinder', 'Ladder', 'Welding Machine', 'Safety Helmet'];
    for (const name of defaultToolNames) {
      const exists = await tools.findOne({ siteId: site._id, name });
      if (!exists) {
        await tools.insertOne({
          siteId: site._id,
          name,
          available: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

connectDb()
  .then(async () => {
    await seedDefaultSite();
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed', err.message);
    console.error('Please verify MONGODB_URI in your .env file');
    process.exit(1);
  });
