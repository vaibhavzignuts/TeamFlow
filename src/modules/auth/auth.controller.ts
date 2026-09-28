import { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response) {
    const { email, password, device } = req.body;
    const result = await authService.login(email, password, device, req.ip);
    res.status(200).json({ success: true, data: result });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.body.refreshToken);
    res.status(200).json({ success: true, message: "Logged out" });
  },

  async refresh(req: Request, res: Response) {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.status(200).json({ success: true, data: tokens });
  },

  async listSessions(req: Request, res: Response) {
    const sessions = await authService.listSessions(req.userId!);
    res.status(200).json({ success: true, data: sessions });
  },

  async revokeSession(req: Request, res: Response) {
    await authService.revokeSession(req.userId!, req.params.sessionId);
    res.status(200).json({ success: true, message: "Session revoked" });
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent",
      ...(result.devOnlyResetToken && { devOnlyResetToken: result.devOnlyResetToken }),
    });
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ success: true, message: "Password has been reset" });
  },

  async verifyEmail(req: Request, res: Response) {
    await authService.verifyEmail(req.body.token);
    res.status(200).json({ success: true, message: "Email verified" });
  },

  async changePassword(req: Request, res: Response) {
    await authService.changePassword(req.userId!, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ success: true, message: "Password changed" });
  },

  async updateProfile(req: Request, res: Response) {
    const user = await authService.updateProfile(req.userId!, req.body);
    res.status(200).json({ success: true, data: user });
  },

  async getMe(req: Request, res: Response) {
    const user = await authService.getMe(req.userId!);
    res.status(200).json({ success: true, data: user });
  },
};