// Auth service — registration, login, JWT management
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';

const GTU_DOMAIN = '@gtu.edu.tr';
const BCRYPT_ROUNDS = 12;

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  points: number;
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
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    points: user.points,
    adoptedTreeIds: user.adoptions.map((a) => a.treeId),
  };
}

export const authService = {
  async register(name: string, email: string, password: string) {
    // Validate GTU email domain
    if (!email.toLowerCase().endsWith(GTU_DOMAIN)) {
      throw new BadRequestError('Yalnızca GTU e-posta adresleri kabul edilir (@gtu.edu.tr)');
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('Bu e-posta adresi zaten kayıtlı');
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestError('Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    return { message: 'Kayıt başarılı. Giriş yapabilirsiniz.', userId: user.id };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('E-posta veya şifre hatalı');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('E-posta veya şifre hatalı');
    }

    const token = generateToken(user.id, user.role);
    const userResponse = await formatUserResponse(user.id);

    return { token, user: userResponse };
  },

  async me(userId: string) {
    return formatUserResponse(userId);
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

    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' };
  },

  async registerPushToken(userId: string, expoPushToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });
    return { message: 'Push token kaydedildi' };
  },
};
