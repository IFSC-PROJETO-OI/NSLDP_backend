// server.js

// 1. Carrega as variáveis de ambiente do arquivo .env
// Este passo é crucial para usar a GEMINI_API_KEY do seu ambiente local
// ou das variáveis de ambiente do Render.
require('dotenv').config(); 

const express = require('express');
const cors = require('cors'); // Importa o pacote CORS
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Importa a biblioteca oficial do Gemini

const app = express();
const PORT = process.env.PORT || 3000; // Define a porta, usando a do ambiente ou 3000 por padrão

// 2. Configuração do CORS (Cross-Origin Resource Sharing)
// Isso permite que seu frontend (hospedado no GitHub Pages) faça requisições para este backend.
// A URL no 'origin' DEVE SER EXATAMENTE A URL DO SEU SITE NO GITHUB PAGES.
// Por exemplo, se a URL do seu GitHub Pages é 'https://ifsc-projeto-oi.github.io/NSLDP/',
// então você deve usar exatamente essa string. Verifique se há uma barra '/' final na URL publicada.
app.use(cors({
    origin: 'https://ifsc-projeto-oi.github.io/NSLDP', // <--- VERIFIQUE AQUI COM EXTREMA ATENÇÃO!
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Cabeçalhos permitidos
}));

// 3. Middleware para parsear o corpo das requisições como JSON
app.use(express.json());

// 4. Obtém a chave da API do Gemini das variáveis de ambiente
const geminiApiKey = process.env.GEMINI_API_KEY;

// Verifica se a chave da API foi carregada. Se não, encerra o processo com um erro.
if (!geminiApiKey) {
    console.error('ERRO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
    console.error('No Render, configure GEMINI_API_KEY como uma variável de ambiente.');
    console.error('Localmente, crie um arquivo .env na raiz do seu backend com GEMINI_API_KEY=SUA_CHAVE_AQUI');
    process.exit(1); // Encerra o processo se a chave não estiver configurada
}

// 5. Inicializa a GoogleGenerativeAI com a chave da API
const genAI = new GoogleGenerativeAI(geminiApiKey);

// 6. Rota para o chat da API
// Este é o endpoint que seu frontend irá chamar (https://nsldp-backend.onrender.com/api/chat)
app.post('https://nsldp-backend.onrender.com/api/chat', async (req, res) => {
    const userMessage = req.body.message; // Pega a mensagem do usuário do corpo da requisição

    // Validação básica da mensagem do usuário
    if (!userMessage) {
        console.warn('Requisição recebida sem mensagem do usuário.');
        return res.status(400).json({ error: 'Mensagem do usuário está vazia.' });
    }

    try {
        // Usa o modelo "gemini-1.5-flash" (modelo otimizado para velocidade)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Inicia uma nova conversa com o modelo
        const chat = model.startChat({
            generationConfig: {
                maxOutputTokens: 200, // Limita o tamanho da resposta da IA para evitar respostas muito longas
            },
            // Não é necessário historical messages para uma nova conversa a cada requisição
        });

        // Envia a mensagem do usuário para o modelo Gemini
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text(); // Obtém o texto puro da resposta da IA

        // Envia a resposta da IA de volta para o frontend
        res.json({ reply: text });

    } catch (error) {
        console.error('Erro ao chamar a API do Gemini (com biblioteca oficial - gemini-1.5-flash):', error);
        // Tenta fornecer uma mensagem de erro mais detalhada para o frontend
        let errorMessage = 'Erro interno do servidor ao processar a requisição da IA.';
        if (error.response && error.response.error) {
            errorMessage = `Erro da API Gemini: ${error.response.error.message}`;
        } else if (error.message) {
            errorMessage = `Erro: ${error.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
});

// 7. Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
    console.log(`Backend do chat rodando em http://localhost:${PORT}`);
    // Esta mensagem aparecerá nos logs do Render quando o serviço estiver online.
});