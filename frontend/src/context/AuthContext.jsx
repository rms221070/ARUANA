import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); // Initialize as null, load from storage in useEffect
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from localStorage with retry logic for mobile
        let storedToken = localStorage.getItem('auth_token');
        
        // If no token found, wait a bit and try again (mobile can be slow)
        if (!storedToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
          storedToken = localStorage.getItem('auth_token');
        }
        
        if (storedToken) {
          setToken(storedToken); // Set token immediately
          
          try {
            const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
            } else {
              // Token invalid, clear it
              console.warn('Token validation failed, clearing auth');
              localStorage.removeItem('auth_token');
              setToken(null);
              setUser(null);
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            // Don't clear token on network error, might be temporary
            console.warn('Network error during auth check, keeping token for retry');
          }
        }
      } catch (error) {
        console.error('Error reading auth token:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [BACKEND_URL]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem('auth_token', data.access_token);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, userType = 'user') => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          user_type: userType 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      
      // Auto login after registration
      if (data.success) {
        return await login(email, password);
      }
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const isAdmin = () => {
    return user?.user_type === 'admin';
  };

  // Helper function to get current token (with fallback to localStorage)
  const getToken = () => {
    if (token) return token;
    // Fallback: try to get from localStorage directly (for cases where state hasn't updated yet)
    return localStorage.getItem('auth_token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    getToken, // Expose helper function
    isAuthenticated: !!user || !!token // Consider authenticated if we have a token, even if user data hasn't loaded yet
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};