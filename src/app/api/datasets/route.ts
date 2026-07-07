import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { normalizeDatasetPayload, slugFromFilename } from "@/lib/datasets";

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

function parseSlug(value: string | null | undefined) {
	if (!value) return "";
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function upsertDataset(slug: string, sourceFile: string, parsed: unknown) {
	const payload = normalizeDatasetPayload(parsed, slug, sourceFile) as Prisma.InputJsonValue;
	const dataset = await prisma.staticDataset.upsert({
		where: { slug },
		update: { sourceFile, payload },
		create: { slug, sourceFile, payload },
		select: { slug: true, sourceFile: true, updatedAt: true, payload: true },
	});

	const count = Number((dataset.payload as { count?: unknown })?.count ?? 0);
	return { slug: dataset.slug, sourceFile: dataset.sourceFile, updatedAt: dataset.updatedAt, count };
}

export async function GET(request: Request) {
	const user = await requireApiUser();
	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug");
	const raw = searchParams.get("raw") === "1";
	const query = searchParams.get("q")?.trim().toLowerCase();
	const limitRaw = Number(searchParams.get("limit") ?? "200");
	const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 200;

	if (slug) {
		const dataset = await prisma.staticDataset.findUnique({
			where: { slug },
			select: { slug: true, sourceFile: true, payload: true, updatedAt: true },
		});

		if (!dataset) {
			return NextResponse.json({ ok: false, error: "Dataset not found" }, { status: 404 });
		}

		if (raw) {
			return NextResponse.json({
				ok: true,
				dataset: {
					slug: dataset.slug,
					sourceFile: dataset.sourceFile,
					updatedAt: dataset.updatedAt,
					payload: dataset.payload,
				},
			});
		}

		const payload = dataset.payload as { items?: Array<{ label?: string; value?: string; code?: string }> };
		const allItems = Array.isArray(payload?.items) ? payload.items : [];
		const filteredItems = query
			? allItems.filter((item) => {
					const label = String(item.label ?? "").toLowerCase();
					const value = String(item.value ?? "").toLowerCase();
					const code = String(item.code ?? "").toLowerCase();
					return label.includes(query) || value.includes(query) || code.includes(query);
				})
			: allItems;

		const items = filteredItems.slice(0, limit);

		return NextResponse.json({
			ok: true,
			dataset: {
				slug: dataset.slug,
				sourceFile: dataset.sourceFile,
				updatedAt: dataset.updatedAt,
				payload: {
					...(dataset.payload as object),
					items,
					count: items.length,
				},
			},
		});
	}

	const datasets = await prisma.staticDataset.findMany({
		select: { slug: true, sourceFile: true, updatedAt: true },
		orderBy: { slug: "asc" },
	});

	return NextResponse.json({ ok: true, datasets });
}

export async function POST(request: Request) {
	const user = await requireApiUser();
	if (!user) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	const contentType = request.headers.get("content-type") ?? "";

	if (contentType.includes("multipart/form-data")) {
		const form = await request.formData();
		const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
		const single = form.get("file");
		if (single instanceof File) files.push(single);

		if (files.length === 0) {
			return NextResponse.json({ ok: false, error: "No JSON files provided" }, { status: 400 });
		}

		const forcedSlug = parseSlug(String(form.get("slug") ?? ""));
		const updated = [] as Array<{ slug: string; sourceFile: string | null; updatedAt: Date; count: number }>;

		for (const file of files) {
			const sourceFile = file.name || "upload.json";
			const slug = forcedSlug || slugFromFilename(sourceFile);
			if (!slug) {
				return NextResponse.json({ ok: false, error: `Invalid slug for ${sourceFile}` }, { status: 400 });
			}

			const text = await file.text();
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				return NextResponse.json({ ok: false, error: `Invalid JSON in ${sourceFile}` }, { status: 400 });
			}

			updated.push(await upsertDataset(slug, sourceFile, parsed));
		}

		return NextResponse.json({ ok: true, updated, total: updated.length });
	}

	const body = (await request.json()) as {
		slug?: string;
		sourceFile?: string;
		payload?: unknown;
	};

	const sourceFile = body.sourceFile?.trim() || "upload.json";
	const slug = parseSlug(body.slug) || slugFromFilename(sourceFile);
	if (!slug) {
		return NextResponse.json({ ok: false, error: "Missing or invalid slug" }, { status: 400 });
	}
	if (body.payload === undefined) {
		return NextResponse.json({ ok: false, error: "Missing payload" }, { status: 400 });
	}

	const updated = await upsertDataset(slug, sourceFile, body.payload);
	return NextResponse.json({ ok: true, updated });
}
