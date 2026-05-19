import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nova_token'));
  const [loading, setLoading] = useState(true);

  // App start pe check karo — token valid hai ya nahi
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  function login(userData, userToken) {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('nova_token', userToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
    // Clear all user specific chat histories
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ai_chat_history_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('nova_token');
    localStorage.removeItem('ai_chat_history');
    localStorage.removeItem('nova_preferences');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
