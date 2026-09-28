import { z } from "zod";

export const createOrgSchema = z.object({
  body: z.object({ name: z.string().min(2).max(100) }),
});

export const updateOrgSchema = z.object({
  body: z.object({ name: z.string().min(2).max(100).optional() }),
  params: z.object({ orgId: z.string().uuid() }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    role: z.enum(["ADMIN", "MANAGER", "MEMBER", "GUEST"]),
  }),
  params: z.object({ orgId: z.string().uuid() }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({ role: z.enum(["ADMIN", "MANAGER", "MEMBER", "GUEST"]) }),
  params: z.object({ orgId: z.string().uuid(), memberId: z.string().uuid() }),
});