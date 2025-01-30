import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Функция для очистки названия темы
function sanitizeTitle(title) {
  return title
    .replace(/[<>:"/\\|?*]+/g, '') // Удаление запрещенных символов
    .replace(/\s+/g, '_')          // Замена пробелов на подчеркивания
    .toLowerCase();                // Приведение к нижнему регистру
}

export async function POST(req) {
  console.log('Prijatá POST požiadavka na /api/add-topic');

  const formData = await req.formData();

  const title = formData.get('title');
  if (!title) {
    return NextResponse.json({ message: 'Нужно указать название темы.' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Адресар для загрузки обеспечен:', uploadDir);
  } catch (err) {
    console.error('Ошибка при создании директории для загрузки:', err);
    return NextResponse.json({ message: 'Серверная ошибка.', status: 500 });
  }

  const images = [];

  // Логирование всех полей формы для отладки
  for (let pair of formData.entries()) {
    const [key, value] = pair;
    console.log(`Field: ${key}, Value:`, value);
  }

  for (let pair of formData.entries()) {
    const [key, value] = pair;
    const imageMatch = key.match(/images\[(\d+)\]\[(sk|uk|image)\]/);
    if (imageMatch) {
      const index = imageMatch[1];
      const field = imageMatch[2];
      if (!images[index]) {
        images[index] = { sk: '', uk: '', imageFile: null };
      }
      images[index][field === 'image' ? 'imageFile' : field] = value;
    }
  }

  // Удаление пустых элементов массива
  const filteredImages = images.filter(image => image.imageFile);

  // Проверка наличия хотя бы одного изображения
  if (filteredImages.length === 0) {
    return NextResponse.json({ message: 'Необходимо добавить хотя бы одно изображение.' }, { status: 400 });
  }

  // Проверка всех изображений
  for (let i = 0; i < filteredImages.length; i++) {
    const image = filteredImages[i];
    if (!image.sk || !image.uk || !image.imageFile) {
      return NextResponse.json(
        { message: `Заполните все поля в изображении ${i + 1}.` },
        { status: 400 }
      );
    }
  }

  const sanitizedTitle = sanitizeTitle(title);
  // Теперь сохраняем все изображения напрямую в папку uploads
  const topicDir = uploadDir; // Без отдельной папки для темы

  try {
    // Убедитесь, что папка uploads существует
    await fs.mkdir(topicDir, { recursive: true });
    console.log('Адресар для загрузки обеспечен:', topicDir);
  } catch (mkdirErr) {
    console.error('Ошибка при создании директории для загрузки:', mkdirErr);
    return NextResponse.json(
      { message: 'Ошибка при создании директории для загрузки.' },
      { status: 500 }
    );
  }

  const imagesData = [];

  for (let i = 0; i < filteredImages.length; i++) {
    const { sk, uk, imageFile } = filteredImages[i];
    const ext = path.extname(imageFile.name);
    // Генерируем уникальное имя файла, чтобы избежать конфликтов
    const newFilename = `${sanitizedTitle}_image_${Date.now()}_${i + 1}${ext}`;
    const newPath = path.join(topicDir, newFilename);

    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(newPath, buffer);
      console.log(`Изображение сохранено: ${newPath}`);
    } catch (err) {
      console.error('Ошибка при сохранении изображения:', err);
      return NextResponse.json(
        { message: 'Ошибка при сохранении изображения.' },
        { status: 500 }
      );
    }

    imagesData.push({
      src: `uploads/${newFilename}`,
      sk,
      uk,
    });
  }

  // Чтение существующих данных
  const dataFilePath = path.join(process.cwd(), 'public', 'data.json');
  let data = { topics: [] };

  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf8');
    data = JSON.parse(jsonData);
    console.log('Существующие данные загружены.');
  } catch (readErr) {
    if (readErr.code !== 'ENOENT') {
      console.error('Ошибка при чтении data.json:', readErr);
      return NextResponse.json(
        { message: 'Ошибка при чтении данных.' },
        { status: 500 }
      );
    }
    // Если файл не существует, продолжаем с пустыми данными
  }

  // Добавление новой темы с ключом "images" вместо "blocks"
  data.topics.push({
    title,
    images: imagesData,
  });
  console.log('Новая тема добавлена:', title);

  // Сохранение обновленных данных
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Данные успешно сохранены в data.json');
  } catch (writeErr) {
    console.error('Ошибка при записи в data.json:', writeErr);
    return NextResponse.json(
      { message: 'Ошибка при сохранении данных.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Тема успешно добавлена.' },
    { status: 200 }
  );
}