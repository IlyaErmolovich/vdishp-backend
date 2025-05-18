const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Обновление профиля пользователя
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;
    let avatar = null;

    // Если загружен новый аватар
    if (req.fileData) {
      avatar = req.fileData;
      console.log('Получены данные изображения для сохранения в БД');
    }

    // Обновляем профиль
    const updatedUser = await User.updateProfile(userId, username, avatar);

    // Удаляем из ответа большие данные аватара
    const responseUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      role_id: updatedUser.role_id,
      avatar: updatedUser.avatar ? true : false, // Возвращаем только флаг наличия аватара
      avatar_id: updatedUser.id // Используем ID пользователя как идентификатор аватара
    };

    res.json({
      message: 'Профиль успешно обновлен',
      user: responseUser
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: error.message });
  }
};

// Получение профиля пользователя
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const user = await User.getById(userId);

    // Удаляем из ответа большие данные аватара
    const responseUser = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      avatar: user.avatar ? true : false, // Возвращаем только флаг наличия аватара
      avatar_id: user.id // Используем ID пользователя как идентификатор аватара
    };

    res.json({
      user: responseUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Получение аватара пользователя
exports.getUserAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.getById(userId);
    
    if (!user || !user.avatar) {
      return res.status(404).json({ message: 'Аватар не найден' });
    }
    
    // Парсим данные аватара из JSON
    const avatarData = typeof user.avatar === 'string' ? JSON.parse(user.avatar) : user.avatar;
    
    // Устанавливаем заголовки
    res.set('Content-Type', avatarData.contentType);
    
    // Конвертируем Base64 в буфер и отправляем
    const imgBuffer = Buffer.from(avatarData.data, 'base64');
    res.send(imgBuffer);
  } catch (error) {
    console.error('Ошибка получения аватара:', error);
    res.status(500).json({ message: error.message });
  }
}; 