const multer = require('multer');
const sharp = require('sharp');

// Используем память вместо диска для хранения загруженных файлов
const storage = multer.memoryStorage();

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  // Принимаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения!'), false);
  }
};

// Настройка загрузки
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware для обработки загруженных файлов
const processUploadedFile = async (req, res, next) => {
  try {
    // Если файл был загружен
    if (req.file) {
      // Сжимаем изображение с помощью sharp
      let processedImage;
      
      try {
        // Обрабатываем изображение - уменьшаем размер и качество
        processedImage = await sharp(req.file.buffer)
          .resize({ width: 500, height: 500, fit: 'inside' })
          .jpeg({ quality: 70 })
          .toBuffer();
      } catch (err) {
        console.error('Ошибка при обработке изображения:', err);
        // Если произошла ошибка при обработке, используем оригинальный буфер
        processedImage = req.file.buffer;
      }
      
      // Создаем объект с данными об изображении
      const imageData = {
        data: processedImage.toString('base64'),
        contentType: 'image/jpeg', // Всегда используем JPEG для сжатых изображений
        filename: req.file.originalname
      };
      
      // Проверяем размер данных после конвертации в base64
      const base64Size = imageData.data.length;
      console.log(`Размер изображения после обработки: ${Math.round(base64Size / 1024)} KB`);
      
      // Заменяем объект файла на объект с данными изображения
      req.fileData = imageData;
      console.log('Файл успешно загружен и обработан');
    }
    
    next();
  } catch (error) {
    console.error('Ошибка при обработке файла:', error);
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