const jwt = require('jsonwebtoken');
require('dotenv').config();

// Захардкоженный секретный ключ (не использовать в реальных проектах!)
const JWT_SECRET = 'super_простой_секретный_ключ_1234567890';

// Правильный middleware для авторизации
const authMiddleware = (req, res, next) => {
  try {
    // Проверяем, есть ли данные пользователя в сессии (упрощенный подход)
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Берем пользователя из сессии
    req.user = req.session.user;
    next();
  } catch (error) {
    console.error('Ошибка в middleware авторизации:', error);
    res.status(401).json({ message: 'Ошибка авторизации' });
  }
};

// Middleware для проверки роли администратора
const adminMiddleware = (req, res, next) => {
  try {
    // Проверяем, авторизован ли пользователь
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется авторизация' });
    }
    
    // Проверяем, является ли пользователь администратором
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
    }
    
    // Пользователь администратор, пропускаем запрос
    next();
  } catch (error) {
    console.error('Ошибка в middleware проверки роли администратора:', error);
    res.status(403).json({ message: 'Ошибка проверки прав доступа' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
}; 