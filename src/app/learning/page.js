'use client';

import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import '../globals.css';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'; 
import runningDog from '../../../public/runningDog.gif';

export default function Learning() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicIndex = searchParams.get('topic');
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
  const [correctImages, setCorrectImages] = useState([]);
  const [progress, setProgress] = useState(Array(10).fill(false));
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

  const images = topics[topicIndex]?.images.slice(0, 10) || [];
  const img = images[currentImageIndex];

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const saveProgress = (topicTitle, imageSrc) => {
    console.log(`Progres uložený pre tému: ${topicTitle}, obrázok: ${imageSrc}`);
    // Ďalej: môžete uložiť progres na server alebo do lokálneho úložiska
  };

  const nextImage = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prevIndex => prevIndex + 1);
      setMessage('');
      setRecognizedText('');
    } else {
      const endTime = Date.now();
      const timeTaken = endTime - startTimeRef.current;
      const formattedTime = formatTime(timeTaken);

      sessionStorage.setItem('correctImages', JSON.stringify(correctImages));

      router.push(
        `/result?time=${formattedTime}&images=${images.length}&correct=${correctAnswers}&topic=${topicIndex}`
      );
    }
  }, [currentImageIndex, images.length, correctAnswers, correctImages, router, topicIndex]);

  const saveResult = useCallback(async () => {
    if (user && !resultSaved) {
      try {
        const response = await fetch('/api/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            time: formatTime(Date.now() - startTimeRef.current),
            imagesCompleted: images.length,
            correctAnswers: correctAnswers,
            topicIndex: Number(topicIndex),
            correctImages: progress,
          }),
        });
        if (response.ok) {
          setResultSaved(true);
          console.log('Výsledok úspešne uložený');
        } else {
          console.error('Chyba pri ukladaní výsledku:', response.statusText);
          setMessage('Nepodarilo sa uložiť výsledok. Prosím, skúste to neskôr.');
        }
      } catch (error) {
        console.error('Chyba pri ukladaní výsledku:', error);
        setMessage('Nepodarilo sa uložiť výsledok. Prosím, skúste to neskôr.');
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

          setCorrectAnswers((prev) => prev + 1);
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
          }, 3000);

          nextImage();
        } else {
          setMessage('Skúste to znova.');
        }
      };

      recognition.onerror = (event) => {
        console.error('Chyba rozpoznávania reči:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMessage('Prístup k mikrofónu je zakázaný. Prosím, povoľte používanie mikrofónu v nastaveniach vášho prehliadača.');
          setIsRecognizing(false);
        } else {
          setMessage('Došlo k chybe pri rozpoznávaní reči. Skúste to znova.');
        }
      };

      recognition.onend = () => {
        if (isRecognizing) {
          recognition.start();
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecognizing(true);
        startAudioLevelMonitoring();
        console.log('Rozpoznávanie reči začalo');
      } catch (error) {
        console.error('Chyba pri spustení rozpoznávania reči:', error);
        setMessage('Nepodarilo sa spustiť rozpoznávanie reči.');
      }
    } else {
      alert('Váš prehliadač nepodporuje rozpoznávanie reči.');
    }
  }, [img, currentImageIndex, images.length, nextImage, saveResult, isRecognizing, topics, topicIndex]);

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
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      source.connect(analyserRef.current);
      draw();
      console.log('Monitorovanie úrovne audia začalo');
    } catch (err) {
      console.error('Chyba pri prístupe k mikrofónu pre monitorovanie úrovne audia:', err);
      setMessage('Nepodarilo sa získať prístup k mikrofónu pre monitorovanie úrovne audia.');
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
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const average = sum / dataArrayRef.current.length;
      setAudioLevel(Math.min(average, 100));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioLevelMonitoring();
    };
  }, [stopAudioLevelMonitoring]);

  return (
    <div id="learning-page">
      { !topics[topicIndex] ? (
        <div>Téma nebola nájdená</div>
      ) : (
        <>
          <h1>Učenie témy: {topics[topicIndex]?.title}</h1>
          <div className="progress-bar">
            {images.map((_, index) => (
              <div
                key={index}
                className={`progress-circle ${progress[index] ? 'correct' : 'incorrect'} ${index === currentImageIndex ? 'current' : ''}`}
              ></div>
            ))}
          </div>
          <div className="image-container">
            <img src={`/${img.src}`} alt="Obrázok" />
          </div>
          <div className="button-group">
            <button onClick={() => playSound('sk')}>Slovenský</button>
            <button onClick={() => playSound('uk')}>Ukrajinský</button>
          </div>
          
          {/* Toggle Recognition Button */}
          <div className="toggle-button-container">
            <button
              onClick={toggleRecognition}
              className={`toggle-recognition-button ${isRecognizing ? 'active' : 'inactive'}`}>
              {isRecognizing ? <FaMicrophoneSlash color="black" size={24} /> : <FaMicrophone color="green" size={24} />}
            </button>
          </div>

          <div id="message">{message}</div>
          <div id="recognized-text">{recognizedText}</div>
          <button onClick={nextImage}>Ďalší obrázok</button>
          <div id="audio-level">
            <div id="audio-level-bar" style={{ width: `${audioLevel}%` }}></div>
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