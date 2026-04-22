CREATE DATABASE IF NOT EXISTS inventario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inventario;

CREATE TABLE IF NOT EXISTS produtos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100)   NOT NULL,
  quantidade  INT            NOT NULL DEFAULT 0,
  preco       DECIMAL(10,2)  NOT NULL,
  categoria   VARCHAR(50)    NOT NULL,
  criado_em   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Dados de exemplo
INSERT INTO produtos (nome, quantidade, preco, categoria) VALUES
  ('Notebook Dell',      10,  3500.00, 'Eletrônicos'),
  ('Mouse Logitech',     50,    89.90, 'Periféricos'),
  ('Teclado Mecânico',   30,   249.00, 'Periféricos'),
  ('Monitor 24"',         8,  1200.00, 'Eletrônicos'),
  ('Cadeira Gamer',       5,   950.00, 'Móveis');
