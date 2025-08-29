import { Router } from 'express';
import { verifyAuth } from '../controllers/auth/verify-auth.controller';
import { login } from '../controllers/auth/login.controller';
import { logout } from '../controllers/auth/logout.controller'

const router = Router();

router.get('/verify', verifyAuth);
router.post('/login', login);
router.post('/logout', logout);


export default router;
