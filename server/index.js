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

app.post('/api/users/complete-profile', async (req, res) => {
  try {
    const { userId, name, profilePhoto } = req.body || {};
    if (!userId || !name || !profilePhoto) {
      return res.status(400).json({ success: false, message: 'userId, name, and profilePhoto are required' });
    }
    const users = usersCollection();
    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { name, profilePhoto, profileCompleted: true } },
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

connectDb()
  .then(() => app.listen(PORT, () => console.log(`API listening on ${PORT}`)))
  .catch((err) => {
    console.error('MongoDB connection failed', err.message);
    console.error('Please verify MONGODB_URI in your .env file');
    process.exit(1);
  });
