import { Router } from 'express';
import { setup2FA } from "../controllers/twoFA/setup";
import { verify2FA } from "../controllers/twoFA/verify";
import { disable2FA } from "../controllers/twoFA/disable";

const router = Router();

router.post("/setup", setup2FA);
router.post("/verify", verify2FA);
router.post("/disable", disable2FA);


export default router;
