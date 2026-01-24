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

    return res.json({
      success: true,
      userId: inserted.insertedId.toString(),
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

    return res.json({
      success: true,
      userId: user._id.toString(),
      user: {
        _id: user._id.toString(),
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

connectDb()
  .then(() => app.listen(PORT, () => console.log(`API listening on ${PORT}`)))
  .catch((err) => {
    console.error('MongoDB connection failed', err.message);
    console.error('Please verify MONGODB_URI in your .env file');
    process.exit(1);
  });
