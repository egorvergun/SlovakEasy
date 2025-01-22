'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

export default function TopicSelection() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("User objekt:", user);
    if (!user) {
      // Ak používateľ nie je autorizovaný, presmerovať na prihlasovaciu stránku
      router.push('/login');
    } else {
      fetch('/api/topics')
        .then(response => {
          if (!response.ok) {
            throw new Error('Chyba siete');
          }
          return response.json();
        })
        .then(data => setTopics(data.topics))
        .catch(err => setError('Chyba načítania tém.'));
    }
  }, [user, router]);

  const startLearning = (index) => {
    router.push(`/learning?topic=${index}`);
  };

  const showAddTopicForm = () => {
    router.push('/edit');
  };

  if (!user) {
    return <p>Načítava sa...</p>;
  }

  return (
    <div id="topic-selection">
      <h2>Vyberte tému na učenie</h2>
      <div id="topic-list">
        {topics.length > 0 ? (
          topics.map((topic, index) => (
            <button key={index} onClick={() => startLearning(index)}>
              {topic.title}
            </button>
          ))
        ) : (
          <p>Žiadne dostupné témy.</p>
        )}
      </div>
      {user.role === 'teacher' && (
        <div id="teacher-buttons">
          <button onClick={showAddTopicForm}>Pridať novú tému</button>
          <button onClick={() => router.push('/stats')}>Статистика учеников</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}