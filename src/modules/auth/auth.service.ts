import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { generateSecureToken } from "../../utils/token";

const REFRESH_TOKEN_DAYS = 7;
const RESET_TOKEN_MINUTES = 30;
const VERIFY_TOKEN_HOURS = 24;

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const addMinutes = (d: Date, n: number) => new Date(d.getTime() + n * 60000);
const addHours = (d: Date, n: number) => new Date(d.getTime() + n * 3600000);

// Creates a DB row (one row = one device), signs a refresh token containing
// that row's id, then saves the signed token back on the row.
async function issueTokenPair(userId: string, device?: string, ip?: string) {
  const row = await prisma.refreshToken.create({
    data: {
      token: "placeholder", // real value written below, once we know row.id
      userId,
      device,
      ip,
      expiresAt: addDays(new Date(), REFRESH_TOKEN_DAYS),
    },
  });

  const refreshToken = signRefreshToken({ userId, tokenId: row.id });
  await prisma.refreshToken.update({ where: { id: row.id }, data: { token: refreshToken } });

  const accessToken = signAccessToken({ userId });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("An account with this email already exists", 409);

    const user = await prisma.user.create({
      data: { name, email, password: await hashPassword(password) },
    });

    const verifyToken = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: {
        token: verifyToken,
        userId: user.id,
        expiresAt: addHours(new Date(), VERIFY_TOKEN_HOURS),
      },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      devOnlyVerifyToken: verifyToken, // TEMP: emailed for real in Phase 3
    };
  },

  async login(email: string, password: string, device?: string, ip?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password", 401);

    if (!(await comparePassword(password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = await issueTokenPair(user.id, device, ip);
    return { user: { id: user.id, name: user.name, email: user.email }, ...tokens };
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (!stored || stored.revoked || stored.token !== refreshToken) {
      throw new AppError("Refresh token has been revoked", 401);
    }
    if (stored.expiresAt < new Date()) throw new AppError("Refresh token expired", 401);

    // Rotation: kill the old one, issue a new pair
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    return issueTokenPair(payload.userId, stored.device ?? undefined, stored.ip ?? undefined);
  },

  async listSessions(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
      select: { id: true, device: true, ip: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.refreshToken.findUnique({ where: { id: sessionId } });
    // Check userId so you can't revoke someone else's session
    if (!session || session.userId !== userId) throw new AppError("Session not found", 404);
    await prisma.refreshToken.update({ where: { id: sessionId }, data: { revoked: true } });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { devOnlyResetToken: null }; // don't reveal the email doesn't exist

    const resetToken = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: addMinutes(new Date(), RESET_TOKEN_MINUTES),
      },
    });
    return { devOnlyResetToken: resetToken };
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const hashed = await hashPassword(newPassword);
    // $transaction = all three succeed together or none do
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);
  },

  async verifyEmail(token: string) {
    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new AppError("Invalid or expired verification token", 400);
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);
    if (!(await comparePassword(currentPassword, user.password))) {
      throw new AppError("Current password is incorrect", 401);
    }
    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(newPassword) },
    });
  },

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new AppError("User not found", 404);
    return user;
  },
};