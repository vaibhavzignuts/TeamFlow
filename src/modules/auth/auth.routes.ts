import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../middleware/error.middleware";
import {
  registerSchema, loginSchema, refreshSchema, forgotPasswordSchema,
  resetPasswordSchema, verifyEmailSchema, changePasswordSchema, updateProfileSchema,
} from "./auth.schema";

const router = Router();

// Public
router.post("/register", validate(registerSchema), catchAsync(authController.register));
router.post("/login", validate(loginSchema), catchAsync(authController.login));
router.post("/refresh", validate(refreshSchema), catchAsync(authController.refresh));
router.post("/logout", validate(refreshSchema), catchAsync(authController.logout));
router.post("/forgot-password", validate(forgotPasswordSchema), catchAsync(authController.forgotPassword));
router.post("/reset-password", validate(resetPasswordSchema), catchAsync(authController.resetPassword));
router.post("/verify-email", validate(verifyEmailSchema), catchAsync(authController.verifyEmail));

// Protected (needs a valid access token)
router.get("/me", requireAuth, catchAsync(authController.getMe));
router.patch("/me", requireAuth, validate(updateProfileSchema), catchAsync(authController.updateProfile));
router.post("/change-password", requireAuth, validate(changePasswordSchema), catchAsync(authController.changePassword));
router.get("/sessions", requireAuth, catchAsync(authController.listSessions));
router.delete("/sessions/:sessionId", requireAuth, catchAsync(authController.revokeSession));

export default router;