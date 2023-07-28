import { insertMessage, getLastMessagesForUser, getLastNMessages } from '../db/messages-db';
import { type ChatCompletionRequestMessage } from "openai";

const BASE_SYSTEM_CHAT = process.env.BASE_SYSTEM_CHAT || "Responde a dudas en un contexto de DCC PUC";

export function buildPrompt(question: string) {
    return `${BASE_SYSTEM_CHAT}\nQ: ${question}\nA: `;
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