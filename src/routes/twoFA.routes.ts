import { Router } from 'express';
import { setup2FA } from "../controllers/twoFA/setup";
import { verify2FA } from "../controllers/twoFA/verify";

const router = Router();

router.post("/setup", setup2FA);
router.post("/verify", verify2FA);


export default router;
