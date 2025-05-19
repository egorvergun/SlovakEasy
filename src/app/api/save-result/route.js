import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, time, imagesCompleted, correctAnswers, topicIndex, correctImages } = await req.json();

    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    const usersData = await fs.readFile(usersFilePath, 'utf8');
    const users = JSON.parse(usersData);

    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (!Array.isArray(user.results)) {
        user.results = [];
      }

      const isDuplicate = user.results.some(result =>
        result.topicIndex === topicIndex &&
        result.time === time &&
        result.imagesCompleted === imagesCompleted &&
        result.correctAnswers === correctAnswers &&
        JSON.stringify(result.correctImages) === JSON.stringify(correctImages)
      );

      if (isDuplicate) {
        return NextResponse.json({ message: 'Výsledok už bol uložený' }, { status: 400 });
      }

      user.results.push({
        date: new Date().toISOString(),
        time,
        imagesCompleted,
        correctAnswers,
        topicIndex,
        correctImages,
      });

      const uniqueResultsMap = new Map();

      user.results.forEach(result => {
        const key = JSON.stringify({
          topicIndex: result.topicIndex,
          time: result.time,
          imagesCompleted: result.imagesCompleted,
          correctAnswers: result.correctAnswers,
          correctImages: result.correctImages
        });

        if (!uniqueResultsMap.has(key)) {
          uniqueResultsMap.set(key, result);
        }
      });

      user.results = Array.from(uniqueResultsMap.values());

      await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
      return NextResponse.json({ message: 'Výsledok uložený' });
    } else {
      return NextResponse.json({ message: 'Používateľ nenájdený' }, { status: 404 });
    }
  } catch (error) {
    console.error('Chyba pri ukladaní výsledku:', error);
    return NextResponse.json({ message: 'Serverová chyba' }, { status: 500 });
  }
}