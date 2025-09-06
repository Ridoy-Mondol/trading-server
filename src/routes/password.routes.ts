import { Router } from 'express';
import { changePassword } from '../controllers/password/change.controller'
import { forgotPasswordOTP } from '../controllers/password/forget/send-otp.controller'
import { verifyForgotPasswordOTP } from '../controllers/password/forget/verify.controller'

const router = Router();

router.patch('/change', changePassword);
router.post('/forgot/request', forgotPasswordOTP);
router.post('/forgot/verify-otp', verifyForgotPasswordOTP);

export default router;