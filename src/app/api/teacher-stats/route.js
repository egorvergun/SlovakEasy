import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  const { headers } = req;
  const authHeader = headers.get('authorization');

  console.log('Получен Authorization заголовок:', authHeader);

  if (!authHeader) {
    console.log('Отсутствует Authorization заголовок. Возвращаю 401.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== 'teacher') {
      console.log('Пользователь не является учителем. Возвращаю 403.');
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    let usersData;
    try {
      usersData = await fs.readFile(usersFilePath, 'utf8');
      console.log('Файл users.json успешно прочитан.');
    } catch (readError) {
      console.error('Ошибка чтения файла users.json:', readError);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }

    let users;
    try {
      users = JSON.parse(usersData);
      console.log('Файл users.json успешно распарсен.');
    } catch (parseError) {
      console.error('Ошибка парсинга файла users.json:', parseError);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }

    const teacher = users.find(user => user.email === decoded.email);
    console.log('Найден учитель:', teacher);

    if (!teacher || !teacher.students || teacher.students.length === 0) {
      console.log('У учителя нет студентов. Возвращаю 404.');
      return NextResponse.json({ message: 'No students found.' }, { status: 404 });
    }

    const studentStats = teacher.students.map(studentEmail => {
      const student = users.find(user => user.email === studentEmail);
      if (student) {
        return {
          email: student.email,
          completedTopics: student.completedTopics,
          results: student.results || []
        };
      }
      return null;
    }).filter(stat => stat !== null);

    console.log('Собранная статистика студентов:', studentStats);

    return NextResponse.json({ studentStats }, { status: 200 });
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return NextResponse.json({ message: 'Invalid token.' }, { status: 403 });
  }
}