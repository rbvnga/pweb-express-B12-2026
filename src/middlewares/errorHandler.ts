import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ status: false, message: err.message });
  }
  // JSON body rusak dari express.json()
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ status: false, message: "Format JSON tidak valid" });
  }
  console.error(err);
  return res.status(500).json({ status: false, message: "Terjadi kesalahan pada server" });
};