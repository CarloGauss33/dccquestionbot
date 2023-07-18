import { Review } from '@prisma/client';
import { getCourseReviews } from './models/review';
import { getChatAnswer, generateChatAnswer, getTextsEmbedding } from './openai';

const BASE_SYSTEM_CHAT = process.env.BASE_SYSTEM_CHAT || "Responde a dudas en un contexto de DCC PUC";
const REVIEW_SYSTEM_CHAT = process.env.REVIEW_SYSTEM_CHAT || "Revisa las preguntas que se han hecho sobre el curso";

function buildContextHistory(reviews: Review[]) {
    const messages = reviews.map((review) => {
        return [
            { 'role': 'user', 'content': review.content },
        ];
    }).reverse().flat();


    return messages;
}

export async function generateCourseReviewSummary(code: string, question: string) {
    const reviews = await getCourseReviews(code);

    const chatMessages = [
        { 'role': 'system', 'content': REVIEW_SYSTEM_CHAT },
        ...buildContextHistory(reviews as Review[]),
        { 'role': 'user', 'content': question },
    ];

    return await generateChatAnswer(chatMessages);
}