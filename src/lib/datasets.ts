type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type JsonRecord = Record<string, unknown>;
type JsonRow = Record<string, JsonValue>;

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | undefined {
	if (value === null || value === undefined) return undefined;
	if (typeof value === "string") return value.trim() || undefined;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return undefined;
}

function pickLabel(row: JsonRecord, fallback: string): string {
	return toText(row.text) ?? toText(row.label) ?? toText(row.name) ?? toText(row.Name) ?? toText(row.title) ?? toText(row.code) ?? toText(row.Code) ?? fallback;
}

function pickValue(row: JsonRecord, fallback: string): string {
	return toText(row.value) ?? toText(row.code) ?? toText(row.Code) ?? toText(row.id) ?? fallback;
}

function cleanRow(row: JsonRow): JsonRow {
	const out: JsonRow = {};
	for (const [key, value] of Object.entries(row)) {
		if (value === undefined) continue;
		out[key] = value;
	}
	return out;
}

function flattenCruiseNodeMap(map: unknown, group: string, items: JsonRow[], parentId?: string) {
	if (!isRecord(map)) return;

	for (const [key, rawNode] of Object.entries(map)) {
		if (!isRecord(rawNode)) continue;

		const id = toText(rawNode.id) ?? `${group}-${key}`;
		items.push(
			cleanRow({
				id,
				label: pickLabel(rawNode, key),
				value: pickValue(rawNode, key),
				group,
				parentId: parentId ?? null,
				displayClass: toText(rawNode.displayClass) ?? null,
				type: toText(rawNode.type) ?? null,
			}),
		);

		if (rawNode.s !== undefined) {
			flattenCruiseNodeMap(rawNode.s, group, items, id);
		}
	}
}

function toJsonValue(value: unknown): JsonValue {
	return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function normalizeDatasetPayload(payload: unknown, slug: string, sourceFile: string): JsonValue {
	const items: JsonRow[] = [];

	if (isRecord(payload)) {
		for (const key of ["d", "p", "s", "v"]) {
			if (payload[key] !== undefined) {
				flattenCruiseNodeMap(payload[key], key, items);
			}
		}

		if (items.length === 0) {
			const entries = Object.entries(payload);
			if (entries.length > 0 && entries.every(([, value]) => typeof value === "string")) {
				for (const [code, name] of entries) {
					items.push(cleanRow({ id: code, value: code, label: String(name), code }));
				}
			}
		}

		if (items.length === 0) {
			const entries = Object.entries(payload);
			if (entries.length === 1 && Array.isArray(entries[0][1])) {
				const group = entries[0][0];
				const rows = entries[0][1] as unknown[];
				rows.forEach((row, index) => {
					if (!isRecord(row)) return;
					const fallback = `${group}-${index}`;
					items.push(
						cleanRow({
							id: toText(row.id) ?? pickValue(row, fallback),
							value: pickValue(row, fallback),
							label: pickLabel(row, fallback),
							group,
							meta: toJsonValue(row),
						}),
					);
				});
			}
		}
	}

	if (items.length === 0 && Array.isArray(payload)) {
		payload.forEach((row, index) => {
			if (!isRecord(row)) {
				items.push(cleanRow({ id: `${slug}-${index}`, value: String(row), label: String(row) }));
				return;
			}
			const fallback = `${slug}-${index}`;
			items.push(
				cleanRow({
					id: toText(row.id) ?? pickValue(row, fallback),
					value: pickValue(row, fallback),
					label: pickLabel(row, fallback),
					meta: toJsonValue(row),
				}),
			);
		});
	}

	return {
		format: "lookup-v1",
		slug,
		sourceFile,
		count: items.length,
		items,
	};
}

export function slugFromFilename(filename: string) {
	return filename
		.replace(/\.json$/i, "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
