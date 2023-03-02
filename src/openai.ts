import dotenv from 'dotenv';
import { Configuration, OpenAIApi, type ChatCompletionRequestMessage } from "openai";
import { buildPrompt, buildChatMessages, storeConversation} from './messages';

dotenv.config();
const TEMPERATURE = 0.1;
const MAX_TOKENS = 300;
const COMPLETION_MODEL = "text-davinci-003";
const CHAT_MODEL = "gpt-3.5-turbo";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

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
        temperature: TEMPERATURE,
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