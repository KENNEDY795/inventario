require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve o frontend como arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

app.use((req, res, next) => {
  req.db = pool;
  next();
});

app.use('/api/auth', require('./routes/auth'));

const auth = require('./middleware/auth');
app.use('/api/produtos', auth, require('./routes/produtos'));
app.use('/api/historico', auth, require('./routes/historico'));

// Qualquer rota desconhecida serve o login
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Conectado ao banco de dados MySQL');
    conn.release();
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err.message);
  }
  console.log(`Servidor rodando na porta ${PORT}`);
});
