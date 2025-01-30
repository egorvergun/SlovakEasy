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

    if (decoded.role !== 'teacher') {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
    }

    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    let usersData;

    try {
      usersData = fs.readFileSync(usersFilePath, 'utf8');
    } catch (readError) {
      return NextResponse.json({ message: 'Chyba čítania súboru používateľov.' }, { status: 500 });
    }

    let users;
    try {
      users = JSON.parse(usersData);
    } catch (parseError) {
      return NextResponse.json({ message: 'Chyba parsovania údajov používateľov.' }, { status: 500 });
    }

    const teacher = users.find(user => user.email === decoded.email);

    if (!teacher || !teacher.students || teacher.students.length === 0) {
      return NextResponse.json({ message: 'Študenti neboli nájdení.' }, { status: 404 });
    }

    const studentStats = teacher.students.map(studentEmail => {
      const student = users.find(u => u.email === studentEmail);
      if (!student) return null;

      // Odstraňovanie duplicitných výsledkov
      const uniqueResults = Array.from(new Map(student.results.map(item => [item.date, item])).values());

      return {
        email: student.email,
        completedTopics: student.completedTopics || [],
        results: uniqueResults,
        currentTopic: student.currentTopic || 'Nezadáno',
      };
    }).filter(stat => stat !== null);

    return NextResponse.json({ studentStats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token.' }, { status: 401 });
  }
}