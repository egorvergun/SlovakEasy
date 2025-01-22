// src/app/login/page.js

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ email, role: data.role });
        if (callbackUrl.includes('/result')) {
          router.push(callbackUrl);
        } else {
          router.push('/topics');
        }
      } else if (response.status === 404) {
        router.push('/register');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Chyba pri prihlásení:', error);
      setError('Prihlásenie nebolo úspešné.');
    }
  };

  return (
    <div>
      <h2>Prihlásenie</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div>
          <label>Heslo:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button type="submit">Prihlásiť</button>
      </form>
    </div>
  );
}