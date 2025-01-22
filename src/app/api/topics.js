// src/pages/api/topics.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'C:\Users\vergu\Desktop\bk_pr\data.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  res.status(200).json(data);
}