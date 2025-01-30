import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { headers } = req;
  const authHeader = headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== 'student') {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
    }

    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    let usersData;

    try {
      usersData = fs.readFileSync(usersFilePath, 'utf8');
    } catch (readError) {
      return NextResponse.json({ message: 'Ошибка чтения файла пользователей.' }, { status: 500 });
    }

    let users;
    try {
      users = JSON.parse(usersData);
    } catch (parseError) {
      return NextResponse.json({ message: 'Ошибка парсинга данных пользователей.' }, { status: 500 });
    }

    const student = users.find(user => user.email === decoded.email);

    if (!student) {
      return NextResponse.json({ message: 'Студент не найден.' }, { status: 404 });
    }

    // Удаление дубликатов результатов
    const uniqueResults = Array.from(new Map(student.results.map(item => [item.date, item])).values());

    const studentStats = {
      email: student.email,
      completedTopics: student.completedTopics || [],
      results: uniqueResults,
      currentTopic: student.currentTopic || 'Не задано',
    };

    return NextResponse.json({ studentStats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
  }
}