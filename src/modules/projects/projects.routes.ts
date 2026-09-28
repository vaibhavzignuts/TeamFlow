import { Router } from "express";
import { OrgRole } from "@prisma/client";
import { projectsController } from "./projects.controller";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrgRole, requireProjectRole } from "../../middleware/rbac.middleware";
import { catchAsync } from "../../middleware/error.middleware";
import { createProjectSchema, updateProjectSchema } from "./projects.schema";

// Mounted at /api/v1/organizations/:orgId/projects
// mergeParams lets this router see :orgId from the parent path
export const projectsNestedRouter = Router({ mergeParams: true });
projectsNestedRouter.use(requireAuth);
projectsNestedRouter.post("/", requireOrgRole(OrgRole.MEMBER), validate(createProjectSchema), catchAsync(projectsController.create));
projectsNestedRouter.get("/", requireOrgRole(OrgRole.GUEST), catchAsync(projectsController.listForOrg));

// Mounted at /api/v1/projects
export const projectsStandaloneRouter = Router();
projectsStandaloneRouter.use(requireAuth);
projectsStandaloneRouter.get("/:projectId", requireProjectRole(OrgRole.GUEST), catchAsync(projectsController.getById));
projectsStandaloneRouter.patch("/:projectId", requireProjectRole(OrgRole.MANAGER), validate(updateProjectSchema), catchAsync(projectsController.update));
projectsStandaloneRouter.post("/:projectId/archive", requireProjectRole(OrgRole.MANAGER), catchAsync(projectsController.archive));
projectsStandaloneRouter.post("/:projectId/restore", requireProjectRole(OrgRole.MANAGER), catchAsync(projectsController.restore));
projectsStandaloneRouter.delete("/:projectId", requireProjectRole(OrgRole.ADMIN), catchAsync(projectsController.remove));