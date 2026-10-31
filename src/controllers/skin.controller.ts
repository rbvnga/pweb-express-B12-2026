import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Rarity } from "../generated/prisma/enums.js";
import { HttpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination, buildMetadata } from "../utils/pagination.js";

const rarities = Object.values(Rarity) as string[];

export const getSkins = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const rarity = req.query.rarity ? String(req.query.rarity).toUpperCase() : undefined;
  const heroId = req.query.heroId ? Number(req.query.heroId) : undefined;

  if (heroId !== undefined && !Number.isInteger(heroId)) {
    throw new HttpError(400, "heroId harus berupa angka");
  }
  if (rarity && !rarities.includes(rarity)) {
    throw new HttpError(400, `Rarity tidak valid. Pilihan: ${rarities.join(", ")}`);
  }

  const where = {
    ...(heroId !== undefined && { heroId }),
    ...(rarity && { rarity: rarity as Rarity }),
  };

  const [skins, totalItems] = await Promise.all([
    prisma.skin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: "asc" },
      include: { hero: { select: { name: true } } },
    }),
    prisma.skin.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data skin", skins, buildMetadata(page, limit, totalItems));
};

export const getSkinById = async (req: Request, res: Response) => {
  const id = Number(req.params.skin_id);
  if (!Number.isInteger(id)) throw new HttpError(400, "ID skin tidak valid");

  const skin = await prisma.skin.findUnique({
    where: { id },
    include: { hero: true },
  });
  if (!skin) throw new HttpError(404, "Skin tidak ditemukan");

  sendSuccess(res, 200, "Berhasil mengambil detail skin", skin);
};