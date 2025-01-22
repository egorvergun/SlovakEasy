import jwt from 'jsonwebtoken';

export async function GET(request) {
  const { cookies } = request;
  const token = cookies.get('token')?.value;

  if (!token) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secure-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    return new Response(JSON.stringify({ user: decoded }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chyba overovania JWT:', error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}