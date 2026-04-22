const express = require('express');
const router = express.Router();

async function logHistorico(db, acao, produtoId, produtoNome, usuario) {
  await db.query(
    'INSERT INTO historico (acao, produto_id, produto_nome, usuario) VALUES (?, ?, ?, ?)',
    [acao, produtoId, produtoNome, usuario]
  );
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM produtos ORDER BY criado_em DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, quantidade, categoria } = req.body;
  if (!nome || quantidade == null || !categoria) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, quantidade, categoria' });
  }
  const usuario = req.usuario.nome;
  try {
    const [result] = await req.db.query(
      'INSERT INTO produtos (nome, quantidade, preco, categoria, lancado_por) VALUES (?, ?, 0, ?, ?)',
      [nome, quantidade, categoria, usuario]
    );
    await logHistorico(req.db, 'CRIOU', result.insertId, nome, usuario);
    const [rows] = await req.db.query('SELECT * FROM produtos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, quantidade, categoria } = req.body;
  if (!nome || quantidade == null || !categoria) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, quantidade, categoria' });
  }
  const usuario = req.usuario.nome;
  try {
    const [result] = await req.db.query(
      'UPDATE produtos SET nome = ?, quantidade = ?, categoria = ?, lancado_por = ? WHERE id = ?',
      [nome, quantidade, categoria, usuario, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    await logHistorico(req.db, 'ATUALIZOU', id, nome, usuario);
    const [rows] = await req.db.query('SELECT * FROM produtos WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const usuario = req.usuario.nome;
  try {
    const [existing] = await req.db.query('SELECT nome FROM produtos WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    await logHistorico(req.db, 'DELETOU', id, existing[0].nome, usuario);
    await req.db.query('DELETE FROM produtos WHERE id = ?', [id]);
    res.json({ mensagem: 'Produto deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
