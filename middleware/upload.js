const multer = require('multer');

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
const processUploadedFile = (req, res, next) => {
  // Если файл был загружен
  if (req.file) {
    // Создаем объект с данными об изображении
    const imageData = {
      data: req.file.buffer.toString('base64'),
      contentType: req.file.mimetype,
      filename: req.file.originalname
    };
    
    // Заменяем объект файла на объект с данными изображения
    req.fileData = imageData;
    console.log('Файл успешно загружен в памяти');
  }
  
  next();
};

// Middleware для загрузки аватара пользователя
const uploadUserAvatar = [upload.single('avatar'), processUploadedFile];

// Middleware для загрузки обложки игры
const uploadGameCover = [upload.single('cover_image'), processUploadedFile];

module.exports = {
  uploadUserAvatar,
  uploadGameCover
}; 