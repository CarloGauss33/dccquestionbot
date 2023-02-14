import dotenv from 'dotenv';
dotenv.config();

import { Configuration, OpenAIApi } from "openai";

const TEMPERATURE = 0.25;
const MAX_TOKENS = 300;
const COMPLETITION_MODEL = "text-davinci-003";
const BASE_PROMPT = "Soy un bot altamente inteligente de la Pontificia Universidad Catolica de Chile (PUC / UC) que responde preguntas generales, computación e ingenieria.";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function build_prompt(question: string) {
    return `${BASE_PROMPT}\nQ: ${question}\nA: `;
}

async function get_completions(prompt: string) {
    const request = {
        prompt: build_prompt(prompt),
        model: COMPLETITION_MODEL,
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

export { get_completions };