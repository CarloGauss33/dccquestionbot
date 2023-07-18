import prisma from '../db';

export async function createCourse(course: string, code: string) {
    const newCourse = await prisma.course.create({
        data: {
            name: course,
            code: code
        }
    })
    return newCourse;
}

export async function getCourse(code: string) {
    const course = await prisma.course.findUnique({
        where: {
            code: code
        }
    })
    return course;
}