import { Router } from "express";
import { OrgRole } from "@prisma/client";
import { tasksController } from "./tasks.controller";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireProjectRole, requireTaskRole } from "../../middleware/rbac.middleware";
import { catchAsync } from "../../middleware/error.middleware";
import { createTaskSchema, updateTaskSchema, assignTaskSchema, changeStatusSchema, listTasksQuerySchema } from "./tasks.schema";

// Mounted at /api/v1/projects/:projectId/tasks
export const tasksNestedRouter = Router({ mergeParams: true });
tasksNestedRouter.use(requireAuth);
tasksNestedRouter.post("/", requireProjectRole(OrgRole.MEMBER), validate(createTaskSchema), catchAsync(tasksController.create));
tasksNestedRouter.get("/", requireProjectRole(OrgRole.GUEST), validate(listTasksQuerySchema), catchAsync(tasksController.list));

// Mounted at /api/v1/tasks
export const tasksStandaloneRouter = Router();
tasksStandaloneRouter.use(requireAuth);
tasksStandaloneRouter.get("/:taskId", requireTaskRole(OrgRole.GUEST), catchAsync(tasksController.getById));
tasksStandaloneRouter.patch("/:taskId", requireTaskRole(OrgRole.MEMBER), validate(updateTaskSchema), catchAsync(tasksController.update));
tasksStandaloneRouter.patch("/:taskId/assign", requireTaskRole(OrgRole.MEMBER), validate(assignTaskSchema), catchAsync(tasksController.assign));
tasksStandaloneRouter.patch("/:taskId/status", requireTaskRole(OrgRole.MEMBER), validate(changeStatusSchema), catchAsync(tasksController.changeStatus));
tasksStandaloneRouter.delete("/:taskId", requireTaskRole(OrgRole.MANAGER), catchAsync(tasksController.remove));