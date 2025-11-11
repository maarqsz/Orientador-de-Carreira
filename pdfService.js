import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { marked } from 'marked'; // Certifique-se de ter rodado: npm install marked

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MUDANÇA 1: Ler o arquivo CSS ---
// Lê o CSS uma vez quando o servidor inicia. É mais eficiente.
const cssContent = fs.readFileSync(path.join(__dirname, 'relatorio.css'), 'utf8');

// Função que gera o HTML estilizado
// Função que gera o HTML (com o CSS de espaçamento AJUSTADO)
function gerarHTMLRelatorio(dadosUsuario, textoDaIA) {

  marked.setOptions({
    breaks: true,
    gfm: true
  });

  // Remove os "---"
  const textoLimpo = textoDaIA.replace(/^[-_.]{3,}\s*$/gm, '');
  const textoFormatado = marked.parse(textoLimpo);

  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
        font-family: 'Poppins', sans-serif;
        margin: 40px;
        color: #333;
        line-height: 1.6;
        background-color: #fff;
      }
      h1 {
        color: #003366;
        font-size: 22px;
        text-align: center;
        border-bottom: 3px solid #003366;
        padding-bottom: 10px;
        margin-bottom: 20px; /* <<<--- AJUSTADO (era 30px) */
      }
      h2 {
        color: #003366;
        margin-top: 30px;
        font-size: 18px;
      }
      h3 {
        color: #003366;
        font-size: 16px;
        margin-top: 25px;
        margin-bottom: 10px;
      }
      .secao {
        margin-bottom: 20px; /* <<<--- AJUSTADO (era 30px) */
      }
      .info p {
        margin: 6px 0;
        font-size: 14px;
        display: flex;
      }
      .info strong {
        color: #003366;
        min-width: 100px;
        margin-right: 10px;
      }
      .texto-ia {
        font-size: 14px;
        text-align: justify;
        color: #222;
      }
      .texto-ia p {
        margin-bottom: 15px;
      }
      .texto-ia ul {
        padding-left: 20px;
        margin-bottom: 15px;
      }
      .texto-ia li {
        margin-bottom: 8px; /* Mantido em 8px, que é um bom valor */
      }
      .texto-ia strong {
        color: #003366;
      }
      footer {
        text-align: center;
        margin-top: 20px; /* <<<--- AJUSTADO (era 25px) */
        font-size: 12px;
        color: #777;
        border-top: 1px solid #ccc;
        padding-top: 10px;
      }
    </style>
  </head>
  <body>
    <h1>Relatório de Análise de Carreira</h1>
    <div class="secao info">
      <p><strong>Nome:</strong> ${dadosUsuario.nome}</p>
      <p><strong>Experiência:</strong> ${dadosUsuario.experiencia}</p>
      <p><strong>Habilidades:</strong> ${dadosUsuario.habilidades}</p>
      <p><strong>Interesses:</strong> ${dadosUsuario.interesses}</p>
    </div>
    <div class="secao">
      <h2>Análise de Carreira</h2>
      <div class="texto-ia">${textoFormatado}</div>
    </div>
    <footer>Relatório gerado automaticamente — ${new Date().toLocaleDateString('pt-BR')}</footer>
  </body>
  </html>
  `;
}

// Função principal que gera o PDF
export async function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  try {
    const reportsDir = path.join(__dirname, 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const nomeArquivo = `relatorio_${Date.now()}.pdf`;
    const caminhoFinal = path.join(reportsDir, nomeArquivo);

    const html = gerarHTMLRelatorio(dadosUsuario, textoDaIA);

    const browser = await puppeteer.launch({
      headless: "new", // Use a string "new"
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    
    // --- MUDANÇA 3: A CORREÇÃO PRINCIPAL ---
    // Força o Puppeteer a usar os estilos de "tela" (com cores e fontes)
    await page.emulateMediaType('screen'); 

    await page.setContent(html, { 
      // Espera a fonte do Google (da tag <link>) carregar
      waitUntil: 'networkidle0' 
    });

    await page.pdf({
      path: caminhoFinal,
      format: 'A4',
      printBackground: true, // Isso já estava correto
      margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' }
    });

    await browser.close();

    const caminhoPublico = `/public/reports/${nomeArquivo}`;
    return caminhoPublico;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF.');
  }
}