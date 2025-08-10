import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma-client';
import { Provider } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, phone, password, authProvider } = req.body;

    if (![Provider.EMAIL, Provider.PHONE].includes(authProvider)) {
      return res.status(400).json({ message: 'Invalid auth provider' });
    }

    if (authProvider === Provider.EMAIL && !email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (authProvider === Provider.PHONE && !phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await prisma.user.findFirst({
      where: authProvider === Provider.EMAIL
        ? { email }
        : { phone }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '10d' });

    return res.status(200).json({
      token,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        authProvider: user.authProvider
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
