import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import xprRoutes from './xpr.routes'

const router = Router();

router.use('/', userRoutes);
router.use('/auth', authRoutes);
router.use('/xpr', xprRoutes);

export default router;
