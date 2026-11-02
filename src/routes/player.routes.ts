import { Router } from "express";
import {
  createPlayer,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  topUp,
  playMatch,
} from "../controllers/player.controller.js";

const router = Router();

// Fitur 4: Player
router.post("/", createPlayer);
router.get("/:player_id", getPlayerById);
router.patch("/:player_id", updatePlayer);
router.delete("/:player_id", deletePlayer);

// Fitur 5: Top Up & Match
router.post("/:player_id/topup", topUp);
router.post("/:player_id/matches", playMatch);

export default router;
