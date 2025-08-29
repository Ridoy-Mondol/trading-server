import { Router } from 'express';
import { googleLoginRedirect } from "../controllers/google/googleRedirect.controller";
import { googleCallback } from "../controllers/google/googleCallback.controller";

const router = Router();

router.get("/", googleLoginRedirect);
router.get("/callback", googleCallback);


export default router;
