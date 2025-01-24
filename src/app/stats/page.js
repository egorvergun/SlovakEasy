'use client';

import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function TeacherStatsPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      console.log('User not authorized or not a teacher. Redirecting...');
      router.push('/topics');
      return;
    }
  
    const fetchStats = async () => {
      console.log('JWT_SECRET:', process.env.JWT_SECRET);
      try {
        console.log('Sending request to API with token:', user.token);
        const response = await fetch('/api/teacher-stats', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
  
        console.log('API Response Status:', response.status);
        const data = await response.json();
        console.log('API Response Data:', data);
  
        if (response.ok) {
          setStats(data.studentStats);
        } else {
          setError(data.message || 'Ошибка при получении статистики.');
        }
      } catch (err) {
        console.error('API Request Error:', err);
        setError('Ошибка при получении статистики.');
      }
    };
  
    fetchStats();
  }, [user, router]);

  if (!user || user.role !== 'teacher') {
    return <div>Перенаправление на другую страницу...</div>;
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {stats.length > 0 ? (
        <ul>
          {stats.map((stat, index) => (
            <li key={index}>
              <p>Электронная почта: {stat.email}</p>
              <p>Пройденные темы: {stat.completedTopics.length > 0 ? stat.completedTopics.join(', ') : 'Нет данных'}</p>
              <p>Результаты:</p>
              <ul>
                {stat.results.map((result, idx) => (
                  <li key={idx}>
                    Дата: {new Date(result.date).toLocaleString()}, Время: {result.time}, Завершено изображений: {result.imagesCompleted}, Правильные ответы: {result.correctAnswers}
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