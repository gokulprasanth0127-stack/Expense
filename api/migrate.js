import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

// Initialize Redis client
const redis = new Redis({
  url: process.env.expense_KV_REST_API_URL || process.env.expense_KV_URL,
  token: process.env.expense_KV_REST_API_TOKEN,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Helper to get userId from token
function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get userId from authentication token
  const userId = getUserFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }

  try {
    // Get existing default user data
    const oldTransactions = await redis.get('user:default_user:transactions');
    const oldFriends = await redis.smembers('user:default_user:friends');
    const oldSalary = await redis.get('user:default_user:salary');
    const oldCounter = await redis.get('user:default_user:transaction_counter');

    // Copy to new user
    const promises = [];

    if (oldTransactions && oldTransactions.length > 0) {
      promises.push(redis.set(`user:${userId}:transactions`, oldTransactions));
    }

    if (oldFriends && oldFriends.length > 0) {
      for (const friend of oldFriends) {
        promises.push(redis.sadd(`user:${userId}:friends`, friend));
      }
    }

    if (oldSalary) {
      promises.push(redis.set(`user:${userId}:salary`, oldSalary));
    }

    if (oldCounter) {
      promises.push(redis.set(`user:${userId}:transaction_counter`, oldCounter));
    }

    await Promise.all(promises);

    return res.status(200).json({ 
      success: true, 
      message: 'Data migrated successfully',
      migrated: {
        transactions: oldTransactions?.length || 0,
        friends: oldFriends?.length || 0,
        salary: !!oldSalary
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}
