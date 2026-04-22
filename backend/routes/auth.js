const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { nome, senha } = req.body;
  if (!nome || !senha) return res.status(400).json({ erro: 'Nome e senha obrigatórios' });
  try {
    const [rows] = await req.db.query('SELECT * FROM usuarios WHERE nome = ?', [nome]);
    if (rows.length === 0) return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    const ok = await bcrypt.compare(senha, rows[0].senha);
    if (!ok) return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    const token = jwt.sign({ id: rows[0].id, nome: rows[0].nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, nome: rows[0].nome });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/registrar', async (req, res) => {
  const { nome, senha } = req.body;
  if (!nome || !senha) return res.status(400).json({ erro: 'Nome e senha obrigatórios' });
  try {
    const hash = await bcrypt.hash(senha, 10);
    await req.db.query('INSERT INTO usuarios (nome, senha) VALUES (?, ?)', [nome, hash]);
    res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Usuário já existe' });
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
