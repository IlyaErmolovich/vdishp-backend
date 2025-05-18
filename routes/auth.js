const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Регистрация нового пользователя
router.post('/register', authController.register);

// Авторизация пользователя
router.post('/login', authController.login);

// Выход из системы
router.post('/logout', authMiddleware, authController.logout);

// Получение информации о текущем пользователе
router.get('/me', authMiddleware, authController.getMe);

module.exports = router; 