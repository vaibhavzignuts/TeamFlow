import { Router } from "express";
import { OrgRole } from "@prisma/client";
import { organizationsController } from "./organizations.controller";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrgRole } from "../../middleware/rbac.middleware";
import { catchAsync } from "../../middleware/error.middleware";
import { createOrgSchema, updateOrgSchema, addMemberSchema, updateMemberRoleSchema } from "./organizations.schema";

const router = Router();
router.use(requireAuth); // every route below needs a logged-in user

router.post("/", validate(createOrgSchema), catchAsync(organizationsController.create));
router.get("/", catchAsync(organizationsController.listMine));

// GUEST is the lowest rank, so this means "any member of the org"
router.get("/:orgId", requireOrgRole(OrgRole.GUEST), catchAsync(organizationsController.getById));

router.patch("/:orgId", requireOrgRole(OrgRole.ADMIN), validate(updateOrgSchema), catchAsync(organizationsController.update));
router.delete("/:orgId", requireOrgRole(OrgRole.OWNER), catchAsync(organizationsController.remove));

router.post("/:orgId/members", requireOrgRole(OrgRole.ADMIN), validate(addMemberSchema), catchAsync(organizationsController.addMember));
router.delete("/:orgId/members/:memberId", requireOrgRole(OrgRole.ADMIN), catchAsync(organizationsController.removeMember));
router.patch("/:orgId/members/:memberId/role", requireOrgRole(OrgRole.ADMIN), validate(updateMemberRoleSchema), catchAsync(organizationsController.updateMemberRole));

export default router;