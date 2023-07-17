import { PrismaClient } from '@prisma/client'
import { addCourseReview } from '../models/review'
import fs from 'fs';
import { parse } from 'csv-parse';
const prisma = new PrismaClient()

async function main() {
    await prisma.review.deleteMany({});
    await prisma.course.deleteMany({});

    const CSV_COURSES_PATH = './src/scripts/fixtures/courses.csv';
    const CSV_REVIEWS_PATH = './src/scripts/fixtures/reviews.csv';

    fs.createReadStream(CSV_COURSES_PATH)
        .pipe(parse({ delimiter: ';', from_line: 2 }))
        .on('data', async (row) => {
            const [code, name] = row;
            const newCourse = await prisma.course.create({
                data: {
                    code: code.trim(),
                    name: name.trim()
                }
            })
        }).on('end', async () => {
            console.log('CSV file successfully processed');
        }).on('error', (err) => {
            console.error(err);
        });

    fs.createReadStream(CSV_REVIEWS_PATH)
    .pipe(parse({ delimiter: ';', from_line: 2, relax_quotes: true }))
    .on('data', async (row) => {
        const [code, username, content] = row;
        
        await addCourseReview(code, username, content)

    }).on('end', async () => {
        console.log('CSV file successfully processed');
    }).on('error', (err) => {
        console.error(err);
    });
}

main().then(async () => { await prisma.$disconnect() })
