import { z } from "zod";

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(5000).optional(),
    priority: priorityEnum.optional(),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.coerce.date().optional(),
  }),
  params: z.object({ projectId: z.string().uuid() }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    priority: priorityEnum.optional(),
    dueDate: z.coerce.date().nullable().optional(),
  }),
});

export const assignTaskSchema = z.object({
  body: z.object({ assigneeId: z.string().uuid().nullable() }),
});

export const changeStatusSchema = z.object({
  body: z.object({ status: statusEnum }),
});

export const listTasksQuerySchema = z.object({
  query: z.object({
    status: statusEnum.optional(),
    assigneeId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  }),
});