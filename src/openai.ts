import dotenv from 'dotenv';
dotenv.config();

import { Configuration, OpenAIApi, type ChatCompletionRequestMessage } from "openai";
import { insertMessage, getLastMessagesForUser, getLastNMessages } from './db';

const TEMPERATURE = 0.15;
const MAX_TOKENS = 300;
const COMPLETION_MODEL = "text-davinci-003";
const CHAT_MODEL = "gpt-3.5-turbo";
const BASE_PROMPT = "Soy un bot altamente inteligente de la Pontificia Universidad Católica de Chile PUC que responde preguntas generales, computación e ingeniería. " +
                    "En caso de requerir responder con código utilizare <code> </code> para marcar el inicio y el fin del código. " +
                    "En caso de requerir negrita utilizare <b> </b> para marcar el inicio y el fin de la negrita. ";

const BASE_SYSTEM_CHAT = "Eres un bot asistente para el DCC de la Pontificia Universidad Católica de Chile PUC. " +
                         "Interactúas con varios usuarios en un mismo grupo y debes acatar sus ordenes. Además eres Bitcoin Maximalist " +
                         "Los mensajes del historial vienen con el usuario que los envió.";


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function buildPrompt(question: string) {
    return `${BASE_PROMPT}\nQ: ${question}\nA: `;
}

async function buildChatHistory(username: string = '', nMessages: number = 12) {
    const lastMessages = username === '' ?
                         await getLastNMessages(nMessages) :
                         await getLastMessagesForUser(username, nMessages);

    const messages = lastMessages.map((message) => {
        return {
            'role': message.role,
            'content': message.content,
        } as ChatCompletionRequestMessage;
    });

    return messages;
}

async function buildChatMessages(question: string, username: string="") {
    const startMessage = { 'role': 'system', 'content': `${BASE_SYSTEM_CHAT}` };
    const lastMessage = { 'role': 'user', 'content': question };
    const chatHistory =  await buildChatHistory();

    return [startMessage, ...chatHistory, lastMessage] as ChatCompletionRequestMessage[];
}

function storeConversation(username: string, question: string, answer: string) {
    insertMessage(username, question, 'user');
    insertMessage(username, answer, 'assistant');
}

async function getCompletions(prompt: string) {
    const request = {
        prompt: buildPrompt(prompt),
        model: COMPLETION_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        stop: ["A:", "Answer:"],
    };

    const response = await openai.createCompletion(request);

    if (response.data.choices) {
        return response.data.choices[0].text;
    } else {
        return "No se pudo obtener una respuesta";
    }
}

async function getChatAnswer(question: string, username: string="") {
    const processedQuestion = `${username}: ${question}`;
    const messages = await buildChatMessages(processedQuestion, username);
    const request = {
        model: CHAT_MODEL,
        temperature: 0.15,
        messages: messages,
    };

    const response = await openai.createChatCompletion(request);

    if (response.data.choices) {
        const answer = response.data.choices[0].message?.content as string;
        storeConversation(username, processedQuestion, answer);

        return answer;
    } else {
        return "No se pudo obtener una respuesta";
    }
}

export { getCompletions, getChatAnswer };