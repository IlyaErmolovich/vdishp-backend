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
    const { title, developer, publisher, release_date, genres, platforms } = req.body;
    
    // Проверка наличия обязательных полей
    if (!title || !developer || !publisher || !release_date) {
      return res.status(400).json({ message: 'Необходимо указать название, разработчика, издателя и дату выхода' });
    }

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

    // Преобразуем строки в массивы, если они пришли в виде строк
    const gameGenres = typeof genres === 'string' ? genres.split(',') : genres;
    const gamePlatforms = typeof platforms === 'string' ? platforms.split(',') : platforms;

    // Создаем игру
    const game = await Game.create({
      title,
      developer,
      publisher,
      release_date,
      cover_image,
      genres: gameGenres,
      platforms: gamePlatforms
    });
    
    res.status(201).json({
      message: 'Игра успешно создана',
      game
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Обновление игры (только для админов)
exports.updateGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { title, developer, publisher, release_date, genres, platforms } = req.body;
    
    // Получаем существующую игру для возможного сохранения обложки
    const existingGame = await Game.getById(gameId);
    
    let cover_image = existingGame.cover_image;
    
    // Если загружена новая обложка
    if (req.fileData) {
      // Преобразуем объект в JSON строку для хранения в БД
      cover_image = JSON.stringify(req.fileData);
      console.log('Сохраняем новую обложку игры в БД');
    }

    // Преобразуем строки в массивы, если они пришли в виде строк
    const gameGenres = typeof genres === 'string' ? genres.split(',') : genres;
    const gamePlatforms = typeof platforms === 'string' ? platforms.split(',') : platforms;

    // Обновляем игру
    const game = await Game.update(gameId, {
      title,
      developer,
      publisher,
      release_date,
      cover_image,
      genres: gameGenres,
      platforms: gamePlatforms
    });
    
    res.json({
      message: 'Игра успешно обновлена',
      game
    });
  } catch (error) {
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

// Получение обложки игры
exports.getGameCover = async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await Game.getById(gameId);
    
    if (!game || !game.cover_image) {
      return res.status(404).json({ message: 'Изображение не найдено' });
    }
    
    // Парсим данные изображения из JSON
    const coverData = typeof game.cover_image === 'string' ? JSON.parse(game.cover_image) : game.cover_image;
    
    // Устанавливаем заголовки
    res.set('Content-Type', coverData.contentType);
    
    // Конвертируем Base64 в буфер и отправляем
    const imgBuffer = Buffer.from(coverData.data, 'base64');
    res.send(imgBuffer);
  } catch (error) {
    console.error('Ошибка получения обложки игры:', error);
    res.status(500).json({ message: error.message });
  }
}; 