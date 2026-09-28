import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";

export const projectsService = {
  async create(orgId: string, name: string, description?: string) {
    return prisma.project.create({ data: { orgId, name, description } });
  },

  async listForOrg(orgId: string) {
    return prisma.project.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } });
  },

  async getById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!project) throw new AppError("Project not found", 404);
    return project;
  },

  async update(projectId: string, data: { name?: string; description?: string }) {
    return prisma.project.update({ where: { id: projectId }, data });
  },

  async archive(projectId: string) {
    return prisma.project.update({ where: { id: projectId }, data: { isArchived: true } });
  },

  async restore(projectId: string) {
    return prisma.project.update({ where: { id: projectId }, data: { isArchived: false } });
  },

  async remove(projectId: string) {
    await prisma.project.delete({ where: { id: projectId } }); // cascades to tasks
  },
};