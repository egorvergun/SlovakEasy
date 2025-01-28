'use client';

import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import { FaFilter } from 'react-icons/fa';
import '../globals.css';

export default function TeacherStatsPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Все');
  const [topicNames, setTopicNames] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/topics');
      return;
    }

    const fetchData = async () => {
      try {
        // Загрузка data.json
        const dataResponse = await fetch('/data.json');
        const data = await dataResponse.json();
        setTopicNames(data.topics.map(topic => topic.title));

        // Загрузка статистики студентов
        const statsResponse = await fetch('/api/teacher-stats', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        const statsData = await statsResponse.json();

        if (statsResponse.ok) {
          setStats(statsData.studentStats);
          extractTopics(statsData.studentStats);
        } else {
          setError(statsData.message || 'Ошибка при получении статистики.');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных.');
      }
    };

    fetchData();
  }, [user, router]);

  const extractTopics = (studentStats) => {
    const allTopics = new Set();
    studentStats.forEach(stat => {
      allTopics.add(stat.currentTopic);
      stat.completedTopics.forEach(topic => allTopics.add(topic));
    });
    setTopics(['Все', ...Array.from(allTopics)]);
  };

  const filteredStats = selectedTopic === 'Все' 
    ? stats 
    : stats.filter(stat => 
        stat.completedTopics.includes(selectedTopic) || stat.currentTopic === selectedTopic
      );

  if (!user || user.role !== 'teacher') {
    return <div>Перенаправление на другую страницу...</div>;
  }

  return (
    <div className="stats-container">
      <button onClick={() => router.push('/topics')} className="back-button">
            Vrátiť sa k témam
          </button>
      <h1>Статистика студентов</h1>
      {error && <p className="error">{error}</p>}
      {filteredStats.length > 0 ? (
        <ul className="stats-list">
          {filteredStats.map((stat, index) => (
            <li key={index} className="stat-item">
              <h3>{stat.email}</h3>
              <p>Результаты:</p>
              <ul>
                {stat.results.map((result, idx) => (
                  <li key={idx}>
                    Тема: {topicNames[result.topicIndex] || 'Неизвестная тема'}, 
                    Дата: {new Date(result.date).toLocaleString()}, 
                    Время: {result.time}, 
                    Завершено изображений: {result.imagesCompleted}, 
                    Правильные ответы: {result.correctAnswers}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>Нет доступной статистики.</p>
      )}
    </div>
  );
}