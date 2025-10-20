import prisma from "@/lib/db/prisma";

async function findById(id: string) {
    return await prisma.user.findUnique({
        where: { id },
        select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        },
    });
}

async function findByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email },
        select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        },
    });
}

export const UserRepository = {
    findById,
    findByEmail,
};
