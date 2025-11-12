import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Corrige __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Funções auxiliares de renderização ===
function splitInlineTokens(text) {
  // Mantém **negrito** e _itálico_ como tokens
  return text.split(/(\*\*.*?\*\*|_.*?_|`.*?`)/g).filter(Boolean);
}

function renderInlineFormatted(doc, text) {
  const parts = splitInlineTokens(text);
  // Escreve em um mesmo parágrafo usando continued true para não quebrar a linha
  parts.forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      doc.font('Helvetica-Bold').text(part.slice(2, -2), { continued: true });
    } else if (part.startsWith('_') && part.endsWith('_')) {
      // PDFKit padrão tem Helvetica-Oblique
      doc.font('Helvetica-Oblique').text(part.slice(1, -1), { continued: true });
    } else {
      doc.font('Helvetica').text(part, { continued: true });
    }
  });
  // Finaliza a linha/parágrafo
  doc.text('', { continued: false });
}

function renderParagraph(doc, text, options = {}) {
  const { align = 'justify', indent = 0 } = options;
  // quebras de linha internas: transformamos linhas simples em blocos
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach((line, idx) => {
    renderInlineFormatted(doc, line);
    if (idx < lines.length - 1) doc.moveDown(0.3);
  });
  doc.moveDown(0.5);
}

// Processa um bloco de markdown (título, lista, parágrafo)
function processBlock(doc, block) {
  const trimmed = block.trim();

  // Cabeçalhos: ###, ##, #
  if (/^#{3}\s+/.test(trimmed)) {
    const content = trimmed.replace(/^#{3}\s+/, '');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#003366')
      .text(content, { align: 'left' });
    doc.moveDown(0.4);
    return;
  }
  if (/^#{2}\s+/.test(trimmed)) {
    const content = trimmed.replace(/^#{2}\s+/, '');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#003366')
      .text(content, { align: 'left' });
    doc.moveDown(0.4);
    return;
  }
  if (/^#\s+/.test(trimmed)) {
    const content = trimmed.replace(/^#\s+/, '');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#003366')
      .text(content, { align: 'left' });
    doc.moveDown(0.5);
    return;
  }

  // Listas: linha que inicia com - ou * (possivelmente múltiplas linhas)
  if (/^(\*|-)\s+/.test(trimmed)) {
    const items = trimmed.split(/\n/).map(l => l.replace(/^(\*|-)\s+/, '').trim()).filter(Boolean);
    items.forEach(item => {
      // indent and bullet
      doc.font('Helvetica').fontSize(12).fillColor('#000000')
        .text('• ', { continued: true, indent: 20 });
      renderInlineFormatted(doc, item);
      doc.moveDown(0.2);
    });
    doc.moveDown(0.4);
    return;
  }

  // Caso título seguido por "Relatório de ..." que a IA às vezes coloca com "### Relatório..." — já pega nos headers acima.
  // Parágrafo normal
  doc.font('Helvetica').fontSize(12).fillColor('#000000');
  renderParagraph(doc, trimmed, { align: 'justify' });
}

// === Exported function ===
export function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  return new Promise((resolve, reject) => {
    try {
      // CAMINHO CORRETO
      const reportsDir = path.join(__dirname, 'public', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const nomeArquivo = `${dadosUsuario.nome.replace(/\s+/g, '_')}_analise.pdf`;
      const filePath = path.join(reportsDir, nomeArquivo);

      // CONFIGURA O DOCUMENTO
      const doc = new PDFDocument({ margin: 60, size: 'A4', layout: 'portrait' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // HEADER AZUL
      doc.rect(0, 0, doc.page.width, 80).fill('#003366');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
        .text('Relatório de Orientação de Carreira', 60, 30, { align: 'left' });

      // CONTEÚDO INICIAL
      doc.moveDown(3);
      doc.fillColor('#333333');
      doc.font('Helvetica-Bold').fontSize(16).text('Dados do Usuário:');
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(12);
      doc.text(`• Nome: ${dadosUsuario.nome}`);
      doc.text(`• Habilidades: ${dadosUsuario.habilidades}`);
      doc.text(`• Interesses: ${dadosUsuario.interesses}`);
      doc.text(`• Nível de Experiência: ${dadosUsuario.experiencia}`);

      // DIVISÓRIA
      doc.moveDown(1);
      doc.strokeColor('#003366').lineWidth(1).moveTo(60, doc.y).lineTo(540, doc.y).stroke();
      doc.moveDown(1);

      // ANÁLISE PERSONALIZADA (processa markdown simples)
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#003366').text('Análise Personalizada');
      doc.moveDown(0.8);

      // Quebra em blocos por dupla nova linha (parágrafos)
      const blocks = textoDaIA
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map(b => b.trim())
        .filter(Boolean);

      blocks.forEach(block => {
        processBlock(doc, block);
      });

      // MENSAGEM FINAL
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fillColor('#003366').fontSize(14).text('Mensagem Final', { align: 'left' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fillColor('#000000').fontSize(12)
        .text(
          'Você é alguém com um futuro brilhante e cheio de possibilidades. Continue acreditando no seu potencial, desenvolvendo suas habilidades e mantendo sua curiosidade ativa. Cada passo dado agora está construindo a base de uma carreira inspiradora e significativa.',
          { align: 'justify' }
        );

      // FINALIZA
      doc.end();

      stream.on('finish', () => {
        console.log(`✅ PDF gerado com sucesso em: ${filePath}`);
        resolve(filePath);
      });

      stream.on('error', (error) => {
        console.error('❌ Erro ao gerar PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Erro no processo de geração de PDF:', error);
      reject(error);
    }
  });
}
