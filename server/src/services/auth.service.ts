// Auth service — registration, login, JWT management
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { mailService } from './mail.service';

const GTU_DOMAIN = '@gtu.edu.tr';
const BCRYPT_ROUNDS = 12;

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
      adoptions: { select: { treeId: true } },
      _count: { select: { adoptions: true, wateringEvents: true } },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    points: user.points,
    adoptedTreeCount: user._count.adoptions,
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

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('This email is already registered');
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestError('Password must contain at least 8 characters, one uppercase letter, and one number');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verifyToken = jwt.sign({ email: email.toLowerCase().trim() }, config.jwt.secret as string, { expiresIn: '1d' });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        verifyToken,
      },
    });

    await mailService.sendVerificationEmail(email.toLowerCase().trim(), verifyToken);

    return { message: 'Registration successful. Please check your email for the verification link.', userId: user.id };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Your account is not verified. Please check your email.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user.id, user.role);
    const userResponse = await formatUserResponse(user.id);

    return { token, user: userResponse };
  },

  async me(userId: string) {
    return formatUserResponse(userId);
  },

  async verifyEmail(token: string) {
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret as string) as { email: string };
    } catch (e) {
      throw new BadRequestError('Invalid or expired verification link');
    }

    const user = await prisma.user.findFirst({
      where: { email: decoded.email, verifyToken: token }
    });

    if (!user) {
      throw new BadRequestError('Account already verified or invalid link');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null
      }
    });

    return { message: 'Account verified successfully. You can now log in.' };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (user) {
      // TODO: Implement actual email sending (e.g., via Resend or SendGrid)
      console.log(`[Auth] Password reset requested for ${email}`);
    }

    return { message: 'Password reset link sent to your email.' };
  },

  async registerPushToken(userId: string, expoPushToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });
    return { message: 'Push token saved' };
  },
};
