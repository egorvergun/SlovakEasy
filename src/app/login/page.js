'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import Link from 'next/link';
import '../globals.css';

function LoginContent() {
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
        setUser({ email: data.email, role: data.role, token: data.token });
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
      console.error('Chyba pri prihlasovaní:', error);
      setError('Prihlásenie zlyhalo.');
    }
  };

  return (
    <div className="form-container">
      <h2>Prihlásenie</h2>
      <form onSubmit={handleLogin} className="form-content">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Heslo:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Prihlásiť sa</button>
        <Link href="/register" legacyBehavior>
          <a style={{ color: 'gray', background: 'none', textDecoration: 'none' }}>
            Ak ešte nemáte účet, zaregistrujte sa tu.
          </a>
        </Link>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Načítavam prihlasovanie...</div>}>
      <LoginContent />
    </Suspense>
  );
}