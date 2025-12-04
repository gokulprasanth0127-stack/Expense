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

  const { userId = 'default_user' } = req.query;

  try {
    // Initialize table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      )
    `;

    if (req.method === 'GET') {
      // Get all friends for user
      const { rows } = await sql`
        SELECT name FROM friends 
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `;
      
      const friends = rows.map(row => row.name);
      return res.status(200).json(friends);
    }

    if (req.method === 'POST') {
      // Add new friend
      const { name } = req.body;

      try {
        await sql`
          INSERT INTO friends (user_id, name)
          VALUES (${userId}, ${name})
        `;
        return res.status(201).json({ name });
      } catch (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(400).json({ error: 'Friend already exists' });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      // Delete friend
      const { name } = req.query;
      
      await sql`
        DELETE FROM friends 
        WHERE user_id = ${userId} AND name = ${name}
      `;

      return res.status(200).json({ message: 'Friend deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
