import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token chýba' }, { status: 401 });
    }

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
    console.error('Chyba pri overovaní tokenu:', error);
    return NextResponse.json({ error: 'Neplatný token' }, { status: 401 });
  }
}