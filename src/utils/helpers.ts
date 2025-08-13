import crypto from 'crypto';
import prisma from '../config/prisma-client';

export const generateUsername = async (email: string): Promise<string> => {
  const baseUsername = email.split('@')[0].toLowerCase();
  let username = baseUsername;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${baseUsername}${suffix}`;
    suffix++;
  }

  return username;
};

export const generateApiKey = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

export const generateReferralLink = (username: string): string => {
  return `${process.env.FRONTEND_ORIGIN}/sign-up?ref=${username}`;
};
