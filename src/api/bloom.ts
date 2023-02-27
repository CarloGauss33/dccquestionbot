import dotenv from 'dotenv';
import api from './index';
dotenv.config();

export interface BloomResponse {
    generatedText: string;
}

const BASE_URL = 'https://api-inference.huggingface.co/models/bigscience/bloom';
const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`
};

export default {
    get_completion(prompt: string, temperature: number, max_length: number) {
        return api({
            method: 'POST',
            url: BASE_URL,
            headers: HEADERS,
            data: {
                inputs: prompt,
                parameters: {
                    return_full_text: false,
                    temperature: temperature,
                    max_length: max_length,
                },
            },
        }).then(res => { return res as BloomResponse[] });
    },
};

