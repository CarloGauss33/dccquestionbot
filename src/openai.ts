import dotenv from 'dotenv';
dotenv.config();

import { Configuration, OpenAIApi } from "openai";

const TEMPERATURE = 0.15;
const MAX_TOKENS = 300;
const COMPLETION_MODEL = "text-davinci-003";
const BASE_PROMPT = "Soy un bot altamente inteligente de la Pontificia Universidad Católica de Chile PUC que responde preguntas generales, computación e ingeniería. " +
                    "En caso de requerir responder con código utilizare <code> </code> para marcar el inicio y el fin del código. " +
                    "En caso de requerir negrita utilizare <b> </b> para marcar el inicio y el fin de la negrita. "

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function build_prompt(question: string) {
    return `${BASE_PROMPT}\nQ: ${question}\nA: `;
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

export { getCompletions };