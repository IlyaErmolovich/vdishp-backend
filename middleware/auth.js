const jwt = require('jsonwebtoken');
require('dotenv').config();

// Захардкоженный секретный ключ (не использовать в реальных проектах!)
const JWT_SECRET = 'super_простой_секретный_ключ_1234567890';

// Упрощенный middleware для авторизации
const authMiddleware = (req, res, next) => {
  // Добавляем фиктивного пользователя для совместимости
  req.user = {
    id: 1, // предполагаем, что это ID пользователя admin
    username: 'admin',
    role_id: 1 // предполагаем, что 1 = admin
  };
  
  // Всегда пропускаем запрос
  next();
};

// Упрощенный middleware для проверки роли администратора
const adminMiddleware = (req, res, next) => {
  // Всегда считаем, что пользователь admin
  req.user = {
    id: 1,
    username: 'admin',
    role_id: 1
  };
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
}; 