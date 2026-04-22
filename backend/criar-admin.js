require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const hash = await bcrypt.hash('admin123', 10);
  try {
    await conn.query('INSERT INTO usuarios (nome, senha) VALUES (?, ?)', ['admin', hash]);
    console.log('Usuário admin criado!');
    console.log('Login: admin');
    console.log('Senha: admin123');
    console.log('Altere a senha após o primeiro acesso.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') console.log('Usuário admin já existe.');
    else console.error(err.message);
  }
  await conn.end();
})();
