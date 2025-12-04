import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId = 'default_user' } = req.query; // Simple user identification

  try {
    
    // Initialize table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        paid_by VARCHAR(100) NOT NULL,
        split_among TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    if (req.method === 'GET') {
      // Get all transactions for user
      const { rows } = await sql`
        SELECT * FROM transactions 
        WHERE user_id = ${userId}
        ORDER BY date DESC, created_at DESC
      `;
      
      // Transform to match frontend format
      const transactions = rows.map(row => ({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        desc: row.description,
        amount: parseFloat(row.amount),
        category: row.category,
        paidBy: row.paid_by,
        splitAmong: JSON.parse(row.split_among)
      }));

      return res.status(200).json(transactions);
    }

    if (req.method === 'POST') {
      // Add new transaction
      const { date, desc, amount, category, paidBy, splitAmong } = req.body;

      const { rows } = await sql`
        INSERT INTO transactions (user_id, date, description, amount, category, paid_by, split_among)
        VALUES (${userId}, ${date}, ${desc}, ${amount}, ${category}, ${paidBy}, ${JSON.stringify(splitAmong)})
        RETURNING *
      `;

      const newTransaction = {
        id: rows[0].id,
        date: rows[0].date.toISOString().split('T')[0],
        desc: rows[0].description,
        amount: parseFloat(rows[0].amount),
        category: rows[0].category,
        paidBy: rows[0].paid_by,
        splitAmong: JSON.parse(rows[0].split_among)
      };

      return res.status(201).json(newTransaction);
    }

    if (req.method === 'DELETE') {
      // Delete transaction
      const { id } = req.query;
      
      await sql`
        DELETE FROM transactions 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      return res.status(200).json({ message: 'Transaction deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
