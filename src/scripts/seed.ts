import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.course.create({
        data: {
            code: 'IIC2133',
            name: 'Estructuras de Datos y Algoritmos'
        }
    })

    await prisma.course.create({
        data: {
            code: 'IIC2413',
            name: 'Bases de Datos'
        }
    })

    await prisma.review.create({
        data: {
            content: 'Me gustó mucho el curso, pero el profe es muy estricto',
            username: 'demo',
            course: {
                connect: {
                    code: 'IIC2133'
                }
            }
        }
    })

    await prisma.review.create({
        data: {
            content: 'EL curso tiene 3 tarea, 2 controles y un proyecto',
            username: 'demo',
            course: {
                connect: {
                    code: 'IIC2133'
                }
            }
        }
    })
}

main().then(async () => { await prisma.$disconnect() })
