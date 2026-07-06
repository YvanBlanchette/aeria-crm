"use client";

import { useState } from "react";
import { ClientsImportButton } from "./ClientsImportButton";
import { ClientsImportCard } from "./ClientsImportCard";

export function ClientsImportManager() {
	const [showImport, setShowImport] = useState(false);

	return {
		button: (
			<ClientsImportButton
				showImport={showImport}
				onToggle={() => setShowImport(!showImport)}
			/>
		),
		card: <ClientsImportCard show={showImport} />,
	};
}
