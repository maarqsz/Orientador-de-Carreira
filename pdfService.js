import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = path.join(__dirname, "public", "reports");
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      const nomeArquivo = `${dadosUsuario.nome.replace(/\s+/g, "_")}_analise.pdf`;
      const filePath = path.join(reportsDir, nomeArquivo);

      const doc = new PDFDocument({ margin: 60, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ====== CABEÇALHO ======
      doc.rect(0, 0, doc.page.width, 80).fill("#003366");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22)
        .text("Relatório de Orientação de Carreira", 60, 30);
      doc.moveDown(3);

      // ====== DADOS DO USUÁRIO ======
      doc.fillColor("#333333").font("Helvetica-Bold").fontSize(16)
        .text("Dados do Usuário:");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(12);
      doc.text(`• Nome: ${dadosUsuario.nome}`);
      doc.text(`• Habilidades: ${dadosUsuario.habilidades}`);
      doc.text(`• Interesses: ${dadosUsuario.interesses}`);
      doc.text(`• Nível de Experiência: ${dadosUsuario.experiencia}`);
      doc.moveDown(1);

      // Linha separadora
      doc.strokeColor("#003366").lineWidth(1).moveTo(60, doc.y).lineTo(540, doc.y).stroke();
      doc.moveDown(1.2);

      // ====== SEÇÃO DE ANÁLISE ======
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#003366")
        .text("Análise Personalizada");
      doc.moveDown(1);

      // ====== FORMATAÇÃO DE TEXTO ======
      const linhas = textoDaIA
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      linhas.forEach(linha => {
        // --- Cabeçalhos Markdown ---
        if (/^#{3}\s+/.test(linha)) {
          doc.moveDown(0.8);
          doc.font("Helvetica-Bold").fontSize(13).fillColor("#003366")
            .text(linha.replace(/^#{3}\s+/, ""));
          doc.moveDown(0.5);
        } else if (/^#{2}\s+/.test(linha)) {
          doc.moveDown(1);
          doc.font("Helvetica-Bold").fontSize(15).fillColor("#003366")
            .text(linha.replace(/^#{2}\s+/, ""));
          doc.moveDown(0.8);
        } else if (/^#\s+/.test(linha)) {
          doc.moveDown(1.2);
          doc.font("Helvetica-Bold").fontSize(18).fillColor("#003366")
            .text(linha.replace(/^#\s+/, ""));
          doc.moveDown(0.8);
        }

        // --- Listas ---
        else if (/^(\*|-)\s+/.test(linha)) {
          const texto = linha.replace(/^(\*|-)\s+/, "");
          doc.font("Helvetica").fontSize(12).fillColor("#000000")
            .text("• " + texto, { indent: 20 });
          doc.moveDown(0.2);
        }

        // --- Negrito inline ---
        else if (/\*\*(.*?)\*\*/.test(linha)) {
          const partes = linha.split(/\*\*(.*?)\*\*/g);
          partes.forEach((parte, i) => {
            if (i % 2 === 1) {
              doc.font("Helvetica-Bold").text(parte, { continued: true });
            } else {
              doc.font("Helvetica").text(parte, { continued: true });
            }
          });
          doc.text(""); // solta a linha
          doc.moveDown(0.6);
        }

        // --- Parágrafo comum ---
        else {
          doc.font("Helvetica").fontSize(12).fillColor("#000000")
            .text(linha, { align: "justify", lineGap: 4 });
          doc.moveDown(0.6);
        }
      });

      // ====== MENSAGEM FINAL ======
      doc.moveDown(1.5);
      doc.font("Helvetica-Bold").fillColor("#003366").fontSize(14)
        .text("Mensagem Final", { align: "left" });
      doc.moveDown(0.5);
      doc.font("Helvetica").fillColor("#000000").fontSize(12)
        .text(
          "Você é alguém com um futuro brilhante e cheio de possibilidades. Continue acreditando no seu potencial, desenvolvendo suas habilidades e mantendo sua curiosidade ativa. Cada passo dado agora está construindo a base de uma carreira inspiradora e significativa.",
          { align: "justify", lineGap: 4 }
        );

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);

    } catch (error) {
      reject(error);
    }
  });
}
