import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Corrige __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função auxiliar para processar **negrito** no texto
function escreverTextoFormatado(doc, texto) {
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  partes.forEach((parte) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      doc.font('Helvetica-Bold').text(parte.slice(2, -2), { continued: true });
    } else {
      doc.font('Helvetica').text(parte, { continued: true });
    }
  });
  doc.text(''); // quebra linha no final
}

export function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  return new Promise((resolve, reject) => {
    try {
      // ====== CAMINHO CORRETO ======
      const reportsDir = path.join(__dirname, 'public', 'reports');

      // Cria pasta caso não exista
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const nomeArquivo = `${dadosUsuario.nome.replace(/\s+/g, '_')}_analise.pdf`;
      const filePath = path.join(reportsDir, nomeArquivo);

      // ====== CONFIGURA O DOCUMENTO ======
      const doc = new PDFDocument({
        margin: 60,
        size: 'A4',
        layout: 'portrait',
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ====== HEADER AZUL ======
      doc.rect(0, 0, doc.page.width, 80).fill('#003366');
      doc.fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Relatório de Orientação de Carreira', 60, 30, { align: 'left' });

      // ====== INÍCIO DO CONTEÚDO ======
      doc.moveDown(3);
      doc.fillColor('#333333');

      doc.font('Helvetica-Bold').fontSize(16).text('Dados do Usuário:');
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(12);
      doc.text(`• Nome: ${dadosUsuario.nome}`);
      doc.text(`• Habilidades: ${dadosUsuario.habilidades}`);
      doc.text(`• Interesses: ${dadosUsuario.interesses}`);
      doc.text(`• Nível de Experiência: ${dadosUsuario.experiencia}`);

      // ====== LINHA SEPARADORA ======
      doc.moveDown(1);
      doc.strokeColor('#003366').lineWidth(1).moveTo(60, doc.y).lineTo(540, doc.y).stroke();
      doc.moveDown(1);

      // ====== SEÇÃO DE ANÁLISE ======
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#003366').text('Análise Personalizada');
      doc.moveDown(0.8);

      const paragrafos = textoDaIA
        .replace(/\d+\.\s*/g, '')
        .split(/\n+/)
        .filter((p) => p.trim().length > 0);

      doc.fillColor('#000000').fontSize(12);

      paragrafos.forEach((paragrafo) => {
        const match = paragrafo.match(/^([A-Za-zÀ-ú\s\/()\-]+:)(.*)/);
        if (match) {
          const [_, titulo, resto] = match;
          doc.font('Helvetica-Bold').text(titulo.trim(), { continued: true });
          escreverTextoFormatado(doc, resto.trim());
        } else {
          escreverTextoFormatado(doc, paragrafo.trim());
        }
        doc.moveDown(0.7);
      });

      // ====== MENSAGEM FINAL ======
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fillColor('#003366').fontSize(14)
        .text('Mensagem Final', { align: 'left' });
      doc.moveDown(0.5);
      doc.font('Helvetica').fillColor('#000000').fontSize(12)
        .text(
          'Você é alguém com um futuro brilhante e cheio de possibilidades. Continue acreditando no seu potencial, desenvolvendo suas habilidades e mantendo sua curiosidade ativa. Cada passo dado agora está construindo a base de uma carreira inspiradora e significativa.',
          { align: 'justify' }
        );

      // ====== FINALIZA ======
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
