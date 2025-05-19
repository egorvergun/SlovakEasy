// filepath: /c:/Users/vergu/Desktop/bk_pr/src/context/UserContext.js
'use client';

import { createContext, useState, useEffect } from 'react';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decodedToken = parseJwt(token);
          if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
            // Проверяем валидность токена на сервере
            const response = await fetch('/api/user', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser({
                email: userData.email,
                role: userData.role,
                token: token,
                completedTopics: userData.completedTopics || []
              });
            } else {
              localStorage.removeItem('token');
              setUser(null);
            }
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Chyba pri inicializácii používateľa:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const updateUser = (newUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserData
    }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Nesprávny formát tokenu');
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Nepodarilo sa dekódovať JWT:', e);
      return null;
    }
  };

  if (loading) {
    return <div>Načítavanie...</div>;
  }

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};