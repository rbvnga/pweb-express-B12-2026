import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Currency } from "../generated/prisma/client.js";
import { HttpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/response.js";

const currencies = Object.values(Currency) as string[];

export const buyHero = async (req: Request, res: Response) => {
  const playerId = Number(req.params.player_id);
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { heroId, currency } = req.body ?? {};
  const parsedHeroId = Number(heroId);

  // 1. heroId kosong, atau currency bukan BP/DIAMOND -> 400
  if (
    heroId === undefined ||
    heroId === null ||
    heroId === "" ||
    !Number.isInteger(parsedHeroId) ||
    !currency ||
    !currencies.includes(currency)
  ) {
    throw new HttpError(400, "heroId dan currency (BP atau DIAMOND) wajib diisi dengan benar");
  }

  // 2. Player tidak ditemukan -> 404
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // 3. Hero tidak ditemukan -> 404
  const hero = await prisma.hero.findUnique({
    where: { id: parsedHeroId },
  });
  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  // 4. Harga hero untuk currency tersebut kosong -> 400
  const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
  if (price === null) {
    throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
  }

  // 5. Player sudah memiliki hero tersebut -> 409
  const existingOwnership = await prisma.playerHero.findUnique({
    where: {
      playerId_heroId: {
        playerId,
        heroId: parsedHeroId,
      },
    },
  });
  if (existingOwnership) {
    throw new HttpError(409, `Player sudah memiliki hero ${hero.name}`);
  }

  // 6. Saldo player kurang dari harga hero -> 400
  const currentBalance = currency === "BP" ? player.bp : player.diamond;
  if (currentBalance < price) {
    throw new HttpError(400, `Saldo ${currency} tidak mencukupi`);
  }

  // Simpan dengan transaction: kurangi saldo (decrement) & buat data PlayerHero
  const [updatedPlayer] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data:
        currency === "BP"
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } },
    }),
    prisma.playerHero.create({
      data: {
        playerId,
        heroId: parsedHeroId,
        currency: currency as Currency,
        pricePaid: price,
      },
    }),
  ]);

  sendSuccess(res, 201, "Hero berhasil dibeli", {
    hero: {
      id: hero.id,
      name: hero.name,
    },
    currency,
    pricePaid: price,
    balance: {
      bp: updatedPlayer.bp,
      diamond: updatedPlayer.diamond,
    },
  });
};
