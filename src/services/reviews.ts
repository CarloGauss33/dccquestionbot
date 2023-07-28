import { Review } from '@prisma/client';
import { getCourseReviews, addCourseReview, getCourseReviewStats } from '../models/review';
import { getCourse, getAllCoursesTuplesAndCodes} from '../models/course';
import { generateChatAnswer } from './openai';

const REVIEW_SYSTEM_CHAT = process.env.REVIEW_SYSTEM_CHAT || "Revisa las preguntas que se han hecho sobre el curso";
const REVIEW_INSTRUCTION_SYSTEM_CHAT = process.env.REVIEW_INSTRUCTION_SYSTEM_CHAT || "Escribe tu pregunta sobre el curso";
const PROCESS_REVIEW_SYSTEM_CHAT = process.env.PROCESS_REVIEW_SYSTEM_CHAT || "Procesando tu pregunta...";

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
    const course = await getCourse(code);

    if(course)
    {
        const chatMessages = [
            { 'role': 'system', 'content': REVIEW_SYSTEM_CHAT },
            { 'role': 'system', 'content': `Solo responde para el Curso: ${course?.name}` },
            ...buildContextHistory(reviews as Review[]),
            { 'role': 'user', 'content': REVIEW_INSTRUCTION_SYSTEM_CHAT },
        ];

        return await generateChatAnswer(chatMessages);
    }
    else 
        return '';
}

export async function createCourseReview(code: string, review: string, username: string) {
    let course = await getCourse(code);

    if (!course) {
        return null;
    }

    const chatMessages = [
        { 'role': 'system', 'content': PROCESS_REVIEW_SYSTEM_CHAT },
        { 'role': 'user', 'content': review },
    ];

    const answer = await generateChatAnswer(chatMessages);

    return await addCourseReview(code, answer, username);
}

export async function getCoursesInMessage(content: string) {
    const courses = await getAllCoursesTuplesAndCodes();
    const coursesTupleString = courses.map((course) => {
        return `${course.code} - ${course.name}`;
    }).join('\n');

    const chatMessages = [
        { 'role': 'system', 'content': 'A continuación una lista de los cursos existentes con codigo - nombre' },
        { 'role': 'system', 'content': coursesTupleString },
        { 'role': 'system', 'content': 'El usuario enviara un mensaje preguntando sobre distintos cursos. Debes identificar los codigos asociados a los nombres que menciona el usuario. Solo retorna una lista de codigos separados por comas en el formato codigo1, codigo2, codigo3. En caso de no identificar ninguno responde con un espacio vacio.' },
        { 'role': 'user', 'content': content },
    ] as any[];

    const coursesCodes = await generateChatAnswer(chatMessages, '', "gpt-4");

    if(coursesCodes == "No se pudo obtener una respuesta")
        return []

    return coursesCodes.split(',').map((code) => code.trim());
}

export async function generateCourseReviewStats() {
    const answer = await getCourseReviewStats() as { code: string; count: number; courseName: string }[];

    const message = 'Estadisticas de Reviews:';
    return message + '\n' + answer.map((course) => `${course.code} - ${course.courseName}: ${course.count}`).join('\n');
}