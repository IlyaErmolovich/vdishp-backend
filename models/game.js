const db = require('../config/db');

class Game {
  // Получение всех игр
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT g.*, 
               GROUP_CONCAT(DISTINCT gen.name SEPARATOR '|') AS genres, 
               GROUP_CONCAT(DISTINCT p.name SEPARATOR '|') AS platforms
        FROM games g
        LEFT JOIN game_genres gg ON g.id = gg.game_id
        LEFT JOIN genres gen ON gg.genre_id = gen.id
        LEFT JOIN game_platforms gp ON g.id = gp.game_id
        LEFT JOIN platforms p ON gp.platform_id = p.id
      `;

      const queryParams = [];
      const conditions = [];

      // Добавление фильтров
      if (filters.title) {
        conditions.push('g.title LIKE ?');
        queryParams.push(`%${filters.title}%`);
      }

      if (filters.genre) {
        conditions.push('gen.name = ?');
        queryParams.push(filters.genre);
      }

      if (filters.platform) {
        conditions.push('p.name = ?');
        queryParams.push(filters.platform);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY g.id';

      // Сортировка
      if (filters.sort === 'newest') {
        query += ' ORDER BY g.release_date DESC';
      } else if (filters.sort === 'popular') {
        // Здесь можно добавить логику сортировки по популярности
        query += ' ORDER BY g.id DESC';
      } else {
        query += ' ORDER BY g.title';
      }

      // Пагинация
      const page = filters.page || 1;
      const limit = filters.limit || 12;
      const offset = (page - 1) * limit;
      
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(Number(limit), Number(offset));

      const [games] = await db.query(query, queryParams);

      // Преобразуем строки жанров и платформ в массивы
      return games.map(game => ({
        ...game,
        genres: game.genres ? game.genres.split('|') : [],
        platforms: game.platforms ? game.platforms.split('|') : []
      }));
    } catch (error) {
      throw error;
    }
  }

  // Получение игры по ID
  static async getById(id) {
    try {
      const [games] = await db.query(`
        SELECT g.*, 
               GROUP_CONCAT(DISTINCT gen.name SEPARATOR '|') AS genres, 
               GROUP_CONCAT(DISTINCT p.name SEPARATOR '|') AS platforms
        FROM games g
        LEFT JOIN game_genres gg ON g.id = gg.game_id
        LEFT JOIN genres gen ON gg.genre_id = gen.id
        LEFT JOIN game_platforms gp ON g.id = gp.game_id
        LEFT JOIN platforms p ON gp.platform_id = p.id
        WHERE g.id = ?
        GROUP BY g.id
      `, [id]);

      if (games.length === 0) {
        throw new Error('Игра не найдена');
      }

      const game = games[0];
      
      // Преобразуем строки жанров и платформ в массивы
      return {
        ...game,
        genres: game.genres ? game.genres.split('|') : [],
        platforms: game.platforms ? game.platforms.split('|') : []
      };
    } catch (error) {
      throw error;
    }
  }

  // Создание новой игры
  static async create(gameData) {
    try {
      const { title, developer, publisher, release_date, cover_image, genres, platforms } = gameData;

      console.log('Добавление игры с жанрами:', genres);

      // Получаем максимальный ID для создания нового
      const [maxIdResult] = await db.query('SELECT MAX(id) as maxId FROM games');
      const newId = maxIdResult[0].maxId ? maxIdResult[0].maxId + 1 : 1;

      console.log('Создаем игру с ID:', newId);

      // Создаем игру
      await db.query(
        'INSERT INTO games (id, title, developper, publisher, release_date, cover_image) VALUES (?, ?, ?, ?, ?, ?)',
        [newId, title, developer, publisher, release_date, cover_image]
      );

      // Для проверки доступных жанров
      const [allGenres] = await db.query('SELECT * FROM genres');
      console.log('Доступные жанры в БД:', allGenres.map(g => `${g.id}: ${g.name}`).join(', '));

      // Добавляем жанры
      if (genres && genres.length > 0) {
        console.log(`Начинаем добавление ${genres.length} жанров`);
        
        for (const genreName of genres) {
          try {
            console.log(`Поиск жанра: "${genreName}"`);
            const [genreResults] = await db.query('SELECT id FROM genres WHERE name = ?', [genreName.trim()]);
            
            if (genreResults.length > 0) {
              const genreId = genreResults[0].id;
              console.log(`Найден жанр ID: ${genreId}, добавляем связь с игрой`);
              
              await db.query(
                'INSERT INTO game_genres (game_id, genre_id) VALUES (?, ?)',
                [newId, genreId]
              );
              console.log(`Жанр ${genreName} успешно добавлен для игры ${title}`);
            } else {
              console.log(`Жанр не найден: "${genreName}"`);
            }
          } catch (genreError) {
            console.error(`Ошибка при добавлении жанра "${genreName}":`, genreError);
          }
        }
      }

      // Добавляем платформы
      if (platforms && platforms.length > 0) {
        console.log(`Начинаем добавление ${platforms.length} платформ`);
        
        for (const platformName of platforms) {
          try {
            console.log(`Поиск платформы: "${platformName}"`);
            const [platformResults] = await db.query('SELECT id FROM platforms WHERE name = ?', [platformName.trim()]);
            
            if (platformResults.length > 0) {
              const platformId = platformResults[0].id;
              console.log(`Найдена платформа ID: ${platformId}, добавляем связь с игрой`);
              
              await db.query(
                'INSERT INTO game_platforms (game_id, platform_id) VALUES (?, ?)',
                [newId, platformId]
              );
              console.log(`Платформа ${platformName} успешно добавлена для игры ${title}`);
            } else {
              console.log(`Платформа не найдена: "${platformName}"`);
            }
          } catch (platformError) {
            console.error(`Ошибка при добавлении платформы "${platformName}":`, platformError);
          }
        }
      }

      // Проверяем результат
      const game = await this.getById(newId);
      console.log('Созданная игра с жанрами:', game.genres);
      
      return game;
    } catch (error) {
      console.error('Ошибка создания игры:', error);
      throw error;
    }
  }

  // Обновление игры
  static async update(id, gameData) {
    try {
      const { title, developer, publisher, release_date, cover_image, genres, platforms } = gameData;

      console.log('Обновление игры ID:', id);
      console.log('Жанры для обновления:', genres);

      // Обновляем основные данные игры
      const updateFields = [];
      const updateParams = [];

      if (title) {
        updateFields.push('title = ?');
        updateParams.push(title);
      }

      if (developer) {
        updateFields.push('developper = ?');
        updateParams.push(developer);
      }

      if (publisher) {
        updateFields.push('publisher = ?');
        updateParams.push(publisher);
      }

      if (release_date) {
        updateFields.push('release_date = ?');
        updateParams.push(release_date);
      }

      if (cover_image) {
        updateFields.push('cover_image = ?');
        updateParams.push(cover_image);
      }

      if (updateFields.length > 0) {
        updateParams.push(id);
        await db.query(
          `UPDATE games SET ${updateFields.join(', ')} WHERE id = ?`,
          updateParams
        );
      }

      // Для проверки доступных жанров
      const [allGenres] = await db.query('SELECT * FROM genres');
      console.log('Доступные жанры в БД:', allGenres.map(g => `${g.id}: ${g.name}`).join(', '));

      // Обновляем жанры
      if (genres && genres.length > 0) {
        try {
          // Удаляем текущие жанры
          console.log('Удаляем существующие жанры для игры ID:', id);
          await db.query('DELETE FROM game_genres WHERE game_id = ?', [id]);

          // Добавляем новые жанры
          console.log(`Начинаем добавление ${genres.length} жанров`);
          
          for (const genreName of genres) {
            try {
              console.log(`Поиск жанра: "${genreName}"`);
              const [genreResults] = await db.query('SELECT id FROM genres WHERE name = ?', [genreName.trim()]);
              
              if (genreResults.length > 0) {
                const genreId = genreResults[0].id;
                console.log(`Найден жанр ID: ${genreId}, добавляем связь с игрой`);
                
                await db.query(
                  'INSERT INTO game_genres (game_id, genre_id) VALUES (?, ?)',
                  [id, genreId]
                );
                console.log(`Жанр ${genreName} успешно добавлен для игры ID ${id}`);
              } else {
                console.log(`Жанр не найден при обновлении: "${genreName}"`);
              }
            } catch (genreError) {
              console.error(`Ошибка при обновлении жанра "${genreName}":`, genreError);
            }
          }
        } catch (genresError) {
          console.error('Ошибка при обновлении жанров:', genresError);
        }
      }

      // Обновляем платформы
      if (platforms && platforms.length > 0) {
        try {
          // Удаляем текущие платформы
          console.log('Удаляем существующие платформы для игры ID:', id);
          await db.query('DELETE FROM game_platforms WHERE game_id = ?', [id]);

          // Добавляем новые платформы
          console.log(`Начинаем добавление ${platforms.length} платформ`);
          
          for (const platformName of platforms) {
            try {
              console.log(`Поиск платформы: "${platformName}"`);
              const [platformResults] = await db.query('SELECT id FROM platforms WHERE name = ?', [platformName.trim()]);
              
              if (platformResults.length > 0) {
                const platformId = platformResults[0].id;
                console.log(`Найдена платформа ID: ${platformId}, добавляем связь с игрой`);
                
                await db.query(
                  'INSERT INTO game_platforms (game_id, platform_id) VALUES (?, ?)',
                  [id, platformId]
                );
                console.log(`Платформа ${platformName} успешно добавлена для игры ID ${id}`);
              } else {
                console.log(`Платформа не найдена при обновлении: "${platformName}"`);
              }
            } catch (platformError) {
              console.error(`Ошибка при обновлении платформы "${platformName}":`, platformError);
            }
          }
        } catch (platformsError) {
          console.error('Ошибка при обновлении платформ:', platformsError);
        }
      }

      // Проверяем результат
      const game = await this.getById(id);
      console.log('Обновленная игра с жанрами:', game.genres);
      
      return game;
    } catch (error) {
      console.error('Ошибка обновления игры:', error);
      throw error;
    }
  }

  // Удаление игры
  static async delete(id) {
    try {
      // Проверяем, существует ли игра
      const [games] = await db.query('SELECT * FROM games WHERE id = ?', [id]);
      
      if (games.length === 0) {
        throw new Error('Игра не найдена');
      }

      // Удаляем связанные записи
      await db.query('DELETE FROM game_genres WHERE game_id = ?', [id]);
      await db.query('DELETE FROM game_platforms WHERE game_id = ?', [id]);
      await db.query('DELETE FROM reviews WHERE game_id = ?', [id]);

      // Удаляем игру
      await db.query('DELETE FROM games WHERE id = ?', [id]);

      return { message: 'Игра успешно удалена' };
    } catch (error) {
      throw error;
    }
  }

  // Получение всех жанров
  static async getAllGenres() {
    try {
      const [genres] = await db.query('SELECT * FROM genres ORDER BY name');
      return genres;
    } catch (error) {
      throw error;
    }
  }

  // Получение всех платформ
  static async getAllPlatforms() {
    try {
      const [platforms] = await db.query('SELECT * FROM platforms ORDER BY name');
      return platforms;
    } catch (error) {
      throw error;
    }
  }

  // Добавление тестовых жанров для всех игр
  static async addTestGenresToAllGames() {
    try {
      // Получаем все игры
      const [games] = await db.query('SELECT id FROM games');
      console.log(`Найдено ${games.length} игр для добавления жанров`);
      
      // Получаем все жанры
      const [allGenres] = await db.query('SELECT id, name FROM genres');
      console.log(`Найдено ${allGenres.length} жанров`);
      
      if (allGenres.length === 0) {
        return { message: 'Нет доступных жанров' };
      }
      
      // Для каждой игры добавляем несколько жанров
      for (const game of games) {
        const gameId = game.id;
        
        // Получаем текущие жанры игры
        const [currentGenres] = await db.query(
          'SELECT genre_id FROM game_genres WHERE game_id = ?', 
          [gameId]
        );
        
        console.log(`Игра ID ${gameId} имеет ${currentGenres.length} жанров`);
        
        // Если у игры меньше 3 жанров, добавляем новые
        if (currentGenres.length < 3) {
          // Создаем массив ID жанров, которые уже есть у игры
          const existingGenreIds = currentGenres.map(g => g.genre_id);
          
          // Выбираем жанры, которых еще нет у игры
          const genresToAdd = allGenres
            .filter(genre => !existingGenreIds.includes(genre.id))
            .slice(0, 5 - currentGenres.length); // Добавляем до 5 жанров
          
          console.log(`Добавляем ${genresToAdd.length} новых жанров для игры ${gameId}`);
          
          // Добавляем каждый жанр
          for (const genre of genresToAdd) {
            try {
              await db.query(
                'INSERT INTO game_genres (game_id, genre_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE game_id = game_id',
                [gameId, genre.id]
              );
              console.log(`Жанр ${genre.name} (ID: ${genre.id}) добавлен к игре ${gameId}`);
            } catch (error) {
              console.error(`Ошибка при добавлении жанра ${genre.name} к игре ${gameId}:`, error);
            }
          }
        }
      }
      
      return { message: 'Тестовые жанры добавлены ко всем играм' };
    } catch (error) {
      console.error('Ошибка при добавлении тестовых жанров:', error);
      throw error;
    }
  }
}

module.exports = Game; 