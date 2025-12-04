import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.expense_KV_REST_API_URL || process.env.expense_KV_URL,
  token: process.env.expense_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId = 'default_user' } = req.query;
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
