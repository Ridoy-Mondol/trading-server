import { Router } from 'express';
import { getSessions } from '../controllers/sessions.controller';

const router = Router();

router.get('/', getSessions);

export default router;