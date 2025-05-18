const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
require('dotenv').config();

// Импортируем базу данных
const db = require('./config/db');

// Создаем экземпляр приложения Express
const app = express();

// Настройка CORS с поддержкой куки
const corsOptions = {
  origin: ['http://localhost:3000', 'https://vdishp-frontend.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Разрешаем передачу куки в CORS-запросах
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Настройка сессий
app.use(session({
  secret: 'super_простой_секретный_ключ_1234567890',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 день
  }
}));

// Доступ к статическим файлам
app.use(express.static(path.join(__dirname, 'public')));

// Корневой маршрут для проверки API
app.get('/api', (req, res) => {
  res.json({ message: 'API работает' });
});

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

// Использование маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// Маршрут для всех остальных запросов, чтобы React Router работал при обновлении страницы
app.get('*', (req, res) => {
  // Исключаем API маршруты
  if (!req.url.startsWith('/api')) {
    const indexPath = path.join(__dirname, 'public/index.html');
    console.log('Попытка отправить файл:', indexPath);
    try {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error('Файл не найден:', indexPath);
        res.status(404).send('Файл index.html не найден');
      }
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
      res.status(500).send('Ошибка сервера при отправке файла');
    }
  } else {
    res.status(404).json({ message: 'Маршрут не найден' });
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Что-то пошло не так!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Порт
const PORT = process.env.PORT || 5000;

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 