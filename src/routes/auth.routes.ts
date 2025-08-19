import { Router } from 'express';
import { verifyAuth } from '../controllers/verify-auth.controller';
import { googleLoginRedirect } from "../controllers/googleRedirect.controller";
import { googleCallback } from "../controllers/googleCallback.controller";

const router = Router();

router.get('/verify', verifyAuth);
router.get("/google", googleLoginRedirect);
router.get("/google/callback", googleCallback);


export default router;
