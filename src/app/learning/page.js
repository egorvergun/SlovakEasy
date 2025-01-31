'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { UserContext } from '../../context/UserContext';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import '../globals.css';

export default function Learning() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicIndexParam = searchParams.get('topic');
  const topicIndex = parseInt(topicIndexParam, 10); // Преобразование в число
  const { user } = useContext(UserContext);

  const [topics, setTopics] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const correctAnswersRef = useRef(0); // Реф для правильных ответов
  const [correctImages, setCorrectImages] = useState([]);
  const [progress, setProgress] = useState([]);
  const [resultSaved, setResultSaved] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetch('/api/topics')
      .then(response => response.json())
      .then(data => setTopics(data.topics))
      .catch(error => {
        console.error('Chyba pri načítaní tém:', error);
        setMessage('Nepodarilo sa načítať témy. Prosím, skúste to neskôr.');
      });
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Проверка, что topicIndex является валидным числом и находится в пределах массива topics
  const validTopicIndex = !isNaN(topicIndex) && topicIndex >= 0 && topicIndex < topics.length;

  const images = validTopicIndex ? (topics[topicIndex]?.images?.slice(0, 10) || []) : [];
  const img = images[currentImageIndex] || {};

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const saveProgress = (topicTitle, imageSrc) => {
    console.log(`Progres uložený pre tému: ${topicTitle}, obrázok: ${imageSrc}`);
  };

  const nextImageWithRef = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prevIndex => prevIndex + 1);
      setMessage('');
      setRecognizedText('');
    } else {
      const endTime = Date.now();
      const timeTaken = endTime - startTimeRef.current;
      const formattedTime = formatTime(timeTaken);

      sessionStorage.setItem('correctImages', JSON.stringify(correctImages));

      console.log('Переход на страницу результатов с correctAnswersRef.current:', correctAnswersRef.current);
      
      router.push(
        `/result?time=${formattedTime}&images=${images.length}&correct=${correctAnswersRef.current}&topic=${topicIndex}`
      );
    }
  }, [currentImageIndex, images.length, correctImages, router, topicIndex]);

  const saveResult = useCallback(async () => {
    if (user && !resultSaved) {
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
    }
  }, [user, resultSaved, correctAnswers, progress, topicIndex, images.length]);

  const playSound = (lang) => {
    const text = lang === 'sk' ? img?.sk : img?.uk;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'sk') {
      utterance.lang = 'sk-SK';
    } else {
      const voices = window.speechSynthesis.getVoices();
      const ukVoice = voices.find(voice => voice.lang === 'uk-UA' && voice.name.includes('Google'));
      if (ukVoice) {
        utterance.voice = ukVoice;
      }
      utterance.lang = 'uk-UA';
    }

    speechSynthesis.speak(utterance);
  };

  const startRecognition = useCallback(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'sk-SK';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const resultsLength = event.results.length - 1;
        let transcript = event.results[resultsLength][0].transcript.toLowerCase();

        transcript = transcript.replace(/\.$/, '');

        setRecognizedText(transcript);
        console.log('Rozpoznané:', transcript);

        if (transcript.trim() === img.sk.toLowerCase()) {
          setMessage('Výborne, správne ste vyslovili slovo!');
          saveProgress(topics[topicIndex].title, img.src);

          setCorrectAnswers((prev) => {
            const newCount = prev + 1;
            correctAnswersRef.current = newCount;
            console.log('correctAnswersRef.current:', correctAnswersRef.current);
            return newCount;
          });

          setCorrectImages((prev) => [...prev, img.src]);

          setProgress((prevProgress) => {
            const newProgress = [...prevProgress];
            newProgress[currentImageIndex] = true;
            return newProgress;
          });

          setShowPopup(true);
          stopRecognition(); 

          setTimeout(() => {
            setShowPopup(false);
            console.log('Переходим к следующему изображению с correctAnswersRef.current:', correctAnswersRef.current);
            nextImageWithRef();
          }, 3000);
        } else {
          setMessage('Skúste to znova.');
        }
      };

      recognition.onerror = (event) => {
        console.error('Rozpoznávanie reči chyba:', event.error);
        setMessage('Chyba pri rozpoznávaní reči.');
      };

      recognition.onend = () => {
        setIsRecognizing(false);
        stopAudioLevelMonitoring();
        console.log('Rozpoznávanie reči skončilo');
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecognizing(true);
        startAudioLevelMonitoring();
        console.log('Rozpoznávanie reči začalo');
      } catch (error) {
        console.error('Chyba pri spustení rozpoznávania reči:', error);
      }
    } else {
      alert('Váš prehliadač nepodporuje rozpoznávanie reči.');
    }
  }, [img, currentImageIndex, images.length, nextImageWithRef, saveResult, isRecognizing, topics, topicIndex]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecognizing(false);
    stopAudioLevelMonitoring();
    console.log('Rozpoznávanie reči zastavené');
  }, []);

  const toggleRecognition = () => {
    if (isRecognizing) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const startAudioLevelMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      draw();
    } catch (err) {
      console.error('Chyba pri monitorovaní audia:', err);
    }
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (dataArrayRef.current) {
      dataArrayRef.current = null;
    }
    setAudioLevel(0);
    console.log('Monitorovanie úrovne audia zastavené');
  }, []);

  const draw = useCallback(() => {
    animationFrameIdRef.current = requestAnimationFrame(draw);
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const sample = dataArrayRef.current[i] / 128 - 1;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);
      const level = Math.min(Math.floor(rms * 100), 100);
      setAudioLevel(level);
    }
  }, []);

  // Удалите useEffect, который обновляет correctAnswersRef.current
  // useEffect(() => {
  //   correctAnswersRef.current = correctAnswers;
  // }, [correctAnswers]);

  useEffect(() => {
    return () => {
      stopAudioLevelMonitoring();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [stopAudioLevelMonitoring]);

  return (
    <div className="learning-container">
      { !validTopicIndex || !topics[topicIndex] ? (
        <div className="error-message">Téma nebola nájdená</div>
      ) : (
        <>
          <h1 className="learning-title">Učenie témy: {topics[topicIndex]?.title}</h1>
          <div className="progress-bar">
            {images.map((_, index) => (
              <div
                key={index}
                className={`progress-circle ${progress[index] ? 'correct' : 'incorrect'} ${index === currentImageIndex ? 'current' : ''}`}
              ></div>
            ))}
          </div>
          <div className="image-container">
            {img.src ? <img src={`/${img.src}`} alt="Obrázok" className="learning-image" /> : <div className="loading">Čakanie na obrázok...</div>}
          </div>
          <div className="button-group">
            <button className="sound-button" onClick={() => playSound('sk')}>Slovenský</button>
            <button className="sound-button" onClick={() => playSound('uk')}>Ukrajinský</button>
          </div>
          
          <div className="toggle-button-container">
            <button
              onClick={toggleRecognition}
              className={`toggle-recognition-button ${isRecognizing ? 'active' : 'inactive'}`}>
              {isRecognizing ? <FaMicrophoneSlash color="white" size={24} /> : <FaMicrophone color="green" size={24} />}
            </button>
          </div>

          <div className="message">{message}</div>
          <div className="recognized-text">{recognizedText}</div>
          <button className="next-image-button" onClick={nextImageWithRef}>Ďalší obrázok</button>
          <div className="audio-level">
            <div className="audio-level-bar" style={{ width: `${audioLevel}%` }}></div>
          </div>
          <button onClick={() => router.push('/topics')} className="back-button">
            Vrátiť sa k témam
          </button>
          {showPopup && (
            <div className="popup">
              <div className="popup-content">
                <img src={"/runningDog.gif"} alt="pes" className="popup-image" />
                <p>Výborne!</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}