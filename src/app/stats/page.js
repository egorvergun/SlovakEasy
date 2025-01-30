'use client';

import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import { FaFilter } from 'react-icons/fa';
import '../globals.css';

export default function StatsPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('Всё');
  const [topicNames, setTopicNames] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Загрузка data.json
        const dataResponse = await fetch('/data.json');
        const data = await dataResponse.json();
        setTopicNames(data.topics.map(topic => topic.title));

        // Определение API маршрута в зависимости от роли
        const apiEndpoint = user.role === 'teacher' ? '/api/teacher-stats' : '/api/student-stats';

        // Загрузка статистики
        const statsResponse = await fetch(apiEndpoint, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        const statsData = await statsResponse.json();

        if (statsResponse.ok) {
          if (user.role === 'teacher') {
            setStats(statsData.studentStats);
            extractTopics(statsData.studentStats);
          } else {
            setStats([statsData.studentStats]);
            extractTopics([statsData.studentStats]);
          }
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
    setTopics(['Всё', ...Array.from(allTopics)]);
  };

  const filteredStats = selectedTopic === 'Всё' 
    ? stats 
    : stats.filter(stat => 
        stat.completedTopics.includes(selectedTopic) || stat.currentTopic === selectedTopic
      );

  if (!user) {
    return <div className="redirect-message">Перенаправление на другую страницу...</div>;
  }

  return (
    <div className="stats-container">
      <button onClick={() => router.push('/topics')} className="back-button">
        Вернуться к темам
      </button>
      <h1 className="stats-title">Статистика</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="filter-section">
        <FaFilter className="filter-icon" />
        <select 
          value={selectedTopic} 
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="filter-select"
        >
          {topics.map((topic, index) => (
            <option key={index} value={topic}>{topic}</option>
          ))}
        </select>
      </div>
      {filteredStats.length > 0 ? (
        <ul className="stats-list">
          {filteredStats.map((stat, index) => (
            <li key={index} className="stat-item">
              <h3 className="student-email">{stat.email}</h3>
              <div className="student-results">
                {stat.results.map((result, idx) => (
                  <div key={idx} className="result-card">
                    <p><span>Тема:</span> {topicNames[result.topicIndex] || 'Неизвестная тема'}</p>
                    <p><span>Дата:</span> {new Date(result.date).toLocaleString()}</p>
                    <p><span>Время:</span> {result.time}</p>
                    <p><span>Завершенные изображения:</span> {result.imagesCompleted}</p>
                    <p><span>Правильные ответы:</span> {result.correctAnswers}</p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-stats">Нет доступной статистики.</p>
      )}
    </div>
  );
}