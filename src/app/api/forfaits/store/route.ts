import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULTS = {
  admin: 150,
  pctVols: 10,
  pctMarkup: 30,
  pourboiresNuit: 25,
  arrondi: 0,
};

function normalizeConstants(input: unknown) {
  const x = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const num = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    admin: num(x.admin, DEFAULTS.admin),
    pctVols: num(x.pctVols, DEFAULTS.pctVols),
    pctMarkup: num(x.pctMarkup, DEFAULTS.pctMarkup),
    pourboiresNuit: num(x.pourboiresNuit, DEFAULTS.pourboiresNuit),
    arrondi: num(x.arrondi, DEFAULTS.arrondi),
  };
}

async function bootstrap(userId: string) {
  const [workspace, dossiers] = await Promise.all([
    prisma.forfaitWorkspace.findUnique({ where: { userId } }),
    prisma.forfaitDossier.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, updatedAt: true, state: true },
    }),
  ]);

  return {
    constants: normalizeConstants(workspace?.constants),
    autosave: workspace?.autosaveState
      ? {
          nom: workspace.autosaveName ?? "",
          ts: workspace.autosaveAt?.toISOString() ?? new Date().toISOString(),
          state: workspace.autosaveState,
        }
      : null,
    dossiers: dossiers.map((d) => ({
      id: d.id,
      nom: d.name,
      ts: d.updatedAt.toISOString(),
      state: d.state,
    })),
  };
}

async function requireApiUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}

export async function GET() {
  const me = await requireApiUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await bootstrap(me.id));
}

export async function POST(request: Request) {
  const me = await requireApiUser();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    action?: string;
    constants?: unknown;
    id?: string;
    nom?: string;
    state?: unknown;
  };

  const action = body.action ?? "";

  if (action === "saveConstants") {
    const constants = normalizeConstants(body.constants);
    await prisma.forfaitWorkspace.upsert({
      where: { userId: me.id },
      create: { userId: me.id, constants },
      update: { constants },
    });
    return NextResponse.json({ ok: true, constants });
  }

  if (action === "saveAutosave") {
    const state = body.state && typeof body.state === "object" ? body.state : {};
    await prisma.forfaitWorkspace.upsert({
      where: { userId: me.id },
      create: {
        userId: me.id,
        constants: DEFAULTS,
        autosaveName: body.nom ?? "",
        autosaveState: state,
        autosaveAt: new Date(),
      },
      update: {
        autosaveName: body.nom ?? "",
        autosaveState: state,
        autosaveAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "upsertDossier") {
    const id = String(body.id ?? "").trim();
    const nom = String(body.nom ?? "").trim() || "Dossier sans titre";
    const state = body.state && typeof body.state === "object" ? body.state : {};
    if (!id) return NextResponse.json({ ok: false, error: "ID manquant" }, { status: 400 });

    await prisma.forfaitDossier.upsert({
      where: { id },
      create: { id, userId: me.id, name: nom, state },
      update: { name: nom, state },
    });

    return NextResponse.json({
      ok: true,
      dossier: { id, nom, ts: new Date().toISOString(), state },
    });
  }

  if (action === "deleteDossier") {
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "ID manquant" }, { status: 400 });
    await prisma.forfaitDossier.deleteMany({ where: { id, userId: me.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "duplicateDossier") {
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "ID manquant" }, { status: 400 });
    const source = await prisma.forfaitDossier.findFirst({ where: { id, userId: me.id } });
    if (!source)
      return NextResponse.json({ ok: false, error: "Dossier introuvable" }, { status: 404 });

    const newId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    await prisma.forfaitDossier.create({
      data: {
        id: newId,
        userId: me.id,
        name: `${source.name} (copie)`,
        state: source.state as any,
      },
    });

    return NextResponse.json({
      ok: true,
      dossier: {
        id: newId,
        nom: `${source.name} (copie)`,
        ts: new Date().toISOString(),
        state: source.state,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "Action non supportée" }, { status: 400 });
}
