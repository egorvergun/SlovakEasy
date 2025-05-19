import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitizeTitle(title) {
  return title
    .replace(/[<>:"/\\|?*]+/g, '') 
    .replace(/\s+/g, '_')          
    .toLowerCase();                
}

export async function POST(req) {
  console.log('Prijatá POST požiadavka na /api/add-topic');

  const formData = await req.formData();

  const title = formData.get('title');
  if (!title) {
    return NextResponse.json({ message: 'Je potrebné zadať názov témy.' }, { status: 400 });
  }

  const sanitizedTitle = sanitizeTitle(title);
  const topicDir = path.join(process.cwd(), 'public', 'images', sanitizedTitle);

  try {
    await fs.mkdir(topicDir, { recursive: true });
    console.log('Adresár pre tému vytvorený:', topicDir);
  } catch (err) {
    console.error('Chyba pri vytváraní adresára pre tému:', err);
    return NextResponse.json({ message: 'Chyba servera.', status: 500 });
  }

  const images = [];

  for (let pair of formData.entries()) {
    const [key, value] = pair;
    console.log(`Pole: ${key}, Hodnota:`, value);
  }

  for (let pair of formData.entries()) {
    const [key, value] = pair;
    const imageMatch = key.match(/images\[(\d+)\]\[(sk|uk|image)\]/);
    if (imageMatch) {
      const index = imageMatch[1];
      const field = imageMatch[2];
      if (!images[index]) {
        images[index] = { sk: '', uk: '', imageFile: null };
      }
      images[index][field === 'image' ? 'imageFile' : field] = value;
    }
  }

  const filteredImages = images.filter(image => image.imageFile);

  if (filteredImages.length === 0) {
    return NextResponse.json({ message: 'Je potrebné pridať aspoň jeden obrázok.' }, { status: 400 });
  }

  for (let i = 0; i < filteredImages.length; i++) {
    const image = filteredImages[i];
    if (!image.sk || !image.uk || !image.imageFile) {
      return NextResponse.json(
        { message: `Vyplňte všetky polia v obrázku ${i + 1}.` },
        { status: 400 }
      );
    }
  }

  const imagesData = [];

  for (let i = 0; i < filteredImages.length; i++) {
    const { sk, uk, imageFile } = filteredImages[i];
    const ext = path.extname(imageFile.name);
    const newFilename = `${sanitizedTitle}_image_${Date.now()}_${i + 1}${ext}`;
    const newPath = path.join(topicDir, newFilename);

    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(newPath, buffer);
      console.log(`Obrázok uložený: ${newPath}`);
    } catch (err) {
      console.error('Chyba pri ukladaní obrázka:', err);
      return NextResponse.json(
        { message: 'Chyba pri ukladaní obrázka.' },
        { status: 500 }
      );
    }

    imagesData.push({
      src: `images/${sanitizedTitle}/${newFilename}`,
      sk,
      uk,
    });
  }

  const dataFilePath = path.join(process.cwd(), 'public', 'data.json');
  let data = { topics: [] };

  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf8');
    data = JSON.parse(jsonData);
    console.log('Existujúce dáta načítané.');
  } catch (readErr) {
    if (readErr.code !== 'ENOENT') {
      console.error('Chyba pri čítaní data.json:', readErr);
      return NextResponse.json(
        { message: 'Chyba pri čítaní dát.' },
        { status: 500 }
      );
    }
  }

  data.topics.push({
    title,
    images: imagesData,
  });
  console.log('Nová téma pridaná:', title);

  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Dáta úspešne uložené do data.json');
  } catch (writeErr) {
    console.error('Chyba pri zápise do data.json:', writeErr);
    return NextResponse.json(
      { message: 'Chyba pri ukladaní dát.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Téma úspešne pridaná.' },
    { status: 200 }
  );
}