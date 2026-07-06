(function () {
	"use strict";
	window.AppLayoutFragments = window.AppLayoutFragments || {};

	// FRAGMENT 1/3 : écran d'accueil
	// Ce fragment contient uniquement du HTML statique.
	// Le script d'assemblage (render-layout.js) l'injecte dans #app-shell.
	window.AppLayoutFragments.accueil = `
<!-- ═══ ÉCRAN D'ACCUEIL — recouvre l'application au démarrage ═══ -->
		<div
			id="accueil"
			class="fixed inset-0 bg-marine z-50 overflow-y-auto px-6 py-14 text-white"
		>
			<div class="max-w-4xl mx-auto">
				<div class="mono text-xs tracking-widest uppercase text-ciel mb-1.5">Agence · Forfaits croisière</div>
				<h1 class="font-display font-semibold text-4xl">Calculateur de forfaits</h1>
				<p class="text-brume text-sm mt-2.5">Comment voulez-vous commencer?</p>

				<!-- Bandeau base de données (contenu rempli par renderAccueil selon le contexte) -->
				<div class="bg-white text-encre rounded-xl p-5 mt-7 border-l-4 border-laiton">
					<h3 class="font-display font-semibold text-lg text-marine mb-1">📁 Base de données</h3>
					<p
						class="text-xs text-sourdine leading-relaxed mb-3"
						id="accueilDbTxt"
					>
						Vérification…
					</p>
					<div id="accueilDbBtns"></div>
				</div>

				<div class="grid md:grid-cols-3 gap-4 mt-4">
					<div class="bg-white text-encre rounded-xl p-5 flex flex-col gap-3">
						<h3 class="font-display font-semibold text-lg text-marine">Nouveau dossier</h3>
						<p class="text-xs text-sourdine leading-relaxed flex-1">Partir d'une page blanche pour une nouvelle soumission.</p>
						<input
							type="text"
							id="accueilNom"
							placeholder="Nom du dossier (ex. : Tremblay — Caraïbes)"
							class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre text-sm"
						/>
						<button
							id="accueilCreer"
							class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce w-full"
						>
							Créer le dossier
						</button>
					</div>
					<div class="bg-white text-encre rounded-xl p-5 flex flex-col gap-3">
						<h3 class="font-display font-semibold text-lg text-marine">Ouvrir un dossier</h3>
						<div
							class="max-h-56 overflow-y-auto flex-1"
							id="accueilDossiers"
						>
							<div class="text-xs text-sourdine text-center py-6 px-2 border border-dashed border-ligne rounded-lg">Chargement…</div>
						</div>
					</div>
					<div class="bg-white text-encre rounded-xl p-5 flex flex-col gap-3">
						<h3 class="font-display font-semibold text-lg text-marine">Importer un fichier</h3>
						<p class="text-xs text-sourdine leading-relaxed flex-1">Reprendre un dossier CSV ou une base .sqlite complète exportés depuis cet outil.</p>
						<button
							id="accueilImporter"
							class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine w-full"
						>
							Importer un CSV…
						</button>
						<button
							id="accueilImporterSqlite"
							class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine w-full"
						>
							Importer une base .sqlite…
						</button>
					</div>
				</div>

				<!-- Bandeau « travail non enregistré » (sauvegarde automatique retrouvée) -->
				<div
					class="bg-laiton-pale text-brun rounded-xl px-4 py-3.5 mt-4 text-sm flex justify-between items-center gap-3.5 flex-wrap hidden"
					id="accueilReprendre"
				>
					<span id="accueilReprendreTxt"></span>
					<button
						id="accueilReprendreBtn"
						class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce"
					>
						Reprendre
					</button>
				</div>

				<button
					id="accueilPasser"
					class="appearance-none bg-transparent border-0 text-ciel cursor-pointer mt-6 text-sm underline hover:text-white"
				>
					Continuer sans dossier →
				</button>
			</div>
		</div>

		
`;
})();
