const Game = require('../models/game');
const fs = require('fs');
const path = require('path');

// Получение всех игр с фильтрацией
exports.getAllGames = async (req, res) => {
  try {
    const filters = {
      title: req.query.title,
      genre: req.query.genre,
      platform: req.query.platform,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit
    };

    const games = await Game.getAll(filters);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Получение игры по ID
exports.getGameById = async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await Game.getById(gameId);
    
    res.json(game);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Создание новой игры (только для админов)
exports.createGame = async (req, res) => {
  try {
    const { title, developer, publisher, release_date } = req.body;
    let { genres, platforms } = req.body;
    
    // Проверка наличия обязательных полей
    if (!title || !developer || !publisher || !release_date) {
      return res.status(400).json({ message: 'Необходимо указать название, разработчика, издателя и дату выхода' });
    }

    console.log('Получены данные игры для создания:');
    console.log('Название:', title);
    console.log('Разработчик:', developer);
    console.log('Издатель:', publisher);
    console.log('Дата выхода:', release_date);
    console.log('Исходные жанры:', genres);
    console.log('Исходные платформы:', platforms);

    let cover_image = null;
    
    // Если загружена обложка
    if (req.fileData) {
      // Преобразуем объект в JSON строку для хранения в БД
      cover_image = JSON.stringify(req.fileData);
      console.log('Сохраняем обложку игры в БД');
    }
    // Если обложка не загружена для новой игры, используем заглушку
    else {
      console.log('Обложка не была загружена, устанавливаем заглушку');
      cover_image = 'placeholder';
    }

    // Убедимся, что genres и platforms являются массивами
    if (!genres) {
      genres = [];
    } else if (!Array.isArray(genres)) {
      genres = [genres]; // если пришла одна строка, преобразуем в массив
    }
    
    if (!platforms) {
      platforms = [];
    } else if (!Array.isArray(platforms)) {
      platforms = [platforms]; // если пришла одна строка, преобразуем в массив
    }
    
    console.log('Итоговые жанры перед созданием:', genres);
    console.log('Итоговые платформы перед созданием:', platforms);

    // Создаем игру
    const game = await Game.create({
      title,
      developer,
      publisher,
      release_date,
      cover_image,
      genres,
      platforms
    });
    
    console.log('Игра успешно создана, возвращенные данные:');
    console.log('ID:', game.id);
    console.log('Жанры:', game.genres);
    console.log('Платформы:', game.platforms);
    
    res.status(201).json({
      message: 'Игра успешно создана',
      game
    });
  } catch (error) {
    console.error('Ошибка при создании игры:', error);
    res.status(500).json({ message: error.message });
  }
};

// Обновление игры (только для админов)
exports.updateGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { title, developer, publisher, release_date } = req.body;
    let { genres, platforms } = req.body;
    
    console.log('Получены данные игры для обновления:');
    console.log('ID игры:', gameId);
    console.log('Название:', title);
    console.log('Разработчик:', developer);
    console.log('Издатель:', publisher);
    console.log('Дата выхода:', release_date);
    console.log('Исходные жанры:', genres);
    console.log('Исходные платформы:', platforms);
    
    // Получаем существующую игру для возможного сохранения обложки
    const existingGame = await Game.getById(gameId);
    console.log('Текущие жанры игры:', existingGame.genres);
    
    let cover_image = existingGame.cover_image;
    
    // Если загружена новая обложка
    if (req.fileData) {
      // Преобразуем объект в JSON строку для хранения в БД
      cover_image = JSON.stringify(req.fileData);
      console.log('Сохраняем новую обложку игры в БД');
    }

    // Убедимся, что genres и platforms являются массивами
    if (!genres) {
      genres = existingGame.genres || [];
    } else if (!Array.isArray(genres)) {
      genres = [genres]; // если пришла одна строка, преобразуем в массив
    }
    
    if (!platforms) {
      platforms = existingGame.platforms || [];
    } else if (!Array.isArray(platforms)) {
      platforms = [platforms]; // если пришла одна строка, преобразуем в массив
    }

    console.log('Итоговые жанры перед обновлением:', genres);
    console.log('Итоговые платформы перед обновлением:', platforms);

    // Обновляем игру
    const game = await Game.update(gameId, {
      title,
      developer,
      publisher,
      release_date,
      cover_image,
      genres,
      platforms
    });
    
    console.log('Игра успешно обновлена, возвращенные данные:');
    console.log('ID:', game.id);
    console.log('Жанры:', game.genres);
    console.log('Платформы:', game.platforms);
    
    res.json({
      message: 'Игра успешно обновлена',
      game
    });
  } catch (error) {
    console.error('Ошибка при обновлении игры:', error);
    res.status(500).json({ message: error.message });
  }
};

// Удаление игры (только для админов)
exports.deleteGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Удаляем игру из базы данных
    await Game.delete(gameId);
    
    res.json({ message: 'Игра успешно удалена' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Получение всех жанров
exports.getAllGenres = async (req, res) => {
  try {
    const genres = await Game.getAllGenres();
    res.json(genres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Получение всех платформ
exports.getAllPlatforms = async (req, res) => {
  try {
    const platforms = await Game.getAllPlatforms();
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Добавление тестовых жанров ко всем играм
exports.addTestGenresToAllGames = async (req, res) => {
  try {
    const result = await Game.addTestGenresToAllGames();
    res.json(result);
  } catch (error) {
    console.error('Ошибка при добавлении тестовых жанров:', error);
    res.status(500).json({ message: error.message });
  }
};

// Получение обложки игры
exports.getGameCover = async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Получаем данные игры
    const game = await Game.getById(gameId);
    
    // Если игра не найдена, отправляем заглушку
    if (!game) {
      console.log(`Игра с ID ${gameId} не найдена, отправляем заглушку`);
      return res.status(404).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Если обложка не установлена, отправляем заглушку
    if (!game.cover_image || game.cover_image === 'placeholder') {
      console.log(`Для игры ${game.title} (ID: ${gameId}) установлена заглушка вместо обложки`);
      return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Проверяем наличие данных JSON
    let coverData;
    try {
      // Если строка, пытаемся распарсить JSON
      coverData = typeof game.cover_image === 'string' ? JSON.parse(game.cover_image) : game.cover_image;
      console.log(`Успешно распарсили JSON данных обложки для игры ${game.title} (ID: ${gameId})`);
    } catch (parseError) {
      // Если ошибка парсинга, отправляем заглушку
      console.error(`Ошибка парсинга JSON для обложки игры ${game.title} (ID: ${gameId}):`, parseError);
      return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Проверяем правильность данных
    if (!coverData || !coverData.data || !coverData.contentType) {
      console.error(`Некорректные данные обложки для игры ${game.title} (ID: ${gameId})`);
      return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Отправляем изображение
    console.log(`Отправляем обложку для игры ${game.title} (ID: ${gameId}), тип: ${coverData.contentType}`);
    res.set('Content-Type', coverData.contentType);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Конвертируем Base64 в буфер и отправляем
    const imgBuffer = Buffer.from(coverData.data, 'base64');
    return res.send(imgBuffer);
  } catch (error) {
    console.error(`Ошибка при получении обложки игры (ID: ${req.params.id}):`, error);
    // При любой ошибке возвращаем заглушку
    return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
  }
}; 