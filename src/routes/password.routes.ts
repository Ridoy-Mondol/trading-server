import { Router } from 'express';
import { changePassword } from '../controllers/password/change.controller'
import { forgotPasswordOTP } from '../controllers/password/forget/send-otp.controller'

const router = Router();

router.patch('/change', changePassword);
router.post('/forgot/request', forgotPasswordOTP);

export default router;