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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get userId from authentication token
  const userId = getUserFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }

  const salaryKey = `user:${userId}:salary`;

  try {
    if (req.method === 'GET') {
      // Get salary data
      const salaryData = await redis.get(salaryKey);
      return res.status(200).json(salaryData || { amount: 0, receivedDate: null });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Set or update salary
      const { amount, receivedDate } = req.body;
      const salaryData = {
        amount: Number.parseFloat(amount),
        receivedDate: receivedDate || new Date().toISOString().split('T')[0]
      };
      
      await redis.set(salaryKey, salaryData);
      return res.status(200).json(salaryData);
    }

    if (req.method === 'DELETE') {
      // Clear salary data
      await redis.del(salaryKey);
      return res.status(200).json({ message: 'Salary data cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
