import { GoogleGenerativeAI } from '@google/generative-ai';

// O dotenv 'lê' seu arquivo .env e disponibiliza a chave
import 'dotenv/config'; 

// Pega a chave do .env
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  throw new Error("Chave GEMINI_API_KEY não encontrada no .env");
}

// Configura o modelo
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
// Certo
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Função que recebe os dados do formulário e manda para a IA
 */
export async function analisarCarreira(dados) {
  const { nome, habilidades, interesses, experiencia } = dados;

  // ---- A MÁGICA ESTÁ AQUI: O PROMPT ----
  const prompt = `
    Aja como um Orientador de Carreira sênior e analise o seguinte perfil de usuário:

    - Nome: ${nome}
    - Nível de Experiência: ${experiencia}
    - Habilidades Principais: ${habilidades}
    - Áreas de Interesse: ${interesses}

    Gere um relatório de análise para o(a) ${nome} contendo:

    1.  **Análise de Perfil:** Um parágrafo curto sobre os pontos fortes e o momento de carreira.
    2.  **Áreas de Atuação Sugeridas:** Uma lista (bullet points) de 3 áreas ou cargos que combinam habilidades e interesses.
    3.  **Plano de Desenvolvimento:** Uma lista (bullet points) de 2 sugestões práticas (ex: um curso, um livro, uma soft skill) para esta pessoa focar.

    Seja profissional, direto ao ponto e encorajador.
    Formate a resposta em Markdown simples (use ** para negrito e * para listas).
  `;
  // ---- FIM DO PROMPT ----

  try {
    console.log("Enviando prompt para a IA...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("IA respondeu!");
    return text;
  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    return "Erro: Não foi possível gerar a análise de IA no momento.";
  }
}