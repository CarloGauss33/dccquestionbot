import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function addCourseReview(
    course_code: string,
    content: string,
    username: string
) {
    const course = await prisma.course.findUnique({
        where: {
            code: course_code
        }
    })

    if (!course) { return null; }

    const newReview = await prisma.review.create({
        data: {
            content: content,
            username: username,
            course: {
                connect: {
                    id: course.id
                }
            },
        },
        include: {
            course: true
        }
    })
    return newReview;
}

export async function getCourseReviews(course_code: string) {
    const course = await prisma.course.findUnique({
        where: {
            code: course_code
        }
    })

    if (!course) { return null; }

    const reviews = await prisma.review.findMany({
        where: {
            course: {
                id: course.id
            }
        }
    })
    return reviews;
}