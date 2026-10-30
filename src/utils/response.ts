import { Response } from "express";

export const sendSuccess = (
  res: Response,
  status: number,
  message: string,
  data?: unknown,
  metadata?: unknown
) => {
  const body: Record<string, unknown> = { status: true, message };
  if (data !== undefined) body.data = data;
  if (metadata !== undefined) body.metadata = metadata;
  return res.status(status).json(body);
};