import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path'; // <-- Importa o 'path'
import { fileURLToPath } from 'url'; // <-- Importa utilitário de caminho
import { openDb, setupDb } from './database.js';
import { analisarCarreira } from './geminiService.js';
import { gerarRelatorioPDF } from './pdfService.js'; // <-- IMPORTA O PDF

// Configuração para __dirname funcionar com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configura o App
const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ---- IMPORTANTE: SERVIR ARQUIVOS ESTÁTICOS ----
// Isso torna a pasta 'public' acessível pela URL
// Ex: http://localhost:3001/public/reports/arquivo.pdf
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota de teste
app.get('/api/teste', (req, res) => {
  res.json({ message: 'Opa, o back-end está 100%!' });
});

/**
 * ROTA PRINCIPAL (AGORA GERA PDF!)
 */
app.post('/api/analise', async (req, res) => {
  const dadosDoFormulario = req.body;
  console.log('Recebi dados:', dadosDoFormulario);
  
  // CORREÇÃO: Pega a URL do host (ex: https://seu-backend.onrender.com)
  const hostUrl = `${req.protocol}://${req.get('host')}`;

  try {
    // --- ETAPA 1: SALVAR NO BANCO ---
    const db = await openDb();
    const result = await db.run(
      'INSERT INTO analises (nome, habilidades, interesses, experiencia) VALUES (?, ?, ?, ?)',
      [dadosDoFormulario.nome, dadosDoFormulario.habilidades, dadosDoFormulario.interesses, dadosDoFormulario.experiencia]
    );
    const novoId = result.lastID;
    console.log(`Dados salvos no banco com ID: ${novoId}`);

    // --- ETAPA 2: CHAMAR A IA ---
    console.log("Iniciando análise de IA...");
    const analiseIA = await analisarCarreira(dadosDoFormulario);

    // --- ETAPA 3: GERAR O PDF ---
    console.log("Gerando PDF...");
    // pdfService.js retorna o caminho (ex: /public/reports/arquivo.pdf)
    const caminhoPdf = await gerarRelatorioPDF(dadosDoFormulario, analiseIA);

    // --- ETAPA 4: RESPONDER PARA O FRONT-END (com JSON) ---
    // Monta a URL pública completa para o PDF
    // ex: https://seu-backend.onrender.com/public/reports/arquivo.pdf
    const urlFinalPdf = hostUrl + caminhoPdf;

    console.log("Enviando URL para o front-end:", urlFinalPdf);

    // Envia o JSON que o seu App.js espera
    res.json({
      message: 'PDF gerado com sucesso!',
      idSalvo: novoId,
      pdfUrl: urlFinalPdf 
    });

  } catch (error) {
    console.error('Erro no fluxo /api/analise:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});
// Inicia o servidor
setupDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor back-end rodando na porta ${PORT}`);
  });
}).catch(console.error);