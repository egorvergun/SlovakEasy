'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

export default function EditPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [images, setImages] = useState([
    { sk: '', uk: '', imageFile: null },
  ]);
  const [error, setError] = useState('');

  const handleImageChange = (index, field, value) => {
    const updatedImages = [...images];
    updatedImages[index][field] = value;
    setImages(updatedImages);
  };

  const addImage = () => {
    setImages([...images, { sk: '', uk: '', imageFile: null }]);
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  const saveTopic = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация изображений
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (!image.sk || !image.uk || !image.imageFile) {
        setError(`Vyplňte všetky polia v obrázku ${i + 1}.`);
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', title);

    images.forEach((image, index) => {
      formData.append(`images[${index}][sk]`, image.sk);
      formData.append(`images[${index}][uk]`, image.uk);
      formData.append(`images[${index}][image]`, image.imageFile);
    });

    try {
      const response = await fetch('/api/add-topic', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Téma bola úspešne pridaná!');
        router.push('/topics'); // Перенаправление на страницу тем
      } else {
        const data = await response.json();
        setError(data.message || 'Chyba pri ukladaní témy.');
      }
    } catch (err) {
      console.error('Chyba:', err);
      setError('Vyskytla sa chyba pri ukladaní témy.');
    }
  };

  const cancelEdit = () => {
    router.push('/topics');
  };

  return (
    <div className="form-container">
      <h2>Pridať novú tému</h2>
      <form onSubmit={saveTopic} className="form-content">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>Názov témy:</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>
        {images.map((image, index) => (
          <div key={index} className="image-box">
            <h3>Obrázok {index + 1}</h3>
            <div className="form-group">
              <label>Slovenský text:</label>
              <textarea 
                value={image.sk}
                onChange={(e) => handleImageChange(index, 'sk', e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Ukrajinský text:</label>
              <textarea 
                value={image.uk}
                onChange={(e) => handleImageChange(index, 'uk', e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label>Obrázok:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleImageChange(index, 'imageFile', e.target.files[0])}
                required 
              />
            </div>
            {images.length > 1 && (
              <button type="button" className="remove-button" onClick={() => removeImage(index)}>Odstrániť obrázok</button>
            )}
          </div>
        ))}
        <button type="button" className="add-button" onClick={addImage}>Pridať ďalší obrázok</button>
        <div className="button-group">
          <button type="submit" className="submit-button">Uložiť</button>
          <button type="button" className="cancel-button" onClick={cancelEdit}>Zrušiť</button>
        </div>
      </form>
    </div>
  );
}