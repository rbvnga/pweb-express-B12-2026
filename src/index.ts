import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma.js";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/response.js";
import heroRoutes from "./routes/hero.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import statisticsRoutes from "./routes/statistics.routes.js";

const app = express();

app.use(logger);
app.use(express.json());

// check endpoint
app.get("/", (_req, res) => {
  res.status(200).send("Server is up and running 💫");
});

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  sendSuccess(res, 200, "Server dan database OK");
});

app.use("/api/heroes", heroRoutes);
app.use("/api/players", purchaseRoutes);
app.use("/api/statistics", statisticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, (error?: Error) => {
  if (error) throw error; // Express 5: error saat listen (mis. port dipakai) dikirim ke callback
  console.log(`Express is running on Port ${PORT}`);
});
