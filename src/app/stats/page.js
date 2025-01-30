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
  const [selectedTopic, setSelectedTopic] = useState('Všetky');
  const [topicNames, setTopicNames] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/topics');
      return;
    }

    const fetchData = async () => {
      try {
        // Načítanie data.json
        const dataResponse = await fetch('/data.json');
        const data = await dataResponse.json();
        setTopicNames(data.topics.map(topic => topic.title));

        // Načítanie štatistiky študentov
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
          setError(statsData.message || 'Chyba pri získavaní štatistiky.');
        }
      } catch (err) {
        setError('Chyba pri načítavaní dát.');
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
    setTopics(['Všetky', ...Array.from(allTopics)]);
  };

  const filteredStats = selectedTopic === 'Všetky' 
    ? stats 
    : stats.filter(stat => 
        stat.completedTopics.includes(selectedTopic) || stat.currentTopic === selectedTopic
      );

  if (!user || user.role !== 'teacher') {
    return <div className="redirect-message">Presmerovanie na inú stránku...</div>;
  }

  return (
    <div className="stats-container">
      <button onClick={() => router.push('/topics')} className="back-button">
        Vrátiť sa k témam
      </button>
      <h1 className="stats-title">Študentská štatistika</h1>
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
                    <p><span>Téma:</span> {topicNames[result.topicIndex] || 'Neznáma téma'}</p>
                    <p><span>Dátum:</span> {new Date(result.date).toLocaleString()}</p>
                    <p><span>Čas:</span> {result.time}</p>
                    <p><span>Dokončené obrázky:</span> {result.imagesCompleted}</p>
                    <p><span>Správne odpovede:</span> {result.correctAnswers}</p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-stats">Žiadne dostupné štatistiky.</p>
      )}
    </div>
  );
}