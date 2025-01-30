// filepath: /c:/Users/vergu/Desktop/bk_pr/src/app/choose-role/page.js
'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../../context/UserContext';
import '../globals.css';

export default function ChooseRolePage() {
    const router = useRouter();
    const { user, setUser } = useContext(UserContext);
    const [selectedRole, setSelectedRole] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/teachers.json')
            .then(response => response.json())
            .then(data => setTeachers(data))
            .catch(error => console.error('Chyba pri načítavaní učiteľov:', error));
    }, []);

    const handleRoleSelection = async (e) => {
        e.preventDefault();

        if (selectedRole === '') {
            setError('Prosím, vyberte rolu.');
            return;
        }

        if (selectedRole === 'student' && teacherEmail === '') {
            setError('Prosím, vyberte učiteľa.');
            return;
        }

        try {
            const response = await fetch('/api/choose-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, role: selectedRole, teacherEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser({ email: user.email, role: selectedRole, token: data.token });
                router.push('/topics');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Chyba pri výbere role:', error);
            setError('Nepodarilo sa vybrať rolu.');
        }
    };

    return (
        <div>
            <h2>Vyberte rolu</h2>
            <form onSubmit={handleRoleSelection}>
                <div>
                    <label>
                        <input
                            type="radio"
                            value="student"
                            checked={selectedRole === 'student'}
                            onChange={() => setSelectedRole('student')}
                        />
                        Študent
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="teacher"
                            checked={selectedRole === 'teacher'}
                            onChange={() => setSelectedRole('teacher')}
                        />
                        Stať sa učiteľom
                    </label>
                </div>
                {selectedRole === 'student' && (
                    <div>
                        <label>Vyberte učiteľa:</label>
                        <select
                            value={teacherEmail}
                            onChange={(e) => setTeacherEmail(e.target.value)}
                            required
                        >
                            <option value="">--Vyberte--</option>
                            {teachers.map((teacher) => (
                                <option key={teacher} value={teacher}>
                                    {teacher}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Uložiť</button>
            </form>
        </div>
    );
}