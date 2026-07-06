"use client";

export function ClientsImportButton({
	showImport,
	onToggle,
}: {
	showImport: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			onClick={onToggle}
			className="btn-secondary"
		>
			{showImport ? "Masquer import" : "Afficher import"}
		</button>
	);
}
