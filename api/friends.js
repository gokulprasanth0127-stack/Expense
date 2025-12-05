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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get userId from authentication token
  const userId = getUserFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }

  const friendsKey = `user:${userId}:friends`;

  try {
    if (req.method === 'GET') {
      // Get all friends for user
      const friends = await redis.smembers(friendsKey);
      return res.status(200).json(friends || []);
    }

    if (req.method === 'POST') {
      // Add new friend
      const { name } = req.body;

      // Check if friend already exists
      const exists = await redis.sismember(friendsKey, name);
      if (exists) {
        return res.status(400).json({ error: 'Friend already exists' });
      }

      // Add friend to set
      await redis.sadd(friendsKey, name);
      return res.status(201).json({ name });
    }

    if (req.method === 'DELETE') {
      // Delete friend
      const { name } = req.query;
      await redis.srem(friendsKey, name);
      return res.status(200).json({ message: 'Friend deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
