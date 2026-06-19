// Auth service — registration, login, JWT management
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { mailService } from './mail.service';

const GTU_DOMAIN = '@gtu.edu.tr';
const BCRYPT_ROUNDS = 12;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTPExpiryTime(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  points: number;
  adoptedTreeCount: number;
  totalWaterings: number;
  adoptedTreeIds: string[];
}

function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role } as object,
    config.jwt.secret as jwt.Secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

async function formatUserResponse(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      adoptions: {
        where: { tree: { is: { status: { not: 'REMOVED' } } } },
        select: { treeId: true },
      },
      _count: { select: { wateringEvents: true } },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    points: user.points,
    adoptedTreeCount: user.adoptions.length,
    totalWaterings: user._count.wateringEvents,
    adoptedTreeIds: user.adoptions.map((a) => a.treeId),
  };
}

export const authService = {
  async register(name: string, email: string, password: string) {
    // Validate GTU email domain
    if (!email.toLowerCase().endsWith(GTU_DOMAIN)) {
      throw new BadRequestError('Only @gtu.edu.tr emails are allowed');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing?.isVerified) {
      throw new ConflictError('This email is already registered');
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestError('Password must contain at least 8 characters, one uppercase letter, and one number');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    const verifyCodeRaw = generateOTP();
    const verifyCodeHash = await bcrypt.hash(verifyCodeRaw, BCRYPT_ROUNDS);
    const verifyCodeExpiresAt = getOTPExpiryTime();

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name.trim(),
            passwordHash,
            verifyCode: verifyCodeHash,
            verifyCodeExpiresAt
          },
        })
      : await prisma.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            verifyCode: verifyCodeHash,
            verifyCodeExpiresAt
          },
        });

    try {
      await mailService.sendVerificationCode(normalizedEmail, verifyCodeRaw);
    } catch (error) {
      if (!existing) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      throw error;
    }

    return {
      message: 'Registration successful. Please check your email for the verification code.',
      userId: user.id,
      verificationEmailSent: true,
    };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('This account does not exist. Please register first.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Hesabınız henüz doğrulanmamış. Kayıt sırasında gönderilen doğrulama kodunu girin.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Password incorrect');
    }

    const token = generateToken(user.id, user.role);
    const userResponse = await formatUserResponse(user.id);

    return { token, user: userResponse };
  },

  async me(userId: string) {
    return formatUserResponse(userId);
  },

  async verifyCode(email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestError('Account is already verified');
    }

    if (!user.verifyCode || !user.verifyCodeExpiresAt || user.verifyCodeExpiresAt < new Date()) {
      throw new BadRequestError('Verification code expired or invalid');
    }

    const isValid = await bcrypt.compare(code, user.verifyCode);
    if (!isValid) {
      throw new BadRequestError('Invalid verification code');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyCode: null,
        verifyCodeExpiresAt: null
      }
    });

    return { message: 'Account verified successfully. You can now log in.' };
  },

  async resendVerificationCode(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // Don't leak user existence
      return { message: 'If the email is registered, a code has been sent.' };
    }

    if (user.isVerified) {
      throw new BadRequestError('Account is already verified');
    }

    // Rate limiting: 60 seconds
    if (user.verifyCodeExpiresAt) {
      const timeSinceLastCode = 10 * 60 * 1000 - (user.verifyCodeExpiresAt.getTime() - Date.now()); // 10 min - remaining time
      if (timeSinceLastCode < 60 * 1000) {
         throw new BadRequestError('Lütfen yeni kod istemeden önce 60 saniye bekleyin.');
      }
    }

    const verifyCodeRaw = generateOTP();
    const verifyCodeHash = await bcrypt.hash(verifyCodeRaw, BCRYPT_ROUNDS);
    const verifyCodeExpiresAt = getOTPExpiryTime();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyCode: verifyCodeHash,
        verifyCodeExpiresAt
      }
    });

    await mailService.sendVerificationCode(normalizedEmail, verifyCodeRaw);

    return { message: 'A new verification code has been sent to your email.' };
  },

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (user) {
      const resetCodeRaw = generateOTP();
      const resetCodeHash = await bcrypt.hash(resetCodeRaw, BCRYPT_ROUNDS);
      const resetCodeExpiresAt = getOTPExpiryTime();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetCode: resetCodeHash,
          resetCodeExpiresAt
        }
      });
      await mailService.sendPasswordResetCode(normalizedEmail, resetCodeRaw);
    }

    return { message: 'Password reset link sent to your email.' };
  },

  async verifyResetCode(email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.resetCode || !user.resetCodeExpiresAt || user.resetCodeExpiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset code');
    }

    const isValid = await bcrypt.compare(code, user.resetCode);
    if (!isValid) {
      throw new BadRequestError('Invalid reset code');
    }

    // Generate a short-lived token to be used in the actual resetPassword call
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'password-reset-verified' },
      config.jwt.secret as string,
      { expiresIn: '5m' }
    );

    // Clean up reset code
    await prisma.user.update({
        where: { id: user.id },
        data: { resetCode: null, resetCodeExpiresAt: null }
    });

    return { resetToken, message: 'Code verified successfully.' };
  },

  async resetPassword(token: string, password: string) {
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestError('Password must contain at least 8 characters, one uppercase letter, and one number');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret as string) as { email: string; purpose?: string };
    } catch {
      throw new BadRequestError('Invalid or expired password reset session');
    }

    if (decoded.purpose !== 'password-reset-verified') {
      throw new BadRequestError('Invalid password reset session');
    }

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) {
      throw new BadRequestError('Invalid user');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully. You can now log in.' };
  },

  async registerPushToken(userId: string, expoPushToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });
    return { message: 'Push token saved' };
  },

  async updateProfile(userId: string, updates: { name?: string }) {
    if (updates.name && updates.name.trim().length === 0) {
      throw new BadRequestError('Name cannot be empty');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.name ? { name: updates.name.trim() } : {}),
      },
    });

    return formatUserResponse(updatedUser.id);
  },
};
