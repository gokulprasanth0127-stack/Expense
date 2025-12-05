import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Initialize Redis client
const redis = new Redis({
  url: process.env.expense_KV_REST_API_URL || process.env.expense_KV_URL,
  token: process.env.expense_KV_REST_API_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper: Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Helper: Get userId from request
export function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // REGISTER NEW USER
    if (action === 'register' && req.method === 'POST') {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      // Check if user already exists
      const existingUserId = await redis.get(`user:email:${email.toLowerCase()}`);
      if (existingUserId) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user object
      const user = {
        id: userId,
        email: email.toLowerCase(),
        name,
        createdAt: new Date().toISOString()
      };

      // Store user data
      await redis.set(`users:${userId}`, user);
      await redis.set(`users:${userId}:password`, passwordHash);
      await redis.set(`user:email:${email.toLowerCase()}`, userId);

      // Generate token
      const token = generateToken(userId);

      return res.status(201).json({
        success: true,
        token,
        user: { id: userId, email: user.email, name: user.name }
      });
    }

    // LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Get user ID from email
      const userId = await redis.get(`user:email:${email.toLowerCase()}`);
      if (!userId) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get user data and password hash
      const [user, passwordHash] = await Promise.all([
        redis.get(`users:${userId}`),
        redis.get(`users:${userId}:password`)
      ]);

      if (!user || !passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken(userId);

      return res.status(200).json({
        success: true,
        token,
        user: { id: userId, email: user.email, name: user.name }
      });
    }

    // GET CURRENT USER
    if (action === 'me' && req.method === 'GET') {
      const userId = getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await redis.get(`users:${userId}`);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user: { id: userId, email: user.email, name: user.name }
      });
    }

    // LOGOUT (optional - just delete token on frontend)
    if (action === 'logout' && req.method === 'POST') {
      return res.status(200).json({ success: true, message: 'Logged out' });
    }

    return res.status(404).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
