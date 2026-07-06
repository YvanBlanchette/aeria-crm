(function () {
	"use strict";
	window.AppLayoutFragments = window.AppLayoutFragments || {};

	// FRAGMENT 2/3 : entête et onglets
	// Ce fragment contient uniquement du HTML statique.
	// Le script d'assemblage (render-layout.js) l'injecte dans #app-shell.
	window.AppLayoutFragments.header = `
<!-- ═══ ENTÊTE + ONGLETS ═══ -->
		<header class="bg-marine text-white px-6 pt-7">
			<div class="max-w-6xl mx-auto flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div class="min-w-0">
					<div class="mono text-xs tracking-widest uppercase text-ciel mb-1.5">ÆRIA Voyages · Forfaits croisière</div>
					<h1 class="font-display font-semibold text-3xl">Calculateur de forfaits</h1>
					<!-- Les classes d'état (actif/inactif) des onglets sont gérées par switchTab() dans le script -->
					<nav class="flex gap-1 mt-3 flex-wrap">
						<button
							class="tab"
							data-page="doss"
						>
							Dossiers
						</button>
						<button
							class="tab"
							data-page="croisiere"
						>
							Croisiere
						</button>
						<button
							class="tab"
							data-page="vols"
						>
							Vols
						</button>
						<button
							class="tab"
							data-page="hotel"
						>
							Hotel
						</button>
						<button
							class="tab"
							data-page="transferts"
						>
							Transferts
						</button>
						<button
							class="tab"
							data-page="sommaire"
						>
							Sommaire
						</button>
						<button
							class="tab"
							data-page="const"
						>
							Paramètres
						</button>
					</nav>
				</div>
				<div class="brand-logo-wrap shrink-0 self-start md:self-auto">
					<img
						src="assets/images/aeria.svg"
						alt="ÆRIA Voyages"
						class="brand-logo"
					/>
				</div>
			</div>
		</header>

		
`;
})();
