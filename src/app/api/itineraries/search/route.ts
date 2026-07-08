import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireApiUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const provider = String(searchParams.get("provider") ?? "CruiseMapper").trim();
  const limitRaw = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 100)) : 20;

  const where = {
    ...(provider ? { providerName: provider } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { externalId: { contains: q, mode: "insensitive" as const } },
            { departurePort: { contains: q, mode: "insensitive" as const } },
            { arrivalPort: { contains: q, mode: "insensitive" as const } },
            { ship: { name: { contains: q, mode: "insensitive" as const } } },
            {
              ship: {
                cruiseLine: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
  };

  const itineraries = await prisma.itinerary.findMany({
    where,
    take: limit,
    orderBy: [{ createdAt: "desc" }],
    include: {
      ship: {
        include: {
          cruiseLine: { select: { name: true } },
        },
      },
      days: {
        orderBy: { dayNumber: "asc" },
        select: { dayNumber: true, port: true, arrival: true, departure: true, isSeaDay: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    count: itineraries.length,
    itineraries: itineraries.map((item) => ({
      id: item.id,
      externalId: item.externalId,
      providerName: item.providerName,
      name: item.name,
      nights: item.nights,
      departurePort: item.departurePort,
      arrivalPort: item.arrivalPort,
      ship: item.ship
        ? {
            id: item.ship.id,
            name: item.ship.name,
            cruiseLine: item.ship.cruiseLine?.name ?? null,
          }
        : null,
      days: item.days,
    })),
  });
}
