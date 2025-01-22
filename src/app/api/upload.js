// pages/api/upload.js
import nextConnect from 'next-connect';
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname),
  }),
});

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Chyba nahrávania: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Metóda ${req.method} nie je povolená` });
  },
});

apiRoute.use(upload.single('image'));

apiRoute.post((req, res) => {
  res.status(200).json({ filename: req.file.filename });
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false,
  },
};