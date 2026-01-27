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

