import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDb, setupDb } from './database.js';
import { analisarCarreira } from './geminiService.js';
import { gerarRelatorioPDF } from './pdfService.js';

// ====== CONFIGURA __dirname PARA ES MODULES ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== CONFIGURA O APP ======
const app = express();
const PORT = process.env.PORT || 3001;

// ====== CONFIGURA CORS ======
const allowedOrigins = [
  'https://orientador-de-carreira-front.vercel.app', // domínio principal da Vercel
  'https://orientador-de-carreira-front-e1dlsne6g.vercel.app', // preview do deploy
  'http://localhost:5173', // ambiente local
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS bloqueou o acesso de: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// ====== SERVIR PDFs PUBLICAMENTE ======
// Agora os relatórios são servidos em: /public/reports/arquivo.pdf
app.use('/public', express.static(path.join(__dirname, 'public')));

// ====== ROTA DE TESTE ======
app.get('/api/teste', (req, res) => {
  res.json({ message: 'Opa, o back-end está 100%!' });
});

// ====== ROTA PRINCIPAL: GERA PDF ======
app.post('/api/analise', async (req, res) => {
  const dadosDoFormulario = req.body;
  console.log('📥 Recebi dados:', dadosDoFormulario);

  // Captura a URL base do servidor (Render, local, etc.)
  const hostUrl = `${req.protocol}://${req.get('host')}`;

  try {
    // --- ETAPA 1: SALVAR NO BANCO ---
    const db = await openDb();
    const result = await db.run(
      'INSERT INTO analises (nome, habilidades, interesses, experiencia) VALUES (?, ?, ?, ?)',
      [
        dadosDoFormulario.nome,
        dadosDoFormulario.habilidades,
        dadosDoFormulario.interesses,
        dadosDoFormulario.experiencia
      ]
    );
    const novoId = result.lastID;
    console.log(`✅ Dados salvos no banco com ID: ${novoId}`);

    // --- ETAPA 2: CHAMAR A IA ---
    console.log('🤖 Iniciando análise de IA...');
    const analiseIA = await analisarCarreira(dadosDoFormulario);
    console.log('✅ IA respondeu!');

    // --- ETAPA 3: GERAR O PDF ---
    console.log('📄 Gerando PDF...');
    const caminhoPdf = await gerarRelatorioPDF(dadosDoFormulario, analiseIA);

    // --- ETAPA 4: RETORNAR RESPOSTA PARA O FRONT ---
    const urlFinalPdf = hostUrl + caminhoPdf;
    console.log('📤 Enviando URL do PDF:', urlFinalPdf);

    res.json({
      message: 'PDF gerado com sucesso!',
      idSalvo: novoId,
      pdfUrl: urlFinalPdf
    });

  } catch (error) {
    console.error('💥 Erro no fluxo /api/analise:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// ====== INICIAR SERVIDOR ======
setupDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(console.error);
        console.error('💥 Erro ao gerar o PDF:', err);