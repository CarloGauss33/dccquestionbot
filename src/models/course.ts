import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function createCourse(course: string, code: string) {
    const newCourse = await prisma.course.create({
        data: {
            name: course,
            code: code
        }
    })
    return newCourse;
}

export async function getCourse(course_code: string) {
    const course = await prisma.course.findUnique({
        where: {
            code: course_code
        }
    })
    return course;
}

export async function getAllCoursesTuplesAndCodes() {
    const courses = await prisma.course.findMany({
        select: {
            code: true,
            name: true
        }
    })
    return courses;
}