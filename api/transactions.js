import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
