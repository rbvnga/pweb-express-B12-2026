import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/response.js";
import { parseId } from "../utils/parse.js";

// Kolom player yang dikirim ke client
const playerSelect = {
  id: true,
  nickname: true,
  bp: true,
  diamond: true,
  createdAt: true,
};

// Hadiah BP untuk setiap hasil match
const MATCH_REWARD: Record<string, number> = {
  WIN: 300,
  LOSE: 100,
};

// nickname dianggap kosong jika bukan string atau hanya berisi spasi
const isEmptyNickname = (nickname: unknown): boolean =>
  typeof nickname !== "string" || nickname.trim() === "";

// ===================== FITUR 4: PLAYER =====================

// POST /api/players
export const createPlayer = async (req: Request, res: Response) => {
  const { nickname } = req.body ?? {};

  // 1. nickname kosong -> 400
  if (isEmptyNickname(nickname)) {
    throw new HttpError(400, "nickname wajib diisi");
  }
  const cleanNickname = nickname.trim();

  // 2. nickname sudah dipakai -> 409
  const existing = await prisma.player.findUnique({ where: { nickname: cleanNickname } });
  if (existing) {
    throw new HttpError(409, `Nickname ${cleanNickname} sudah dipakai`);
  }

  // 3. Berhasil -> 201 (bp 10000 dan diamond 0 diisi otomatis oleh default di schema)
  const player = await prisma.player.create({
    data: { nickname: cleanNickname },
    select: playerSelect,
  });

  sendSuccess(res, 201, "Player berhasil dibuat", player);
};

// GET /api/players/:player_id
export const getPlayerById = async (req: Request, res: Response) => {
  const id = parseId(req.params.player_id, "ID player");

  const player = await prisma.player.findUnique({
    where: { id },
    select: {
      ...playerSelect,
      heroes: {
        select: {
          heroId: true,
          currency: true,
          pricePaid: true,
          hero: { select: { name: true } },
        },
        orderBy: { id: "asc" }, // urut sesuai waktu pembelian
      },
    },
  });

  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  // Ratakan bentuk data hero: { heroId, name, currency, pricePaid }
  const { heroes, ...playerData } = player;
  const data = {
    ...playerData,
    heroes: heroes.map((item) => ({
      heroId: item.heroId,
      name: item.hero.name,
      currency: item.currency,
      pricePaid: item.pricePaid,
    })),
  };

  sendSuccess(res, 200, "Berhasil mengambil data player", data);
};

// PATCH /api/players/:player_id
export const updatePlayer = async (req: Request, res: Response) => {
  const id = parseId(req.params.player_id, "ID player");
  const { nickname } = req.body ?? {};

  // 1. Player tidak ada -> 404
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  // 2. nickname kosong -> 400
  if (isEmptyNickname(nickname)) {
    throw new HttpError(400, "nickname wajib diisi");
  }
  const cleanNickname = nickname.trim();

  // 3. nickname sudah dipakai player LAIN -> 409
  const usedBy = await prisma.player.findUnique({ where: { nickname: cleanNickname } });
  if (usedBy && usedBy.id !== id) {
    throw new HttpError(409, `Nickname ${cleanNickname} sudah dipakai player lain`);
  }

  // 4. Berhasil -> 200
  const updated = await prisma.player.update({
    where: { id },
    data: { nickname: cleanNickname },
    select: playerSelect,
  });

  sendSuccess(res, 200, "Nickname player berhasil diubah", updated);
};

// DELETE /api/players/:player_id
export const deletePlayer = async (req: Request, res: Response) => {
  const id = parseId(req.params.player_id, "ID player");

  // 1. Player tidak ada -> 404
  const player = await prisma.player.findUnique({ where: { id }, select: playerSelect });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  // 2. Hapus. Data PlayerHero miliknya ikut terhapus karena onDelete: Cascade di schema
  await prisma.player.delete({ where: { id } });

  sendSuccess(res, 200, "Player berhasil dihapus", player);
};

// ===================== FITUR 5: TOP UP & MATCH =====================

// POST /api/players/:player_id/topup
export const topUp = async (req: Request, res: Response) => {
  const id = parseId(req.params.player_id, "ID player");
  const { amount } = req.body ?? {};

  // 1. amount bukan bilangan bulat lebih dari 0 -> 400
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "amount harus berupa bilangan bulat lebih dari 0");
  }

  // 2. Player tidak ditemukan -> 404
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  // 3. Berhasil: tambah diamond dengan increment -> 200
  const updated = await prisma.player.update({
    where: { id },
    data: { diamond: { increment: amount } },
    select: { id: true, diamond: true },
  });

  sendSuccess(res, 200, "Top up berhasil", {
    playerId: updated.id,
    amount,
    diamond: updated.diamond,
  });
};

// POST /api/players/:player_id/matches
export const playMatch = async (req: Request, res: Response) => {
  const id = parseId(req.params.player_id, "ID player");
  const { result } = req.body ?? {};

  // 1. result bukan WIN/LOSE -> 400
  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }

  // 2. Player tidak ditemukan -> 404
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  // 3. Berhasil: tambah bp dengan increment (WIN 300, LOSE 100) -> 200
  const bpEarned = MATCH_REWARD[result];
  const updated = await prisma.player.update({
    where: { id },
    data: { bp: { increment: bpEarned } },
    select: { id: true, bp: true },
  });

  sendSuccess(res, 200, "Hadiah match berhasil ditambahkan", {
    playerId: updated.id,
    result,
    bpEarned,
    bp: updated.bp,
  });
};
