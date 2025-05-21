import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nepovolený prístup' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    const usersData = await fs.readFile(usersFilePath, 'utf8');
    const users = JSON.parse(usersData);

    const user = users.find(u => u.email.toLowerCase() === decoded.email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Používateľ nenájdený' }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      role: user.role,
      completedTopics: user.completedTopics || []
    });
  } catch (error) {
    console.error('Chyba pri overovaní používateľa:', error);
    return NextResponse.json({ error: 'Nepovolený prístup' }, { status: 401 });
  }
}