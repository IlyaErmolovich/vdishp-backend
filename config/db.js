const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1111',
  database: process.env.DB_NAME || 'vdishp',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Функция-обертка для логирования SQL запросов
const logQuery = async (query, params) => {
  try {
    console.log('Выполняется SQL запрос:', query);
    console.log('Параметры запроса:', params);
    const result = await promisePool.query(query, params);
    return result;
  } catch (error) {
    console.error('Ошибка SQL запроса:', error.message);
    console.error('Запрос:', query);
    console.error('Параметры:', params);
    throw error;
  }
};

module.exports = {
  query: logQuery
}; 