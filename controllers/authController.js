const User = require('../models/user');
require('dotenv').config();

// Регистрация нового пользователя
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка наличия обязательных полей
    if (!username || !password) {
      return res.status(400).json({ message: 'Необходимо указать имя пользователя и пароль' });
    }
    
    // Запрещаем регистрацию администраторов через API
    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Выберите другое имя пользователя' });
    }

    // Регистрация пользователя
    const user = await User.register(username, password);
    
    // Создаем сессию для пользователя
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      role_id: user.role_id
    };

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user.id,
        username: user.username,
        role_id: user.role_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Авторизация пользователя
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка наличия обязательных полей
    if (!username || !password) {
      return res.status(400).json({ message: 'Необходимо указать имя пользователя и пароль' });
    }

    // Авторизация пользователя
    const user = await User.login(username, password);
    
    // Создаем сессию для пользователя
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      avatar: user.avatar ? true : false,
      avatar_id: user.id
    };

    res.json({
      message: 'Авторизация успешна',
      user: {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        avatar: user.avatar ? true : false,
        avatar_id: user.id
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// Выход из системы
exports.logout = (req, res) => {
  // Удаляем сессию
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка при выходе из системы' });
    }
    
    res.json({ message: 'Успешный выход из системы' });
  });
};

// Получение информации о текущем пользователе
exports.getMe = async (req, res) => {
  try {
    const user = await User.getById(req.user.id);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        avatar: user.avatar ? true : false,
        avatar_id: user.id
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 