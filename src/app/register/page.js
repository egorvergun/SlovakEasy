'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
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
        // Nastavenie používateľa v kontexte
        setUser({ email, role: data.role });
        // Presmerovanie na stránku výberu tém
        router.push(data.role === 'teacher' ? '/add-topic' : '/topics');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Chyba registrácie:', error);
      setError('Pri registrácii došlo k chybe.');
    }
  };

  return (
    <div>
      <h2>Registrácia</h2>
      <form onSubmit={handleRegister}>
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
        <button type="submit">Zaregistrovať sa</button>
      </form>
    </div>
  );
}