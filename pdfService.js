import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função auxiliar para limpar e converter o texto da IA
function limparEFormatarTexto(textoDaIA) {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  const textoLimpo = textoDaIA.replace(/^[-_.]{3,}\s*$/gm, '');
  return marked.parse(textoLimpo);
}

export async function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  try {
    // Caminho do diretório de relatórios
    const reportsDir = path.join(__dirname, 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const nomeArquivo = `relatorio_${Date.now()}.pdf`;
    const caminhoFinal = path.join(reportsDir, nomeArquivo);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const stream = fs.createWriteStream(caminhoFinal);
    doc.pipe(stream);

    // === HEADER AZUL ===
    doc.rect(0, 0, 600, 70).fill('#003366');
    doc
      .fillColor('#fff')
      .fontSize(20)
      .text('Relatório de Análise de Carreira', 50, 25, { align: 'center' })
      .moveDown(2);

    // Espaço abaixo do header
    doc.moveDown(2);

    // === DADOS DO USUÁRIO ===
    doc
      .fontSize(14)
      .fillColor('#003366')
      .text('Informações do Usuário', { underline: true })
      .moveDown(0.8);

    doc
      .fontSize(12)
      .fillColor('#000')
      .text(`• Nome: `, { continued: true })
      .font('Helvetica-Bold')
      .text(dadosUsuario.nome)
      .font('Helvetica')
      .text(`• Experiência: `, { continued: true })
      .font('Helvetica-Bold')
      .text(dadosUsuario.experiencia)
      .font('Helvetica')
      .text(`• Habilidades: `, { continued: true })
      .font('Helvetica-Bold')
      .text(dadosUsuario.habilidades)
      .font('Helvetica')
      .text(`• Interesses: `, { continued: true })
      .font('Helvetica-Bold')
      .text(dadosUsuario.interesses)
      .moveDown(1.5);

    // Linha divisória
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#003366')
      .stroke()
      .moveDown(1);

    // === CONTEÚDO DA IA ===
    doc
      .fontSize(14)
      .fillColor('#003366')
      .text('Análise Personalizada', { underline: true })
      .moveDown(0.8);

    const textoConvertido = limparEFormatarTexto(textoDaIA);
    const textoSemTags = textoConvertido.replace(/<[^>]+>/g, '');
    const paragrafos = textoSemTags.split('\n').filter(p => p.trim() !== '');

    doc.fontSize(12).fillColor('#222');

    paragrafos.forEach(par => {
      doc.text(par.trim(), { align: 'justify' }).moveDown(0.5);
    });

    // === MENSAGEM FINAL MOTIVACIONAL ===
    const mensagemFinal =
      '\nLembre-se: o sucesso é construído passo a passo. Continue aprimorando suas habilidades, explorando seus interesses e buscando novos desafios. Você possui um grande potencial e está trilhando um caminho promissor rumo a uma carreira de sucesso!';

    doc.moveDown(1.5);
    doc.font('Helvetica-Oblique').fillColor('#003366').text(mensagemFinal, {
      align: 'justify',
    });

    // === RODAPÉ ===
    doc
      .moveDown(1.5)
      .fontSize(10)
      .fillColor('#777')
      .text(
        `Relatório gerado automaticamente — ${new Date().toLocaleDateString('pt-BR')}`,
        { align: 'center' }
      );

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const caminhoPublico = `/public/reports/${nomeArquivo}`;
    return caminhoPublico;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF.');
  }
}
