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
  const [selectedTopic, setSelectedTopic] = useState('Všetko');
  const [topicNames, setTopicNames] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Nahrávanie data.json
        const dataResponse = await fetch('/data.json');
        const data = await dataResponse.json();
        setTopicNames(data.topics.map(topic => topic.title));

        // Určenie API koncového bodu v závislosti od role
        const apiEndpoint = user.role === 'teacher' ? '/api/teacher-stats' : '/api/student-stats';

        // Nahrávanie štatistiky
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
    setTopics(['Všetko', ...Array.from(allTopics)]);
  };

  const filteredStats = selectedTopic === 'Všetko' 
    ? stats 
    : stats.filter(stat => 
        stat.completedTopics.includes(selectedTopic) || stat.currentTopic === selectedTopic
      );

  if (!user) {
    return <div className="redirect-message">Presmerovanie na inú stránku...</div>;
  }

  return (
    <div className="stats-container">
      <button onClick={() => router.push('/topics')} className="back-button">
        Vrátiť sa k témam
      </button>
      <h1 className="stats-title">Štatistika</h1>
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
        <div className="stats-columns" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {filteredStats.map((stat, index) => (
            <div key={index} className="stat-column" style={{ flex: '1 1 250px', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
              <h3 className="student-email">{stat.email}</h3>
              {stat.results.map((result, idx) => (
                <div key={idx} className="result-card" style={{ marginBottom: '1rem', background: '#f9f9f9', padding: '0.5rem', borderRadius: '4px' }}>
                  <p><span>Téma:</span> {topicNames[result.topicIndex] || 'Neznáma téma'}</p>
                  <p><span>Dátum:</span> {new Date(result.date).toLocaleString()}</p>
                  <p><span>Čas:</span> {result.time}</p>
                  <p><span>Dokončené obrázky:</span> {result.imagesCompleted}</p>
                  <p><span>Správne odpovede:</span> {result.correctAnswers}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-stats">Žiadna dostupná štatistika.</p>
      )}
    </div>
  );
}