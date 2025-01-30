import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        const { email, role, teacherEmail } = await request.json();

        const usersFilePath = path.join(process.cwd(), 'public', 'users.json');
        let users = [];

        if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            users = JSON.parse(usersData);
        }

        const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
        if (userIndex === -1) {
            return new Response(JSON.stringify({ message: 'Používateľ nenájdený.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        users[userIndex].role = role;

        if (role === 'student') {
            users[userIndex].teacher = teacherEmail;

            // Nájsť učiteľa a pridať študenta do jeho zoznamu
            const teacherIndex = users.findIndex(user => user.email.toLowerCase() === teacherEmail.toLowerCase() && user.role === 'teacher');
            if (teacherIndex !== -1) {
                // Inicializovať pole students, ak chýba
                if (!Array.isArray(users[teacherIndex].students)) {
                    users[teacherIndex].students = [];
                }

                if (!users[teacherIndex].students.includes(email.toLowerCase())) {
                    users[teacherIndex].students.push(email.toLowerCase());
                }
            } else {
                return new Response(JSON.stringify({ message: 'Učiteľ nenájdený.' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        } else if (role === 'teacher') {
            // Pridávať používateľa do teachers.json, ak tam ešte nie je
            const teachersFilePath = path.join(process.cwd(), 'public', 'teachers.json');
            let teachers = [];

            if (fs.existsSync(teachersFilePath)) {
                const teachersData = fs.readFileSync(teachersFilePath, 'utf8');
                teachers = JSON.parse(teachersData);
            }

            if (!teachers.includes(email.toLowerCase())) {
                teachers.push(email.toLowerCase());
                fs.writeFileSync(teachersFilePath, JSON.stringify(teachers, null, 2));
            }
        }

        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

        const token = jwt.sign(
            { email: users[userIndex].email, role: users[userIndex].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return new Response(JSON.stringify({ token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Chyba pri výbere role:', error);
        return new Response(JSON.stringify({ message: 'Vnútorná chyba servera.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}