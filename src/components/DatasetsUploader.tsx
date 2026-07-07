"use client";

import { useEffect, useMemo, useState } from "react";

type DatasetItem = {
	slug: string;
	sourceFile: string | null;
	updatedAt: string;
};

type UploadResult = {
	slug: string;
	sourceFile: string | null;
	updatedAt: string;
	count: number;
};

export default function DatasetsUploader() {
	const [datasets, setDatasets] = useState<DatasetItem[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [forcedSlug, setForcedSlug] = useState("");
	const [isBusy, setIsBusy] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [downloadingSlug, setDownloadingSlug] = useState("");

	const canForceSlug = useMemo(() => files.length === 1, [files.length]);

	async function loadDatasets() {
		setError("");
		const res = await fetch("/api/datasets", { cache: "no-store" });
		const data = (await res.json()) as { ok?: boolean; error?: string; datasets?: DatasetItem[] };
		if (!res.ok || !data.ok) {
			setError(data.error ?? "Impossible de charger les datasets.");
			return;
		}
		setDatasets(data.datasets ?? []);
	}

	useEffect(() => {
		loadDatasets().catch(() => setError("Impossible de charger les datasets."));
	}, []);

	function onFilesSelected(fileList: FileList | null) {
		if (!fileList) return;
		const selected = Array.from(fileList).filter((file) => file.name.toLowerCase().endsWith(".json"));
		setFiles(selected);
		setMessage("");
		setError(selected.length ? "" : "Selection vide ou sans fichiers .json.");
		if (selected.length !== 1) setForcedSlug("");
	}

	async function upload() {
		if (files.length === 0) {
			setError("Ajoutez au moins un fichier JSON.");
			return;
		}
		setIsBusy(true);
		setError("");
		setMessage("");

		try {
			const form = new FormData();
			for (const file of files) form.append("files", file);
			if (canForceSlug && forcedSlug.trim()) form.append("slug", forcedSlug.trim());

			const res = await fetch("/api/datasets", { method: "POST", body: form });
			const data = (await res.json()) as {
				ok?: boolean;
				error?: string;
				total?: number;
				updated?: UploadResult[];
			};
			if (!res.ok || !data.ok) {
				setError(data.error ?? "Echec de l'upload JSON.");
				return;
			}

			const total = data.total ?? data.updated?.length ?? 0;
			setMessage(`${total} dataset(s) mis a jour.`);
			setFiles([]);
			setForcedSlug("");
			await loadDatasets();
		} catch {
			setError("Echec reseau pendant l'upload.");
		} finally {
			setIsBusy(false);
		}
	}

	async function downloadDataset(dataset: DatasetItem) {
		setError("");
		setMessage("");
		setDownloadingSlug(dataset.slug);
		try {
			const res = await fetch(`/api/datasets?slug=${encodeURIComponent(dataset.slug)}&raw=1`, { cache: "no-store" });
			const data = (await res.json()) as {
				ok?: boolean;
				error?: string;
				dataset?: { payload?: unknown; sourceFile?: string | null; slug?: string };
			};
			if (!res.ok || !data.ok || !data.dataset) {
				setError(data.error ?? `Impossible de telecharger ${dataset.slug}.`);
				return;
			}

			const payload = data.dataset.payload ?? {};
			const json = JSON.stringify(payload, null, 2);
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = data.dataset.sourceFile || `${dataset.slug}.json`;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(url);
			setMessage(`${dataset.slug} telecharge.`);
		} catch {
			setError(`Echec de telechargement pour ${dataset.slug}.`);
		} finally {
			setDownloadingSlug("");
		}
	}

	return (
		<div className="space-y-4">
			{/* DROP ZONE */}
			<label
				onDragOver={(event) => event.preventDefault()}
				onDrop={(event) => {
					event.preventDefault();
					onFilesSelected(event.dataTransfer.files);
				}}
				className="block rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center cursor-pointer hover:border-ocean hover:bg-ocean-50/40 transition-colors"
			>
				<input
					type="file"
					accept=".json,application/json"
					multiple
					className="hidden"
					onChange={(event) => onFilesSelected(event.target.files)}
				/>
				<p className="text-sm font-medium text-navy">Glissez-deposez vos JSON ici</p>
				<p className="text-xs text-slate-500 mt-1">ou cliquez pour selectionner un ou plusieurs fichiers</p>
			</label>

			{/* FILE LIST */}
			<div className="rounded-lg border border-slate-200 bg-white p-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fichiers en attente</p>
				{files.length === 0 ? (
					<p className="text-sm text-slate-500 mt-2">Aucun fichier selectionne.</p>
				) : (
					<ul className="mt-2 space-y-1 text-sm text-slate-700">
						{files.map((file) => (
							<li key={`${file.name}-${file.size}`}>• {file.name}</li>
						))}
					</ul>
				)}
			</div>

			{/* OPTIONS */}
			{canForceSlug && (
				<div>
					<label htmlFor="dataset-forced-slug" className="label">Slug cible (optionnel)</label>
					<input
						id="dataset-forced-slug"
						value={forcedSlug}
						onChange={(event) => setForcedSlug(event.target.value)}
						className="input"
						placeholder="ex: canadian-provinces"
					/>
					<p className="mt-1 text-xs text-slate-500">Laissez vide pour deduire automatiquement depuis le nom du fichier.</p>
				</div>
			)}

			{/* ACTIONS */}
			<div className="flex items-center gap-3">
				<button type="button" className="btn-primary" disabled={isBusy} onClick={upload}>
					{isBusy ? "Upload en cours..." : "Uploader et remplacer"}
				</button>
				<button type="button" className="btn-secondary" disabled={isBusy} onClick={() => loadDatasets()}>
					Rafraichir
				</button>
			</div>

			{message && <p className="text-sm text-emerald-700">{message}</p>}
			{error && <p className="text-sm text-red-700">{error}</p>}

			{/* CURRENT DATASETS */}
			<div className="rounded-lg border border-slate-200 bg-white p-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datasets en base</p>
				{datasets.length === 0 ? (
					<p className="text-sm text-slate-500 mt-2">Aucun dataset trouve.</p>
				) : (
					<div className="mt-2 max-h-64 overflow-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-slate-500">
									<th className="py-1 pr-4">Slug</th>
									<th className="py-1 pr-4">Source</th>
									<th className="py-1 pr-4">Maj</th>
									<th className="py-1">Actions</th>
								</tr>
							</thead>
							<tbody>
								{datasets.map((dataset) => (
									<tr key={dataset.slug} className="border-t border-slate-100">
										<td className="py-1 pr-4 font-medium text-navy">{dataset.slug}</td>
										<td className="py-1 pr-4 text-slate-600">{dataset.sourceFile ?? "-"}</td>
										<td className="py-1 pr-4 text-slate-600">{new Date(dataset.updatedAt).toLocaleString("fr-CA")}</td>
										<td className="py-1">
											<button
												type="button"
												className="btn-secondary text-xs"
												onClick={() => downloadDataset(dataset)}
												disabled={downloadingSlug === dataset.slug}
											>
												{downloadingSlug === dataset.slug ? "..." : "Telecharger JSON"}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
