import sqlite3 from 'sqlite3';
import { open } from 'sqlite'; // O 'open' é o cara que conecta

/**
 * Função para abrir a conexão.
 * Ela cria o arquivo 'projeto.db' se ele não existir.
 */
export async function openDb() {
  return open({
    filename: './projeto.db', // O nome do arquivo do banco
    driver: sqlite3.Database
  });
}

/**
 * Função para criar nossa tabela (só roda uma vez)
 * É aqui que definimos a estrutura dos dados.
 */
export async function setupDb() {
  const db = await openDb(); // Abre a conexão

  // db.exec() roda um SQL
  await db.exec(`
    CREATE TABLE IF NOT EXISTS analises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      habilidades TEXT,
      interesses TEXT,
      experiencia TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Tabela [analises] pronta no banco.');
}