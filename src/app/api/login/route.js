// src/app/api/login/route.js

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const { email, password } = await request.json();

  const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
  let users = [];

  try {
    if (fs.existsSync(usersFilePath)) {
      const usersData = fs.readFileSync(usersFilePath, 'utf8');
      users = JSON.parse(usersData);
    }

    // Hľadanie používateľa
    const user = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Používateľ nenájdený.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Overenie hesla
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return new Response(
        JSON.stringify({ message: 'Nesprávne heslo.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Tu môžete pridať JWT token alebo iné autentifikačné mechanizmy

    // Vrátenie emailu a role
    return new Response(
      JSON.stringify({ email: user.email, role: user.role }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chyba pri prihlasovaní používateľa:', error);
    return new Response(
      JSON.stringify({ message: 'Interná chyba servera.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}