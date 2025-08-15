import { Router } from 'express';
import { signup } from '../controllers/register.controller';
import { login } from '../controllers/login.controller';
import { sendOTP } from '../controllers/send-otp.controller';
import { verifyOTP } from '../controllers/verify-otp.controller';

const router = Router();

router.post('/signup', signup);
router.post('/signup/send-otp', sendOTP);
router.post('/signup/verify-otp', verifyOTP);
router.post('/login', login);

export default router;
