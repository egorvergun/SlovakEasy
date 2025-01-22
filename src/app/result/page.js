// src/app/result/page.js

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

export default function Result() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const time = searchParams.get('time');
  const imagesCompleted = searchParams.get('images');
  const correct = searchParams.get('correct');
  const topicIndex = searchParams.get('topic');
  const { user } = useContext(UserContext);

  const [topics, setTopics] = useState([]);
  const [correctImages, setCorrectImages] = useState([]);
  const [resultSaved, setResultSaved] = useState(false);

  const goToTopics = () => {
    router.push('/topics');
  };

  useEffect(() => {
    fetch('/api/topics')
      .then((response) => response.json())
      .then((data) => setTopics(data.topics));

    const images = JSON.parse(sessionStorage.getItem('correctImages'));
    setCorrectImages(images || []);
  }, []);

  useEffect(() => {
    if (!user) {
      // Presmerovanie na prihlasovaciu stránku s uložením aktuálnej URL
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    } else if (!resultSaved) {
      const saveResult = async () => {
        try {
          await fetch('/api/save-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              time,
              imagesCompleted: Number(imagesCompleted),
              correctAnswers: Number(correct),
              topicIndex: Number(topicIndex),
              correctImages,
            }),
          });
          setResultSaved(true);
        } catch (error) {
          console.error('Chyba pri ukladaní výsledku:', error);
        }
      };
      saveResult();
    }
  }, [user, resultSaved]);

  if (!user) {
    return <div>Presmerovanie na prihlasovaciu stránku...</div>;
  }

  return (
    <div>
      <h1>Výsledok</h1>
      <p>Téma: {topics[topicIndex]?.title || 'N/A'}</p>
      <p>
        Správne odpovede: {correct} z {imagesCompleted}
      </p>
      <p>Čas: {time}</p>

      <button onClick={goToTopics}>Vrátiť sa k témam</button>
    </div>
  );
}