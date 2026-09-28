import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    description: z.string().max(2000).optional(),
  }),
  params: z.object({ orgId: z.string().uuid() }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().max(2000).optional(),
  }),
});