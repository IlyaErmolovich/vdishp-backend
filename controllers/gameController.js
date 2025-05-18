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

    // Преобразуем строки в массивы, если они пришли в виде строк
    if (typeof genres === 'string') {
      genres = genres.split(',').map(g => g.trim());
      console.log('Преобразованные жанры:', genres);
    }
    
    if (typeof platforms === 'string') {
      platforms = platforms.split(',').map(p => p.trim());
      console.log('Преобразованные платформы:', platforms);
    }

    // Проверяем, что genres и platforms - массивы
    if (!Array.isArray(genres)) {
      console.log('Жанры не являются массивом, создаем пустой массив');
      genres = [];
    }
    
    if (!Array.isArray(platforms)) {
      console.log('Платформы не являются массивом, создаем пустой массив');
      platforms = [];
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

    // Преобразуем строки в массивы, если они пришли в виде строк
    if (typeof genres === 'string') {
      genres = genres.split(',').map(g => g.trim());
      console.log('Преобразованные жанры при обновлении:', genres);
    }
    
    if (typeof platforms === 'string') {
      platforms = platforms.split(',').map(p => p.trim());
      console.log('Преобразованные платформы при обновлении:', platforms);
    }

    // Проверяем, что genres и platforms - массивы
    if (!Array.isArray(genres)) {
      console.log('Жанры не являются массивом, используем существующие');
      genres = existingGame.genres || [];
    }
    
    if (!Array.isArray(platforms)) {
      console.log('Платформы не являются массивом, используем существующие');
      platforms = existingGame.platforms || [];
    }
    
    // Убедимся, что у игры есть несколько жанров
    if (genres.length < 3) {
      // Добавляем тестовые жанры для демонстрации
      const allGenres = await Game.getAllGenres();
      console.log("Добавляем дополнительные жанры для тестирования");
      
      // Берем первые 3 жанра из базы, если они еще не в списке
      for (const genre of allGenres.slice(0, 3)) {
        if (!genres.includes(genre.name)) {
          genres.push(genre.name);
          if (genres.length >= 3) break;
        }
      }
      
      console.log("Расширенный список жанров:", genres);
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
      return res.status(404).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Если обложка не установлена, отправляем заглушку
    if (!game.cover_image || game.cover_image === 'placeholder') {
      return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Проверяем наличие данных JSON
    let coverData;
    try {
      // Если строка, пытаемся распарсить JSON
      coverData = typeof game.cover_image === 'string' ? JSON.parse(game.cover_image) : game.cover_image;
    } catch (parseError) {
      // Если ошибка парсинга, отправляем заглушку
      return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Проверяем правильность данных
    if (!coverData || !coverData.data || !coverData.contentType) {
      return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
    }
    
    // Отправляем изображение
    res.set('Content-Type', coverData.contentType);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Конвертируем Base64 в буфер и отправляем
    const imgBuffer = Buffer.from(coverData.data, 'base64');
    res.send(imgBuffer);
  } catch (error) {
    // При любой ошибке возвращаем заглушку
    return res.status(200).sendFile(path.join(__dirname, '../../frontend/public/placeholder-game.jpg'));
  }
}; 