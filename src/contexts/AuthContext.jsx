import { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(Cookies.get('auth_token'));

  // Fetch current user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = Cookies.get('auth_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth?action=me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setToken(savedToken);
        } else {
          // Token invalid, clear it
          Cookies.remove('auth_token');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        Cookies.remove('auth_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token
      Cookies.set('auth_token', data.token, { expires: 7 });
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token
      Cookies.set('auth_token', data.token, { expires: 7 });
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    Cookies.remove('auth_token');
    setToken(null);
    setUser(null);
  };

  // Helper function to get headers with auth token
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      getAuthHeaders,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
