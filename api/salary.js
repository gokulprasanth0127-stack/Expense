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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId = 'default_user' } = req.query;
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
