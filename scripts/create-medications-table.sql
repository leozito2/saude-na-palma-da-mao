-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  principio_ativo VARCHAR(200),
  tipo VARCHAR(50) NOT NULL,
  dose VARCHAR(100) NOT NULL,
  horario_uso VARCHAR(50) NOT NULL,
  data_vencimento DATE NOT NULL,
  duracao_dias INTEGER,
  frequencia_diaria INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medications history table
CREATE TABLE IF NOT EXISTS medications_history (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  principio_ativo VARCHAR(200),
  tipo VARCHAR(50) NOT NULL,
  dose VARCHAR(100) NOT NULL,
  horario_uso VARCHAR(50) NOT NULL,
  data_vencimento DATE NOT NULL,
  movido_para_historico_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motivo VARCHAR(50) NOT NULL,
  created_at TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_ativo ON medications(ativo);
CREATE INDEX IF NOT EXISTS idx_medications_history_user_id ON medications_history(user_id);
