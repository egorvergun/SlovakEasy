// src/pages/api/topics.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'public', 'data.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    res.status(200).json(data);
  } catch (err) {
    console.error('Chyba pri čítaní data.json:', err);
    res.status(500).json({ error: 'Chyba pri čítaní data.json.' });
  }
}