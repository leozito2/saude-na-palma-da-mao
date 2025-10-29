-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo_consulta VARCHAR(100) NOT NULL,
  nome_medico VARCHAR(200) NOT NULL,
  especialidade VARCHAR(100) NOT NULL,
  data_consulta DATE NOT NULL,
  horario_consulta TIME NOT NULL,
  local_consulta TEXT NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data_consulta ON appointments(data_consulta);
