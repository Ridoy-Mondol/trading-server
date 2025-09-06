import { Router } from 'express';
import { changePassword } from '../controllers/password/change.controller'
import { forgotPasswordOTP } from '../controllers/password/forget/send-otp.controller'
import { verifyForgotPasswordOTP } from '../controllers/password/forget/verify.controller'
import { resetForgotPassword } from '../controllers/password/forget/reset.controller'

const router = Router();

router.patch('/change', changePassword);
router.post('/forgot/request', forgotPasswordOTP);
router.post('/forgot/verify-otp', verifyForgotPasswordOTP);
router.patch('/forgot/reset', resetForgotPassword);

export default router;