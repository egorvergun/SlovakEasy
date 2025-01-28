'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

export default function EditPage() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState(
    Array.from({ length: 10 }, () => ({ sk: '', uk: '', imageFile: null }))
  );
  const [error, setError] = useState('');

  if (!user || user.role !== 'teacher') {
    router.push('/topics');
    return null;
  }

  const handleBlockChange = (index, field, value) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[index][field] = value;
    setBlocks(updatedBlocks);
  };

  const handleImageChange = (index, file) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[index].imageFile = file;
    setBlocks(updatedBlocks);
  };

  const saveTopic = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('title', title);

    blocks.forEach((block, index) => {
      formData.append(`blocks[${index}][sk]`, block.sk);
      formData.append(`blocks[${index}][uk]`, block.uk);
      if (block.imageFile) {
        formData.append(`blocks[${index}][image]`, block.imageFile);
      }
    });

    try {
      const response = await fetch('/api/add-topic', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Téma bola úspešne pridaná!');
        router.push('/topics');
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
    <div id="edit-page">
      <button onClick={() => router.push('/topics')} className="back-button">
            Vrátiť sa k témam
          </button>
      <h2>Pridať novú tému</h2>
      <form onSubmit={saveTopic}>
        <div>
          <label>Názov témy:</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>
        {blocks.map((block, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h4>Blok {index + 1}</h4>
            <div>
              <label>Slovenský text:</label>
              <textarea 
                value={block.sk}
                onChange={(e) => handleBlockChange(index, 'sk', e.target.value)}
                required 
              />
            </div>
            <div>
              <label>Ukrajinský text:</label>
              <textarea 
                value={block.uk}
                onChange={(e) => handleBlockChange(index, 'uk', e.target.value)}
                required 
              />
            </div>
            <div>
              <label>Obrázok:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleImageChange(index, e.target.files[0])}
                required 
              />
            </div>
          </div>
        ))}
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button type="submit">Uložiť</button>
        <button type="button" onClick={cancelEdit}>Zrušiť</button>
      </form>
    </div>
  );
}