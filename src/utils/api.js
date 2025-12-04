// API utility functions for backend communication

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api';

const USER_ID = 'default_user'; // Simple user identification - can be enhanced with auth later

// Transactions API
export const transactionsAPI = {
  // Get all transactions
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions?userId=${USER_ID}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  // Create new transaction
  create: async (transaction) => {
    const response = await fetch(`${API_BASE_URL}/transactions?userId=${USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return response.json();
  },

  // Delete transaction
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transactions?userId=${USER_ID}&id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
    return response.json();
  }
};

// Friends API
export const friendsAPI = {
  // Get all friends
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/friends?userId=${USER_ID}`);
    if (!response.ok) throw new Error('Failed to fetch friends');
    return response.json();
  },

  // Add new friend
  create: async (name) => {
    const response = await fetch(`${API_BASE_URL}/friends?userId=${USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add friend');
    }
    return response.json();
  },

  // Delete friend
  delete: async (name) => {
    const response = await fetch(`${API_BASE_URL}/friends?userId=${USER_ID}&name=${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete friend');
    return response.json();
  }
};

// Salary API
export const salaryAPI = {
  // Get salary data
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/salary?userId=${USER_ID}`);
    if (!response.ok) throw new Error('Failed to fetch salary');
    return response.json();
  },

  // Set or update salary
  update: async (amount, receivedDate) => {
    const response = await fetch(`${API_BASE_URL}/salary?userId=${USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receivedDate })
    });
    if (!response.ok) throw new Error('Failed to update salary');
    return response.json();
  },

  // Clear salary data
  clear: async () => {
    const response = await fetch(`${API_BASE_URL}/salary?userId=${USER_ID}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear salary');
    return response.json();
  }
};
