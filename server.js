const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Создаем экземпляр приложения Express
const app = express();

// Настройка CORS
const corsOptions = {
  origin: '*', // Разрешаем запросы с любого источника
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Корневой маршрут для проверки API
app.get('/', (req, res) => {
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