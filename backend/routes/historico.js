const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.query(
      'SELECT * FROM historico ORDER BY realizado_em DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
