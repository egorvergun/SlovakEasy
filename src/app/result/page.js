'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const time = searchParams.get('time') || 'Neposkytuje sa';
  const imagesCompleted = searchParams.get('images') || '0';
  const correct = searchParams.get('correct') || '0';
  const topicIndex = searchParams.get('topic') || '0';
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
      .then((data) => setTopics(data.topics))
      .catch((error) => {
        console.error('Chyba pri načítavaní tém:', error);
      });

    const images = JSON.parse(sessionStorage.getItem('correctImages')) || [];
    setCorrectImages(images);
  }, []);

  return (
    <div className="result-container">
      <h1 className="result-title">Výsledok</h1>
      <div className="result-card">
        <p className="result-topic">Téma: {topics[topicIndex]?.title || 'Neposkytuje sa'}</p>
        <p className="result-score">
          Správne odpovede: <span className="highlight">{correct}</span> z {imagesCompleted}
        </p>
        <p className="result-time">Čas: {time}</p>
      </div>
      <button className="go-to-topics-button" onClick={goToTopics}>
        Vrátiť sa k témam
      </button>
    </div>
  );
}

export default function Result() {
  return (
    <Suspense fallback={<div>Načítavam výsledok...</div>}>
      <ResultContent />
    </Suspense>
  );
}