import { Router } from 'express';
import { changePassword } from '../controllers/password/change.controller'

const router = Router();

router.patch('/change', changePassword);

export default router;