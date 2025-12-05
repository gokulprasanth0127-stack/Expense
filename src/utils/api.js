// API utility functions for backend communication
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = Cookies.get('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Transactions API
export const transactionsAPI = {
  // Get all transactions
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transactions');
    }
    return response.json();
  },

  // Create new transaction
  create: async (transaction) => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transaction)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create transaction');
    }
    return response.json();
  },

  // Delete transaction
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transactions?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete transaction');
    }
    return response.json();
  }
};

// Friends API
export const friendsAPI = {
  // Get all friends
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/friends`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch friends');
    }
    return response.json();
  },

  // Add new friend
  create: async (name) => {
    const response = await fetch(`${API_BASE_URL}/friends`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/friends?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete friend');
    }
    return response.json();
  }
};

// Salary API
export const salaryAPI = {
  // Get salary data
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/salary`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch salary');
    }
    return response.json();
  },

  // Set or update salary
  update: async (amount, receivedDate, previousBalance = 0) => {
    const response = await fetch(`${API_BASE_URL}/salary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, receivedDate, previousBalance })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update salary');
    }
    return response.json();
  },

  // Clear salary data
  clear: async () => {
    const response = await fetch(`${API_BASE_URL}/salary`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear salary');
    }
    return response.json();
  }
};
