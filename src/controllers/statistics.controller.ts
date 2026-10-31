import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/response.js";

export const getStatistics = async (_req: Request, res: Response) => {
  const [totalPlayers, totalHeroesOwned, diamondAgg, topOwnedGroup, roleGroups] =
    await Promise.all([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({
        _sum: { diamond: true },
      }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: { heroId: true },
        orderBy: [{ _count: { heroId: "desc" } }, { heroId: "asc" }],
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

  let mostOwnedHero = null;
  if (topOwnedGroup.length > 0) {
    const top = topOwnedGroup[0];
    const hero = await prisma.hero.findUnique({
      where: { id: top.heroId },
      select: { name: true },
    });
    mostOwnedHero = {
      heroId: top.heroId,
      name: hero?.name ?? "",
      owners: top._count.heroId,
    };
  }

  const heroesPerRole = roleGroups.map((item) => ({
    role: item.role,
    total: item._count.id,
  }));

  sendSuccess(res, 200, "Berhasil mengambil statistik", {
    totalPlayers,
    totalHeroesOwned,
    totalDiamond: diamondAgg._sum.diamond ?? 0,
    mostOwnedHero,
    heroesPerRole,
  });
};
