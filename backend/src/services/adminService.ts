import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const getAllReports = async () => {
    return prisma.report.findMany({
        include: {
            reportedEvent: true,
            reportedUser: true,
            reporter: true,
            reviewedBy: true
        },
    });
};
export const getAllReportsToReview = async () => {
    return prisma.report.findMany({
        include: {
            reportedEvent: true,
            reportedUser: true,
            reporter: true,
            reviewedBy: true
        },
        where: {
            reviewedAt: null
        },
    });
};

export const deleteReport = async (reportId: string) => {
    return prisma.report.delete({
        where: { id: reportId }
    });
}


export const reviewReport = async (reportId: string, actionTaken: string, adminId: string) => {
    return prisma.report.update({
        where: { id: reportId },
        data: {
            reviewedAt: new Date(),
            actionTaken,
            reviewedById: adminId
        },
        include: {
            reportedEvent: true,
            reportedUser: true,
            reporter: true,
            reviewedBy: true
        },
    });
};

export const findModeratorByUserId = async (adminUserId: string) => prisma.moderator.findFirst({
    where: { userId: adminUserId },
});

export const updateUserRole = async (userId: string, newRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
    });
    if (["MODERATOR", "ADMIN"].includes(newRole)) {
        const moderator = await prisma.moderator.upsert({
            where: { userId: userId },
            update: {},
            create: { userId: userId }
        });
        return { user, moderator };
    } else {
        await prisma.moderator.deleteMany({
            where: { userId: userId }
        });
    }
    return { user };
};


export const getCategoriesWithActiveCount = async () => {
  return prisma.category.findMany({
    include: {
      events: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  }).then((cats) =>
    cats.map((c) => ({
      ...c,
      activeEventCount: c.events.length,
    }))
  );
};