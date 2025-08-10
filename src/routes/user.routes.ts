import { Router } from 'express';
import { signup } from '../controllers/register.controller';
import { login } from '../controllers/login.controller';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);

export default router;
