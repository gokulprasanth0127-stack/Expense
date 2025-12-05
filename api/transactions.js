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

  const transactionsKey = `user:${userId}:transactions`;
  const counterKey = `user:${userId}:transaction_counter`;

  try {
    if (req.method === 'GET') {
      // Get all transactions for user
      const transactionsData = await redis.get(transactionsKey);
      const transactions = transactionsData || [];
      
      // Sort by date (newest first)
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return res.status(200).json(transactions);
    }

    if (req.method === 'POST') {
      // Add new transaction
      const { date, desc, amount, category, paidBy, splitAmong } = req.body;

      // Get current transactions
      const transactionsData = await redis.get(transactionsKey);
      const transactions = transactionsData || [];

      // Generate new ID
      const newId = await redis.incr(counterKey);

      const newTransaction = {
        id: newId,
        date,
        desc,
        amount: Number.parseFloat(amount),
        category,
        paidBy,
        splitAmong
      };

      // Add transaction to array
      transactions.push(newTransaction);

      // Save back to Redis
      await redis.set(transactionsKey, transactions);

      return res.status(201).json(newTransaction);
    }

    if (req.method === 'DELETE') {
      // Delete transaction
      const { id } = req.query;
      
      // Get current transactions
      const transactionsData = await redis.get(transactionsKey);
      const transactions = transactionsData || [];

      // Filter out the transaction to delete
      const updatedTransactions = transactions.filter(t => t.id !== Number.parseInt(id));

      // Save back to Redis
      await redis.set(transactionsKey, updatedTransactions);

      return res.status(200).json({ message: 'Transaction deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
