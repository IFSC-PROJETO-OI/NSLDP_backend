// server.js

// 1. Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
// IMPORTAÇÃO DA NOVA BIBLIOTECA GOOGLE GENERATIVE AI
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*', // Permite todas as origens (APENAS PARA TESTE/DESENVOLVIMENTO)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Obtém a chave da API do .env
const geminiApiKey = process.env.GEMINI_API_KEY;

// Verifica se a chave da API foi carregada
if (!geminiApiKey) {
    console.error('ERRO: GEMINI_API_KEY não encontrada no arquivo .env.');
    console.error('Por favor, crie um arquivo .env na raiz do seu backend com GEMINI_API_KEY=SUA_CHAVE_AQUI');
    process.exit(1); // Encerra o processo se a chave não estiver configurada
}

// Inicializa a GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(geminiApiKey);

// 5. Rota para o chat
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        console.warn('Requisição recebida sem mensagem do usuário.');
        return res.status(400).json({ error: 'Mensagem do usuário está vazia.' });
    }

    try {
        // MUDANÇA AQUI: Usa o modelo "gemini-1.5-flash"
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Cria a conversa
        const chat = model.startChat({
            generationConfig: {
                maxOutputTokens: 200, // Limita o tamanho da resposta
            },
        });

        // Envia a mensagem do usuário
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text(); // Obtém o texto da resposta

        // Envia a resposta de volta para o frontend
        res.json({ reply: text });

    } catch (error) {
        console.error('Erro ao chamar a API do Gemini (com biblioteca oficial - gemini-1.5-flash):', error);
        // Tenta extrair uma mensagem de erro mais útil se for da API
        let errorMessage = 'Erro interno do servidor ao processar a requisição da IA.';
        if (error.response && error.response.error) {
            errorMessage = `Erro da API Gemini: ${error.response.error.message}`;
        } else if (error.message) {
            errorMessage = `Erro: ${error.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
});

// 6. Inicia o servidor
app.listen(PORT, () => {
    console.log(`Backend do chat rodando em http://localhost:${PORT}`);
});