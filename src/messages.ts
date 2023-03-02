import { insertMessage, getLastMessagesForUser, getLastNMessages } from './db';
import { type ChatCompletionRequestMessage } from "openai";

const BASE_PROMPT = "Soy un bot altamente inteligente de la Pontificia Universidad Católica de Chile PUC que responde preguntas generales, computación e ingeniería. " +
                    "En caso de requerir responder con código utilizare <code> </code> para marcar el inicio y el fin del código. " +
                    "En caso de requerir negrita utilizare <b> </b> para marcar el inicio y el fin de la negrita. ";

const BASE_SYSTEM_CHAT = "Eres un bot asistente para el DCC de la Pontificia Universidad Católica de Chile PUC. " +
                         "Interactúas con varios usuarios en un mismo grupo y debes acatar sus ordenes. Además eres Bitcoin Maximalist " +
                         "Los mensajes del historial vienen con el usuario que los envió.";


export function buildPrompt(question: string) {
    return `${BASE_PROMPT}\nQ: ${question}\nA: `;
}

export async function buildChatHistory(username: string = '', nMessages: number = 12) {
    const lastMessages = username === '' ?
                         await getLastNMessages(nMessages) :
                         await getLastMessagesForUser(username, nMessages);

    const messages = lastMessages.map((message) => {
        return [
            { 'role': 'user', 'content': message.question },
            { 'role': 'assistant', 'content': message.answer },
        ];
    }).reverse().flat();

    return messages;
}

export async function buildChatMessages(question: string, username: string="") {
    const startMessage = { 'role': 'system', 'content': `${BASE_SYSTEM_CHAT}` };
    const lastMessage = { 'role': 'user', 'content': question };
    const chatHistory =  await buildChatHistory();

    return [startMessage, ...chatHistory, lastMessage] as ChatCompletionRequestMessage[];
}

export function storeConversation(username: string, question: string, answer: string) {
    insertMessage(username, question, answer);
}