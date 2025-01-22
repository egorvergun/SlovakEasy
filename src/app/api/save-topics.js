import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  const form = new formidable.IncomingForm();

  form.uploadDir = path.join(process.cwd(), 'public', 'images');
  form.keepExtensions = true;

  return new Promise((resolve, reject) => {
    form.parse(request, (err, fields, files) => {
      if (err) {
        console.error('Chyba pri parsovaní formulára:', err);
        return resolve(
          new Response(JSON.stringify({ message: 'Chyba servera.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      const { title, sk, uk } = fields;
      const image = files.image ? `/images/${path.basename(files.image.path)}` : null;

      const topicsFilePath = path.join(process.cwd(), 'public', 'topics.json');
      let topics = [];

      if (fs.existsSync(topicsFilePath)) {
        const topicsData = fs.readFileSync(topicsFilePath, 'utf8');
        topics = JSON.parse(topicsData);
      }

      const newTopic = {
        title,
        sk,
        uk,
        image,
      };

      topics.push(newTopic);

      fs.writeFileSync(topicsFilePath, JSON.stringify({ topics }, null, 2));

      resolve(
        new Response(JSON.stringify({ message: 'Téma bola úspešne uložená.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });
}