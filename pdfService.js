import PDFDocument from 'pdfkit';
import fs from 'fs';

export function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 60,
      size: 'A4',
      layout: 'portrait',
    });

    const filePath = `./relatorios/${dadosUsuario.nome.replace(/\s+/g, '_')}_analise.pdf`;
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ====== HEADER AZUL ======
    doc.rect(0, 0, doc.page.width, 80)
      .fill('#003366');

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

    // Divide o texto retornado pela IA por quebras de linha
    const paragrafos = textoDaIA
      .replace(/\d+\.\s*/g, '') // remove números tipo "1.", "2."
      .split(/\n+/)
      .filter(p => p.trim().length > 0);

    doc.fillColor('#000000').fontSize(12);

    paragrafos.forEach(paragrafo => {
      // Se o parágrafo começa com algo tipo "Game Designer:", deixa só isso em negrito
      const match = paragrafo.match(/^([A-Za-zÀ-ú\s\/()\-]+:)(.*)/);
      if (match) {
        const [_, titulo, resto] = match;
        doc.font('Helvetica-Bold').text(titulo.trim(), { continued: true });
        doc.font('Helvetica').text(resto.trim());
      } else {
        doc.font('Helvetica').text(paragrafo.trim(), { align: 'justify' });
      }
      doc.moveDown(0.7);
    });

    // ====== MENSAGEM FINAL MOTIVACIONAL ======
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fillColor('#003366').fontSize(14)
      .text('Mensagem Final', { align: 'left' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fillColor('#000000').fontSize(12)
      .text(
        'Você é alguém com um futuro brilhante e cheio de possibilidades. Continue acreditando no seu potencial, desenvolvendo suas habilidades e mantendo sua curiosidade ativa. Cada passo dado agora está construindo a base de uma carreira inspiradora e significativa.',
        { align: 'justify' }
      );

    // ====== FINALIZA O DOCUMENTO ======
    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}
