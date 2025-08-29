import { Router } from 'express';
import { signup } from '../controllers/signup/register.controller';
import { sendOTP } from '../controllers/signup/send-otp.controller';
import { verifyOTP } from '../controllers/signup/verify-otp.controller';

const router = Router();

router.post('/signup', signup);
router.post('/signup/send-otp', sendOTP);
router.post('/signup/verify-otp', verifyOTP);

export default router;
