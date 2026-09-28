import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { OrgRole } from "@prisma/client";

// "My Startup" -> "my-startup"
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "org";
  let slug = base;
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break;
  }
  return slug;
}

export const organizationsService = {
  async create(ownerId: string, name: string) {
    const slug = await generateUniqueSlug(name);
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name, slug, ownerId } });
      await tx.organizationMember.create({
        data: { orgId: org.id, userId: ownerId, role: OrgRole.OWNER },
      });
      return org;
    });
  },

  async listForUser(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: { org: true },
      orderBy: { joinedAt: "desc" },
    });
    return memberships.map((m) => ({ ...m.org, myRole: m.role }));
  },

  async getById(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });
    if (!org) throw new AppError("Organization not found", 404);
    return org;
  },

  async update(orgId: string, data: { name?: string }) {
    return prisma.organization.update({ where: { id: orgId }, data });
  },

  async delete(orgId: string) {
    // Members, projects, and tasks are deleted too (onDelete: Cascade in schema)
    await prisma.organization.delete({ where: { id: orgId } });
  },

  async addMember(orgId: string, userId: string, role: OrgRole) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const existing = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
    if (existing) throw new AppError("User is already a member of this organization", 409);

    return prisma.organizationMember.create({ data: { orgId, userId, role } });
  },

  async removeMember(orgId: string, memberId: string) {
    const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
    // member.orgId check stops you from deleting a member of a DIFFERENT org
    if (!member || member.orgId !== orgId) throw new AppError("Member not found", 404);
    if (member.role === OrgRole.OWNER) throw new AppError("Cannot remove the organization owner", 400);
    await prisma.organizationMember.delete({ where: { id: memberId } });
  },

  async updateMemberRole(orgId: string, memberId: string, role: OrgRole) {
    const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== orgId) throw new AppError("Member not found", 404);
    if (member.role === OrgRole.OWNER) throw new AppError("Cannot change the owner's role", 400);
    return prisma.organizationMember.update({ where: { id: memberId }, data: { role } });
  },
};