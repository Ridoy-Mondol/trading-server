import { Router } from "express";
import { getNonce } from "../controllers/wallet/nonce.controller";
import { verifyWallet } from "../controllers/wallet/verify.controller";

const router = Router();

router.get("/nonce", getNonce);
router.post("/verify", verifyWallet);

export default router;
