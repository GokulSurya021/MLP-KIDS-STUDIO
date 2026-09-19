import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('mlp_user');
    const token = localStorage.getItem('mlp_token');
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.email?.toLowerCase() === 'gokulsurya021@gmail.com') {
          parsed.role = 'admin';
          localStorage.setItem('mlp_user', JSON.stringify(parsed));
        }
        setUser(parsed);

        // Fetch fresh profile from backend
        api.get('/auth/profile').then(res => {
          if (res.data?.user) {
            const freshUser = res.data.user;
            if (freshUser.email?.toLowerCase() === 'gokulsurya021@gmail.com') {
              freshUser.role = 'admin';
            }
            localStorage.setItem('mlp_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        }).catch(() => {});
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    if (userData.email?.toLowerCase() === 'gokulsurya021@gmail.com') {
      userData.role = 'admin';
    }
    localStorage.setItem('mlp_token', token);
    localStorage.setItem('mlp_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, phone, password) => {
    const res = await api.post('/auth/register', { name, email, phone, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('mlp_token', token);
    localStorage.setItem('mlp_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('mlp_token');
    localStorage.removeItem('mlp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
