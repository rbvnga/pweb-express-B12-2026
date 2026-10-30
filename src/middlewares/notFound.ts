import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.js";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new HttpError(404, "Endpoint tidak ditemukan"));
};