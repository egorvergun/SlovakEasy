'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import Link from "next/link";
import '../globals.css';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ email });
        router.push('/choose-role');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Chyba registrácie:', error);
      setError('Pri registrácii došlo k chybe.');
    }
  };

  return (
    <div className="form-container">
      <h2>Registrácia</h2>
      <form onSubmit={handleRegister} className="form-content">
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
        <button type="submit">Zaregistrovať sa</button>
        <Link href="/login" legacyBehavior>
          <a style={{ color: 'gray', background: 'none', textDecoration: 'none' }}>
            Ak už máte účet, prihláste sa tu.
          </a>
        </Link>
      </form>
    </div>
  );
}