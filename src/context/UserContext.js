// filepath: /c:/Users/vergu/Desktop/bk_pr/src/context/UserContext.js
'use client';

import { createContext, useState, useEffect } from 'react';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({ ...userData, token });
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Chyba pri overovaní používateľa:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, message: error.message };
      }
    } catch (error) {
      console.error('Chyba pri prihlasovaní:', error);
      return { success: false, message: 'Chyba pri prihlasovaní' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  if (loading) {
    return <div>Načítavanie...</div>;
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};