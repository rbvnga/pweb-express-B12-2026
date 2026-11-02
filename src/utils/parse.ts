import { HttpError } from "./httpError.js";

// Ubah "12" -> 12, dan tolak nilai yang bukan bilangan bulat positif
export const parseId = (value: unknown, label = "ID"): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} harus berupa bilangan bulat positif`);
  }
  return id;
};
