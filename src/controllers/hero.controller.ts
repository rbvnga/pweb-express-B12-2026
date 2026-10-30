import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Role, Lane } from "../generated/prisma/enums.js";
import { HttpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination, buildMetadata } from "../utils/pagination.js";

const roles = Object.values(Role) as string[];
const lanes = Object.values(Lane) as string[];

export const getHeroes = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const search = req.query.search ? String(req.query.search) : undefined;
  const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;

  if (role && !roles.includes(role)) {
    throw new HttpError(400, `Role tidak valid. Pilihan: ${roles.join(", ")}`);
  }

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(role && { role: role as Role }),
  };

  const [heroes, totalItems] = await Promise.all([
    prisma.hero.findMany({ where, skip, take: limit, orderBy: { id: "asc" } }),
    prisma.hero.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data hero", heroes, buildMetadata(page, limit, totalItems));
};

export const getHeroById = async (req: Request, res: Response) => {
  const id = Number(req.params.hero_id);
  if (!Number.isInteger(id)) throw new HttpError(400, "ID hero tidak valid");

  const hero = await prisma.hero.findUnique({
    where: { id },
    include: { skins: true },
  });
  if (!hero) throw new HttpError(404, "Hero tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil detail hero", hero);
};

export const createHero = async (req: Request, res: Response) => {
  const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body ?? {};

  if (!name || !role || !lane || releaseYear === undefined || releaseYear === null || releaseYear === "") {
    throw new HttpError(400, "name, role, lane, dan releaseYear wajib diisi");
  }
  if (!roles.includes(role)) throw new HttpError(400, `Role tidak valid. Pilihan: ${roles.join(", ")}`);
  if (!lanes.includes(lane)) throw new HttpError(400, `Lane tidak valid. Pilihan: ${lanes.join(", ")}`);
  if (!Number.isInteger(Number(releaseYear))) throw new HttpError(400, "releaseYear harus berupa angka");

  const existing = await prisma.hero.findUnique({ where: { name } });
  if (existing) throw new HttpError(409, "Nama hero sudah ada");

  const hero = await prisma.hero.create({
    data: {
      name,
      role,
      lane,
      releaseYear: Number(releaseYear),
      priceBP: priceBP ?? null,
      priceDiamond: priceDiamond ?? null,
    },
  });

  sendSuccess(res, 201, "Hero berhasil dibuat", hero);
};