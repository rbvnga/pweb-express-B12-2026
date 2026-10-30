import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma.js";

const load = (file: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), "data", file), "utf-8"));

// kosong / null / "" jadi null, selain itu jadi angka
const toInt = (v: unknown) =>
  v === undefined || v === null || v === "" ? null : Number(v);

async function main() {
  // 1. Kosongkan semua tabel dan reset id ke 1
  await prisma.$executeRawUnsafe(
    `TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE`
  );

  // 2. Hero (id otomatis: Miya = 1, Hirara = 133)
  const heroes = load("heroes.json");
  await prisma.hero.createMany({
    data: heroes.map((h: any) => ({
      name: h.name,
      role: h.primaryRole,
      lane: h.primaryLane,
      releaseYear: Number(h.releaseYear),
      priceBP: toInt(h.priceBP),
      priceDiamond: toInt(h.priceDiamond),
    })),
  });

  // 3. Skin
  const skins = load("skins.json");
  await prisma.skin.createMany({
    data: skins.map((s: any) => ({
      name: s.name,
      heroId: Number(s.heroId),
      rarity: s.rarity,
      priceDiamond: toInt(s.priceDiamond),
    })),
  });

  // 4. Player (id otomatis 1, 2, 3)
  await prisma.player.createMany({
    data: [
      { nickname: "ArekITS", bp: 1500, diamond: 75 },
      { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { nickname: "MageSurabaya", bp: 10000, diamond: 0 },
    ],
  });

  // 5. PlayerHero
  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: "BP", pricePaid: 2000 },     // Layla
      { playerId: 1, heroId: 1, currency: "BP", pricePaid: 10800 },     // Miya
      { playerId: 2, heroId: 84, currency: "DIAMOND", pricePaid: 599 }, // Ling
      { playerId: 2, heroId: 56, currency: "BP", pricePaid: 32000 },    // Gusion
    ],
  });

  console.log(`Seed selesai: ${heroes.length} hero, ${skins.length} skin, 3 player`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());