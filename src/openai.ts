import dotenv from 'dotenv';
import { Configuration, OpenAIApi, type ChatCompletionRequestMessage } from "openai";
import { buildPrompt, buildChatMessages, storeConversation} from './messages';

dotenv.config();
const TEMPERATURE = 0.1;
const CHAT_MODEL = "gpt-3.5-turbo";
const EMBEDDING_MODEL = "text-embedding-ada-002";


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function generateChatAnswer(
    messages: any[],
    username: string = "",
    model: string = CHAT_MODEL,
    temperature: number = TEMPERATURE
    ) {
    const request = {
        model: model,
        temperature: temperature,
        messages: messages
    };

    try {
        const response = await openai.createChatCompletion(request);

        const answer = response.data.choices[0].message?.content as string;
        storeConversation(username, messages[messages.length - 1].content, answer);

        return answer;
    } catch (error) {
        console.log(error);
        return "No se pudo obtener una respuesta";
    }
}

async function getChatAnswer(question: string, username: string="") {
    const processedQuestion = `${username}: ${question}`;
    const messages = await buildChatMessages(processedQuestion, username);

    return await generateChatAnswer(messages, username);
}

async function getTextsEmbedding(texts: string[]) {
    const request = {
        model: EMBEDDING_MODEL,
        input: texts,
    };

    try {
        const response = await openai.createEmbedding(request);

        return response.data;
    } catch (error) {
        return "No se pudo obtener una respuesta";
    }
}


export { getChatAnswer, getTextsEmbedding, generateChatAnswer };