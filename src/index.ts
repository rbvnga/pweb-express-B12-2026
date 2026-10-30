import "dotenv/config";
import express from "express";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import heroRoutes from "./routes/hero.routes.js";
import skinRoutes from "./routes/skin.routes.js";

const app = express();
app.use(express.json());
app.use(logger);

app.get("/health", (req, res) => {
  res.json({ status: true, message: "MLBB Shop API berjalan" });
});

app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);
// nanti: players, statistics

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));