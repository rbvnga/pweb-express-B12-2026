import { Router } from "express";
import { buyHero } from "../controllers/purchase.controller.js";

const router = Router();

router.post("/:player_id/heroes", buyHero);

export default router;
