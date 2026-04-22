USE inventario;

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS lancado_por VARCHAR(100) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS historico (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  acao         VARCHAR(20)   NOT NULL,
  produto_id   INT,
  produto_nome VARCHAR(100),
  usuario      VARCHAR(100),
  realizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
