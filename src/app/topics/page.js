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
    if (!user) {
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
    return <p className="redirect-message">Načítava sa...</p>;
  }

  return (
    <div id="topic-selection">
      <h2 className="topics-title">Vyberte tému na učenie</h2>
      <div id="topic-list" className="topic-list">
        {topics.length > 0 ? (
          topics.map((topic, index) => (
            <div key={index} className="topic-card">
              <h3 className="topic-title">{topic.title}</h3>
              <button className="start-learning-button" onClick={() => startLearning(index)}>
                Začať učenie
              </button>
            </div>
          ))
        ) : (
          <p className="no-topics">Žiadne dostupné témy.</p>
        )}
      </div>
      {user.role === 'teacher' && (
        <div id="teacher-buttons" className="teacher-buttons">
          <button className="add-topic-button" onClick={showAddTopicForm}>Pridať novú tému</button>
          <button className="stats-button" onClick={() => router.push('/stats')}>Štatistika študentov</button>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}