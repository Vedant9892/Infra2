/**
 * Script to create a site owner account for Vasantdada Patil College
 * Phone: 111111
 * Role: site_owner
 * 
 * Run: node scripts/create-owner-account.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ Missing MONGODB_URI in environment');
  process.exit(1);
}

async function createOwnerAccount() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('infratrace');
    const users = db.collection('users');
    
    const phoneNumber = '111111';
    const role = 'site_owner'; // Frontend sends 'site_owner', DB stores as 'owner' or 'site_owner'
    
    // Check if user already exists
    const existingUser = await users.findOne({ phoneNumber: phoneNumber });
    
    if (existingUser) {
      console.log(`⚠️  User with phone ${phoneNumber} already exists:`);
      console.log(`   ID: ${existingUser._id.toString()}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Profile Completed: ${existingUser.profileCompleted || false}`);
      
      // Update role if needed
      if (existingUser.role !== 'site_owner' && existingUser.role !== 'owner') {
        await users.updateOne(
          { _id: existingUser._id },
          { $set: { role: 'site_owner', updatedAt: new Date() } }
        );
        console.log(`✅ Updated role to 'site_owner'`);
      }
      
      return {
        success: true,
        userId: existingUser._id.toString(),
        phoneNumber: phoneNumber,
        role: existingUser.role,
        message: 'User already exists, role updated if needed'
      };
    }
    
    // Create new user
    const newUser = {
      phoneNumber: phoneNumber,
      role: 'site_owner', // Store as 'site_owner' to match frontend
      profileCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(newUser);
    
    console.log('✅ Site Owner Account Created Successfully!');
    console.log(`   User ID: ${result.insertedId.toString()}`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Name: Vasantdada Patil College`);
    console.log('');
    console.log('📱 Login Instructions:');
    console.log(`   1. Open the app`);
    console.log(`   2. Select "Site Owner" role`);
    console.log(`   3. Enter phone: ${phoneNumber}`);
    console.log(`   4. Enter OTP (will be sent to phone)`);
    console.log(`   5. Complete profile if prompted`);
    
    return {
      success: true,
      userId: result.insertedId.toString(),
      phoneNumber: phoneNumber,
      role: newUser.role,
      message: 'Account created successfully'
    };
    
  } catch (error) {
    console.error('❌ Error creating owner account:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  createOwnerAccount()
    .then((result) => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createOwnerAccount };
