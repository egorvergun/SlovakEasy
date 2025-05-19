import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  const { headers } = req;
  const authHeader = headers.get('authorization');

  console.log('Prijatý Authorization header:', authHeader);

  if (!authHeader) {
    console.log('Chýba Authorization header. Vraciam 401.');
    return NextResponse.json({ message: 'Neautorizovaný' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'your-secure-secret-key';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Dekódovaný token:', decoded);

    if (decoded.role !== 'teacher') {
      console.log('Používateľ nie je učiteľ. Vraciam 403.');
      return NextResponse.json({ message: 'Zakázané' }, { status: 403 });
    }

    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    let usersData;
    try {
      usersData = await fs.readFile(usersFilePath, 'utf8');
      console.log('Súbor users.json úspešne prečítaný.');
    } catch (readError) {
      console.error('Chyba pri čítaní súboru users.json:', readError);
      return NextResponse.json({ message: 'Chyba servera.' }, { status: 500 });
    }

    let users;
    try {
      users = JSON.parse(usersData);
      console.log('Súbor users.json úspešne spracovaný.');
    } catch (parseError) {
      console.error('Chyba pri spracovaní súboru users.json:', parseError);
      return NextResponse.json({ message: 'Chyba servera.' }, { status: 500 });
    }

    const teacher = users.find(user => user.email === decoded.email);
    console.log('Nájdený učiteľ:', teacher);

    if (!teacher || !teacher.students || teacher.students.length === 0) {
      console.log('Učiteľ nemá žiadnych študentov. Vraciam 404.');
      return NextResponse.json({ message: 'Nenájdení žiadni študenti.' }, { status: 404 });
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

    console.log('Zozbieraná štatistika študentov:', studentStats);

    return NextResponse.json({ studentStats }, { status: 200 });
  } catch (error) {
    console.error('Chyba autentifikácie:', error);
    return NextResponse.json({ message: 'Neplatný token.' }, { status: 403 });
  }
}