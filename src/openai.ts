import dotenv from 'dotenv';
dotenv.config();

import { Configuration, OpenAIApi, type ChatCompletionRequestMessage } from "openai";

const TEMPERATURE = 0.15;
const MAX_TOKENS = 300;
const COMPLETION_MODEL = "text-davinci-003";
const CHAT_MODEL = "gpt-3.5-turbo";
const BASE_PROMPT = "Soy un bot altamente inteligente de la Pontificia Universidad Católica de Chile PUC que responde preguntas generales, computación e ingeniería. " +
                    "En caso de requerir responder con código utilizare <code> </code> para marcar el inicio y el fin del código. " +
                    "En caso de requerir negrita utilizare <b> </b> para marcar el inicio y el fin de la negrita. "

const BASE_SYSTEM_CHAT = "Eres un estudiante de la Pontificia Universidad Católica de Chile PUC que responde preguntas generales, computación e ingeniería. "


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function build_prompt(question: string) {
    return `${BASE_PROMPT}\nQ: ${question}\nA: `;
}

function build_chat_messages(question: string) {
    return [
        {
         'role': 'system',
         'content': `${BASE_SYSTEM_CHAT}`
        },
        {
         'role': 'user',
         'content': `${question}`
        }
    ] as ChatCompletionRequestMessage[];
}

async function getCompletions(prompt: string) {
    const request = {
        prompt: build_prompt(prompt),
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
    const request = {
        model: CHAT_MODEL,
        temperature: 0.25,
        user: username,
        messages: build_chat_messages(question)
    };

    const response = await openai.createChatCompletion(request);

    if (response.data.choices) {
        return response.data.choices[0].message?.content;
    } else {
        return "No se pudo obtener una respuesta";
    }
}

export { getCompletions, getChatAnswer };