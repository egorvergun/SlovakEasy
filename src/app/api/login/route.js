import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  const { email, password } = await request.json();

  const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
  let users = [];

  try {
    if (fs.existsSync(usersFilePath)) {
      const usersData = fs.readFileSync(usersFilePath, 'utf8');
      users = JSON.parse(usersData);
    }

    const user = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Používateľ nenájdený.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return new Response(
        JSON.stringify({ message: 'Nesprávne heslo.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return new Response(
      JSON.stringify({ email: user.email, role: user.role, token }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chyba pri autentifikácii používateľa:', error);
    return new Response(
      JSON.stringify({ message: 'Vnútorná chyba servera.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}