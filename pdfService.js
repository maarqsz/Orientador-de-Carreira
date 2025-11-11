import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { marked } from 'marked'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//
// 1. O NOME CORRETO DA FUNÇÃO É ESTE:
//
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
      /* --- CSS CORRIGIDO E FINALIZADO --- */
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
        margin-bottom: 25px; 
      }
      h2 {
        color: #003366;
        margin-top: 0; 
        font-size: 18px;
        margin-bottom: 15px; 
      }
      h3 {
        color: #003366;
        font-size: 16px;
        margin-top: 25px;
        margin-bottom: 10px;
      }
      .secao {
        margin-bottom: 25px; 
      }
      .info p {
        margin: 4px 0; 
        font-size: 14px;
        display: flex;
        align-items: center;
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
        margin-bottom: 8px;
      }
      .texto-ia strong {
        color: #003366;
      }
      footer {
        text-align: center;
        margin-top: 25px;
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

//
// 2. FUNÇÃO PDF (COM O CACHE E A CHAMADA CORRETA)
//
export async function gerarRelatorioPDF(dadosUsuario, textoDaIA) {
  try {
    const reportsDir = path.join(__dirname, 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const nomeArquivo = `relatorio_${Date.now()}.pdf`;
    const caminhoFinal = path.join(reportsDir, nomeArquivo);

    //
    // 3. A CHAMADA CORRETA (SEM LOOP)
    //
    const html = gerarHTMLRelatorio(dadosUsuario, textoDaIA);

    const cacheDir = '/opt/render/.cache/puppeteer'; 
    
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox'],
      cacheDirectory: cacheDir 
    });

    const page = await browser.newPage();
    await page.emulateMediaType('screen'); 
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: caminhoFinal,
      format: 'A4',
      printBackground: true,
      margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' }
    });

    await browser.close();

    const caminhoPublico = `/public/reports/${nomeArquivo}`;
    return caminhoPublico;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error); // O log que você viu
    throw new Error('Falha ao gerar PDF.');
  }
}