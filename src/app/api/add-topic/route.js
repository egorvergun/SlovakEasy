// src/app/api/add-topic/route.js

import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req) {
  console.log('Prijatá POST požiadavka na /api/add-topic');

  // Parsovanie údajov formulára z požiadavky
  const formData = await req.formData();

  // Získanie názvu témy
  const title = formData.get('title');
  if (!title) {
    return NextResponse.json({ message: 'Názov témy je povinný.' }, { status: 400 });
  }

  // Vytvorenie adresára pre nahrávanie, ak neexistuje
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Adresár pre nahrávanie zabezpečený:', uploadDir);
  } catch (err) {
    console.error('Chyba pri vytváraní adresára pre nahrávanie:', err);
    return NextResponse.json({ message: 'Serverová chyba.' }, { status: 500 });
  }

  const blocks = [];

  // Spracovanie blokov
  for (let index = 0; index < 10; index++) {
    const sk = formData.get(`blocks[${index}][sk]`);
    const uk = formData.get(`blocks[${index}][uk]`);
    const imageFile = formData.get(`blocks[${index}][image]`);

    if (!sk || !uk || !imageFile || typeof imageFile === 'string') {
      console.error(`Nedostatok údajov v bloku ${index}`);
      return NextResponse.json({ message: `Vyplňte všetky polia v bloku ${index + 1}.` }, { status: 400 });
    }

    // Uloženie obrázkového súboru
    const ext = path.extname(imageFile.name);
    const newFilename = `${title}_block${index + 1}${ext}`;
    const newPath = path.join(uploadDir, newFilename);

    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(newPath, buffer);
      console.log(`Obrázok uložený: ${newPath}`);
    } catch (err) {
      console.error('Chyba pri ukladaní obrázka:', err);
      return NextResponse.json({ message: 'Chyba pri ukladaní obrázka.' }, { status: 500 });
    }

    blocks.push({
      src: `uploads/${newFilename}`,
      sk,
      uk,
    });
  }

  if (blocks.length !== 10) {
    console.error('Nesprávny počet blokov:', blocks.length);
    return NextResponse.json({ message: 'Má byť 10 blokov.' }, { status: 400 });
  }

  // Čítanie existujúcich údajov
  const dataFilePath = path.join(process.cwd(), 'public', 'data.json');
  let data = { topics: [] };

  try {
    if (await fs.stat(dataFilePath)) {
      const jsonData = await fs.readFile(dataFilePath, 'utf8');
      data = JSON.parse(jsonData);
      console.log('Existujúce údaje načítané.');
    }
  } catch (readErr) {
    if (readErr.code !== 'ENOENT') {
      console.error('Chyba pri čítaní data.json:', readErr);
      return NextResponse.json({ message: 'Chyba pri čítaní údajov.' }, { status: 500 });
    }

  }

  // Pridanie novej témy
  data.topics.push({
    title,
    images: blocks,
  });
  console.log('Nová téma pridaná:', title);

  // Uloženie aktualizovaných údajov
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Údaje úspešne uložené v data.json');
  } catch (writeErr) {
    console.error('Chyba pri zápise do data.json:', writeErr);
    return NextResponse.json({ message: 'Chyba pri ukladaní údajov.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Téma úspešne pridaná.' }, { status: 200 });
}