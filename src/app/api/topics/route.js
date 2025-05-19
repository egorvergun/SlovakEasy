import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const dataFilePath = path.join(process.cwd(), 'public', 'data.json');
    if (!fs.existsSync(dataFilePath)) {
      return new Response(JSON.stringify({ message: 'Súbor s dátami nebol nájdený.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = fs.readFileSync(dataFilePath, 'utf8');
    const jsonData = JSON.parse(data);

    return new Response(JSON.stringify({ topics: jsonData.topics }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chyba pri získavaní tém:', error);
    return new Response(JSON.stringify({ message: 'Interná chyba servera.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}