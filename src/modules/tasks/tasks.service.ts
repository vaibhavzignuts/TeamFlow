import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { TaskStatus, TaskPriority } from "@prisma/client";

async function assertUserIsOrgMember(orgId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!membership) throw new AppError("Assignee must be a member of the organization", 400);
}

export const tasksService = {
  async create(
    projectId: string,
    reporterId: string,
    data: { title: string; description?: string; priority?: TaskPriority; assigneeId?: string; dueDate?: Date }
  ) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError("Project not found", 404);

    if (data.assigneeId) await assertUserIsOrgMember(project.orgId, data.assigneeId);

    return prisma.task.create({ data: { projectId, reporterId, ...data } });
  },

  async list(
    projectId: string,
    filters: { status?: TaskStatus; assigneeId?: string; page?: number; pageSize?: number }
  ) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const where = {
      projectId,
      ...(filters.status && { status: filters.status }),
      ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    };

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          reporter: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, orgId: true } },
      },
    });
    if (!task) throw new AppError("Task not found", 404);
    return task;
  },

  async update(
    taskId: string,
    data: { title?: string; description?: string; priority?: TaskPriority; dueDate?: Date | null }
  ) {
    return prisma.task.update({ where: { id: taskId }, data });
  },

  async assign(taskId: string, assigneeId: string | null) {
    if (assigneeId) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
      if (!task) throw new AppError("Task not found", 404);
      await assertUserIsOrgMember(task.project.orgId, assigneeId);
    }
    return prisma.task.update({ where: { id: taskId }, data: { assigneeId } });
  },

  async changeStatus(taskId: string, status: TaskStatus) {
    return prisma.task.update({ where: { id: taskId }, data: { status } });
  },

  async remove(taskId: string) {
    await prisma.task.delete({ where: { id: taskId } });
  },
};