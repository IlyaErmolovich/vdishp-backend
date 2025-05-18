const multer = require('multer');
const sharp = require('sharp');

// Настраиваем хранилище для загрузки временных файлов
const storage = multer.memoryStorage();

// Создаем middleware для загрузки файлов
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB макс размер файла
  },
  fileFilter: (req, file, cb) => {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения могут быть загружены'), false);
    }
  }
});

// Middleware для обработки загруженного изображения
const processUploadedFile = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      console.log('Файл не был загружен, продолжаем без обработки изображения');
      // Проверяем, что genres и platforms остаются массивами
      if (req.body.genres && !Array.isArray(req.body.genres)) {
        console.log('Преобразуем genres в массив...');
        req.body.genres = Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres];
      }
      
      if (req.body.platforms && !Array.isArray(req.body.platforms)) {
        console.log('Преобразуем platforms в массив...');
        req.body.platforms = Array.isArray(req.body.platforms) ? req.body.platforms : [req.body.platforms];
      }
      return next();
    }

    console.log('Обрабатываем загруженное изображение...');
    console.log('Тип файла:', file.mimetype);

    let resizedImageBuffer;
    try {
      // Измененяем размер и оптимизируем изображение
      resizedImageBuffer = await sharp(file.buffer)
        .resize({ width: 800, height: 1200, fit: 'inside' })
        .toBuffer();
      
      console.log('Изображение успешно обработано');
    } catch (sharpError) {
      console.error('Ошибка при обработке изображения через sharp:', sharpError);
      resizedImageBuffer = file.buffer; // В случае ошибки используем оригинальный буфер
    }

    // Сохраняем данные изображения для использования в следующем middleware
    req.fileData = {
      data: resizedImageBuffer.toString('base64'),
      contentType: file.mimetype
    };

    // Проверяем, что genres и platforms остаются массивами
    if (req.body.genres && !Array.isArray(req.body.genres)) {
      console.log('Преобразуем genres в массив...');
      req.body.genres = Array.isArray(req.body.genres) ? req.body.genres : [req.body.genres];
    }
    
    if (req.body.platforms && !Array.isArray(req.body.platforms)) {
      console.log('Преобразуем platforms в массив...');
      req.body.platforms = Array.isArray(req.body.platforms) ? req.body.platforms : [req.body.platforms];
    }

    next();
  } catch (error) {
    console.error('Ошибка при обработке загруженного файла:', error);
    next(error);
  }
};

// Middleware для загрузки аватара пользователя
const uploadUserAvatar = [upload.single('avatar'), processUploadedFile];

// Middleware для загрузки обложки игры
const uploadGameCover = [upload.single('cover_image'), processUploadedFile];

module.exports = {
  uploadUserAvatar,
  uploadGameCover
}; 