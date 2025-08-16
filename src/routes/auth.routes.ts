import { Router } from 'express';
import { verifyAuth } from '../controllers/verify-auth.controller';

const router = Router();

router.get('/verify', verifyAuth);

export default router;
