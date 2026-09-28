import { Request, Response, NextFunction } from "express";
import { OrgRole } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { catchAsync } from "./error.middleware";

const ROLE_RANK: Record<OrgRole, number> = {
  GUEST: 0, MEMBER: 1, MANAGER: 2, ADMIN: 3, OWNER: 4,
};

declare global {
  namespace Express {
    interface Request {
      orgRole?: OrgRole;
      orgId?: string;
    }
  }
}

async function checkMembership(orgId: string, userId: string, minimumRole: OrgRole) {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!membership) throw new AppError("You are not a member of this organization", 403);
  if (ROLE_RANK[membership.role] < ROLE_RANK[minimumRole]) {
    throw new AppError(`This action requires ${minimumRole} role or higher`, 403);
  }
  return membership.role;
}

// For routes like /organizations/:orgId/...
export function requireOrgRole(minimumRole: OrgRole) {
  return catchAsync(async (req, res, next) => {
    const role = await checkMembership(req.params.orgId, req.userId!, minimumRole);
    req.orgId = req.params.orgId;
    req.orgRole = role;
    next();
  });
}

// For routes like /projects/:projectId/... — hop project -> org first
export function requireProjectRole(minimumRole: OrgRole) {
  return catchAsync(async (req, res, next) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      select: { orgId: true },
    });
    if (!project) throw new AppError("Project not found", 404);
    const role = await checkMembership(project.orgId, req.userId!, minimumRole);
    req.orgId = project.orgId;
    req.orgRole = role;
    next();
  });
}

// For routes like /tasks/:taskId/... — hop task -> project -> org
export function requireTaskRole(minimumRole: OrgRole) {
  return catchAsync(async (req, res, next) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      select: { project: { select: { orgId: true } } },
    });
    if (!task) throw new AppError("Task not found", 404);
    const role = await checkMembership(task.project.orgId, req.userId!, minimumRole);
    req.orgId = task.project.orgId;
    req.orgRole = role;
    next();
  });
}