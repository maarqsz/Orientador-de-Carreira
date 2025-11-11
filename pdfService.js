import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//
// 1️⃣ Função para limpar e converter o texto da IA
//
function limparEFormatarTexto(textoDaIA) {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Remove separadores "---"
  const textoLimpo = textoDaIA.replace(/^[-_.]{3,}\s*$/gm, '');
  return marked.parse(textoLimpo);
}

//
// 2️⃣ Função principal: gera o PDF com PDFKit
//
export async function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  try {
    // Diretório onde os PDFs serão salvos
    const reportsDir = path.join(__dirname, 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const nomeArquivo = `relatorio_${Date.now()}.pdf`;
    const caminhoFinal = path.join(reportsDir, nomeArquivo);

    // Cria o documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    const stream = fs.createWriteStream(caminhoFinal);
    doc.pipe(stream);

    // Título principal
    doc
      .fontSize(22)
      .fillColor('#003366')
      .text('Relatório de Análise de Carreira', { align: 'center' })
      .moveDown();

    // Informações do usuário
    doc
      .fontSize(14)
      .fillColor('#003366')
      .text('Informações do Usuário', { underline: true })
      .moveDown(0.5)
      .fillColor('#333')
      .fontSize(12)
      .text(`Nome: ${dadosUsuario.nome}`)
      .text(`Experiência: ${dadosUsuario.experiencia}`)
      .text(`Habilidades: ${dadosUsuario.habilidades}`)
      .text(`Interesses: ${dadosUsuario.interesses}`)
      .moveDown();

    // Divisor
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#003366')
      .stroke()
      .moveDown();

    // Seção da IA
    doc
      .fontSize(14)
      .fillColor('#003366')
      .text('Análise de Carreira', { underline: true })
      .moveDown(0.5)
      .fillColor('#222')
      .fontSize(12);

    // Converte markdown → texto formatado simples
    const textoConvertido = limparEFormatarTexto(textoDaIA);
    const textoSemTags = textoConvertido.replace(/<[^>]+>/g, '');
    const paragrafos = textoSemTags.split('\n').filter(p => p.trim() !== '');

    paragrafos.forEach(par => {
      doc.text(par.trim(), { align: 'justify' }).moveDown(0.5);
    });

    // Rodapé
    doc
      .moveDown(1)
      .fontSize(10)
      .fillColor('#777')
      .text(
        `Relatório gerado automaticamente — ${new Date().toLocaleDateString('pt-BR')}`,
        { align: 'center' }
      );

    doc.end();

    // Retorna o caminho público após o término da escrita
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
