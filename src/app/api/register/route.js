// app/api/register/route.js

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs'; // alebo 'bcryptjs' ak ho používate
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validácia
    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email a heslo sú povinné.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cesta k teachers.json
    const teachersFilePath = path.join(process.cwd(), 'public', 'teachers.json');
    let teachers = [];

    if (fs.existsSync(teachersFilePath)) {
      const teachersData = fs.readFileSync(teachersFilePath, 'utf8');
      teachers = JSON.parse(teachersData);
    }

    // Kontrola role
    const isTeacher = teachers.includes(email.toLowerCase());

    // Cesta k users.json
    const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
    let users = [];

    if (fs.existsSync(usersFilePath)) {
      const usersData = fs.readFileSync(usersFilePath, 'utf8');
      users = JSON.parse(usersData);
    }

    // Kontrola existencie používateľa
    const userExists = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return new Response(JSON.stringify({ message: 'Používateľ s týmto emailom už existuje.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hashovanie hesla
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Vytvorenie používateľa
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      role: isTeacher ? 'teacher' : 'student',
      completedTopics: [],
    };

    users.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

    // Vytvorenie JWT tokenu
    const jwtSecret = process.env.JWT_SECRET || 'your-secure-secret-key';
    const token = jwt.sign(
      { email: newUser.email, role: newUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return new Response(JSON.stringify({ message: 'Registrácia úspešná.', token, role: newUser.role }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chyba v API registrácie:', error);
    return new Response(JSON.stringify({ message: 'Vnútorná chyba servera.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}