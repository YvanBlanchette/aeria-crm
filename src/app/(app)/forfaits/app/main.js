/* ═══════════════════════════════════════════════════════════════════════════
   LOGIQUE DE L'APPLICATION
   Tout le code vit dans une fonction anonyme auto-exécutée (IIFE).
   Les sections, dans l'ordre :
     0.  CL — gabarits de classes Tailwind des éléments générés par le JS
     1.  Utilitaires (raccourcis DOM, formats)
     2.  Cache (localStorage / window.storage)
     3.  Constantes de calcul (chargement, sauvegarde)
     4.  Onglets et navigation
     5.  CALCUL — le cœur : computeBase(), cabinCalc(), activeCabins()
     6.  Dates → nuits (avertissement de cohérence)
     7.  Rendu des billets de prix (render)
     8.  Rendu des revenus (renderCommissions)
     9.  Copier dans le presse-papiers
     10. État complet d'un dossier (collecter / appliquer / vider)
     11. Dossiers sauvegardés (liste, ouvrir, dupliquer, supprimer)
     12. Sauvegarde automatique dans le cache
     13. sql.js — construire / lire la base SQLite
     14. Fichier de base sur disque (File System Access)
     15. Écran d'accueil
     16. Sommaire Excel (interne)
     17. Soumission client PDF
     18. Export / import CSV (un dossier)
     19. Export / import SQLite manuels
     20. Bascules d'interface + écouteurs d'événements
     21. Démarrage
═══════════════════════════════════════════════════════════════════════════ */
(function () {
	"use strict";

	/* ══════════ 0. CL — GABARITS TAILWIND DES ÉLÉMENTS GÉNÉRÉS ═══════════════
     Tout le HTML créé par le JavaScript (billets, listes, boutons dynamiques)
     utilise ces chaînes de classes Tailwind. Modifier une apparence générée
     = modifier la chaîne correspondante ICI, une seule fois. */
	const CL = {
		// Boutons (mêmes recettes que les boutons statiques du HTML)
		btn: "appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce",
		btnGhost: "appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine",
		btnSmall: "appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce",
		btnSmallGhost: "appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine",
		btnSmallDanger: "appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-white text-alerte border-alerte hover-alerte",
		btnNotice: "appearance-none cursor-pointer font-semibold text-xs px-2.5 py-0.5 rounded-md border border-laiton bg-white text-laiton hover-laiton ml-1.5",
		// Onglets (état géré par switchTab)
		tabBase: "appearance-none border-0 cursor-pointer font-semibold text-sm px-4 py-3 rounded-t-lg bg-transparent",
		tabOn: " bg-ecume text-marine",
		tabOff: " text-brume hover:text-white",
		// Messages temporaires (vert = succès, rouge = échec)
		msgOk: "text-sm font-semibold ml-3 text-ok",
		msgErr: "text-sm font-semibold ml-3 text-alerte",
		// Billets (prix et revenus)
		ticket: "bg-white border border-ligne rounded-xl overflow-hidden flex flex-col",
		ticketHead: "bg-marine text-white px-4 py-3 flex justify-between items-baseline",
		cat: "font-display font-semibold text-lg",
		code: "mono text-xs tracking-widest text-ciel",
		ticketBody: "px-4 pt-3.5 pb-1.5 flex-1",
		line: "flex justify-between gap-3 text-sm py-1",
		lbl: "text-sourdine",
		lblStrong: "text-encre font-semibold",
		val: "mono font-medium whitespace-nowrap",
		divider: "border-0 border-t border-dashed border-ligne my-2",
		badgeLoss: "inline-block text-xs font-semibold px-2 py-0.5 rounded-full ml-1.5 bg-alerte-pale text-alerte",
		badgeOk: "inline-block text-xs font-semibold px-2 py-0.5 rounded-full ml-1.5 bg-lagon-pale text-lagon",
		taap: "bg-laiton-pale rounded-lg px-3 py-2 my-2 text-xs text-brun leading-loose",
		taapAlerte: "bg-alerte-pale rounded-lg px-3 py-2 my-2 text-xs text-alerte leading-loose",
		taapVal: "mono font-semibold text-laiton",
		copy: "appearance-none cursor-pointer border border-laiton bg-white text-laiton text-xs font-semibold rounded-md px-2 py-0.5 ml-1.5 hover-laiton",
		copyDone: "appearance-none cursor-pointer border border-lagon bg-lagon text-white text-xs font-semibold rounded-md px-2 py-0.5 ml-1.5",
		ticketFoot: "border-t-2 border-dashed border-ligne px-4 py-3 flex justify-between items-center gap-2.5 flex-wrap bg-neige",
		footK: "text-xs tracking-wider uppercase text-sourdine font-semibold",
		footV: "mono font-semibold text-lg text-marine whitespace-nowrap",
		footVTotal: "mono font-semibold text-xl text-lagon whitespace-nowrap",
		empty: "border border-dashed border-ligne rounded-xl p-8 text-center text-sourdine text-sm col-span-full bg-neige",
		// Liste des dossiers (onglet Dossiers)
		dossier: "flex justify-between items-center gap-3.5 px-4 py-3 border border-ligne rounded-xl mb-2.5 bg-white flex-wrap",
		dossierNom: "font-semibold text-sm text-marine",
		dossierDate: "text-xs text-sourdine mono mt-0.5",
		// Liste des dossiers de l'écran d'accueil
		aitem: "appearance-none border border-ligne bg-neige rounded-lg px-3 py-2.5 w-full text-left cursor-pointer mb-2 hover-item",
		aitemNom: "font-semibold text-sm text-marine",
		aitemDate: "text-xs text-sourdine mono mt-0.5",
		aEmpty: "text-xs text-sourdine text-center py-6 px-2 border border-dashed border-ligne rounded-lg",
	};

	/* ══════════ 1. UTILITAIRES ══════════════════════════════════════════════ */
	const $ = (id) => document.getElementById(id); // raccourci DOM
	const num = (id) => {
		const el = $(id);
		if (!el) return 0;
		const v = parseFloat(el.value);
		return isNaN(v) ? 0 : v;
	}; // valeur numérique (0 si vide)
	const txt = (id) => {
		const el = $(id);
		return el && typeof el.value !== "undefined" ? String(el.value).trim() : "";
	}; // valeur texte sans espaces superflus
	const fmt = (n) => n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }); // « 1 234,50 $ »
	const pdfFmt = (n) =>
		n
			.toFixed(2)
			.replace(".", ",")
			.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $"; // format sûr pour jsPDF
	const esc = (s) => String(s).replace(/</g, "&lt;"); // échappe le HTML des textes saisis
	const heure = (d) => (d || new Date()).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
	const dateHeure = (d) => d.toLocaleDateString("fr-CA") + " à " + heure(d);

	const modulePromises = {};
	function loadLocalScript(src, testFn) {
		if (testFn()) return Promise.resolve(true);
		if (modulePromises[src]) return modulePromises[src];
		modulePromises[src] = new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = src;
			script.onload = () => (testFn() ? resolve(true) : reject(new Error("Librairie invalide: " + src)));
			script.onerror = () => reject(new Error("Chargement impossible: " + src));
			document.head.appendChild(script);
		});
		return modulePromises[src];
	}
	const ensureCalculCore = () => loadLocalScript("app/calcul-core.js", () => !!window.CalculCoreModule);
	const ensureWorkflowAgent = () => loadLocalScript("app/workflow-agent.js", () => !!window.WorkflowAgentModule);
	const ensureExports = () => loadLocalScript("app/exports.js", () => !!window.ExportsModule);
	const ensureStorage = () => loadLocalScript("app/storage.js", () => !!window.StorageModule);
	const ensureDossiers = () => loadLocalScript("app/dossiers.js", () => !!window.DossiersModule);
	const ensureAccueil = () => loadLocalScript("app/accueil.js", () => !!window.AccueilModule);
	const ensureState = () => loadLocalScript("app/state.js", () => !!window.StateModule);
	const ensureXlsx = () =>
		typeof window.XLSX !== "undefined" ? Promise.resolve(true) : loadLocalScript("lib/xlsx.full.min.js", () => typeof window.XLSX !== "undefined");
	const ensureJsPdf = () =>
		window.jspdf && window.jspdf.jsPDF ? Promise.resolve(true) : loadLocalScript("lib/jspdf.umd.min.js", () => !!(window.jspdf && window.jspdf.jsPDF));

	/* ══════════ 2. CACHE (stockage navigateur) ═══════════════════════════════
     NIVEAU 2 de persistance : copie de secours. Dans Claude → window.storage,
     en local → localStorage. Retourne null/false en cas d'échec, jamais d'erreur. */
	const cache = {
		async get(k) {
			if (window.storage) {
				try {
					const r = await window.storage.get(k);
					return r && r.value ? r.value : null;
				} catch (e) {
					return null;
				}
			}
			try {
				return localStorage.getItem(k);
			} catch (e) {
				return null;
			}
		},
		async set(k, v) {
			if (window.storage) {
				try {
					await window.storage.set(k, v);
					return true;
				} catch (e) {
					return false;
				}
			}
			try {
				localStorage.setItem(k, v);
				return true;
			} catch (e) {
				return false;
			}
		},
	};

	/* ══════════ 3. CONSTANTES DE CALCUL ═══════════════════════════════════════
     C = l'objet vivant utilisé par tous les calculs. DEFAULTS = valeurs d'usine. */
	const DEFAULTS = { admin: 150, pctVols: 10, pctMarkup: 30, pourboiresNuit: 25, arrondi: 0 };
	let C = { ...DEFAULTS };

	/* Recopie C dans les champs de l'onglet Paramètres. */
	function fillConstInputs() {
		$("cAdmin").value = C.admin;
		$("cVols").value = C.pctVols;
		$("cMarkup").value = C.pctMarkup;
		$("cPourboires").value = C.pourboiresNuit;
		$("cArrondi").value = String(C.arrondi);
	}

	/* Charge les constantes depuis le cache au démarrage (la base .sqlite a priorité ensuite). */
	async function loadConstCache() {
		const v = await cache.get("constantes-forfaits");
		if (v) {
			try {
				C = { ...DEFAULTS, ...JSON.parse(v) };
			} catch (e) {}
		}
		fillConstInputs();
	}

	/* Bouton « Enregistrer les constantes » : champs → C → cache + base, puis recalcul. */
	async function saveConst() {
		C = {
			admin: num("cAdmin"),
			pctVols: num("cVols"),
			pctMarkup: num("cMarkup"),
			pourboiresNuit: num("cPourboires"),
			arrondi: parseFloat($("cArrondi").value) || 0,
		};
		const okCache = await cache.set("constantes-forfaits", JSON.stringify(C));
		scheduleDbWrite(true); // true = écriture immédiate de la base
		const msg = $("saveMsg");
		msg.textContent = storageApi.hasFileHandle()
			? "Constantes enregistrées dans la base ✓"
			: okCache
				? "Constantes enregistrées ✓"
				: "Valeurs appliquées pour cette session";
		msg.className = CL.msgOk;
		setTimeout(() => {
			msg.textContent = "";
		}, 4000);
		render();
	}

	/* ══════════ 4. ONGLETS ET NAVIGATION ═════════════════════════════════════ */

	/* Affiche la page demandée : classes Tailwind de l'onglet actif/inactif
     (CL.tabOn / CL.tabOff) et bascule 'hidden' sur les sections .page. */
	function switchTab(page) {
		document.querySelectorAll(".tab").forEach((x) => {
			x.className = "tab " + CL.tabBase + (x.dataset.page === page ? CL.tabOn : CL.tabOff);
		});
		document.querySelectorAll(".page").forEach((x) => x.classList.add("hidden"));
		$("page-" + page).classList.remove("hidden");
	}
	document.querySelectorAll(".tab").forEach((t) => {
		t.addEventListener("click", () => switchTab(t.dataset.page));
	});

	/* Ferme l'écran d'accueil et ouvre l'application (page Projet par défaut). */
	function goApp(page) {
		$("accueil").classList.add("hidden");
		switchTab(page || "croisiere");
	}

	/* ══════════ 5. CALCUL — LE CŒUR DE L'OUTIL ═══════════════════════════════ */

	let CABINES = [];
	let modeOf = () => "pers";
	let modeTxt = () => "par personne";
	let computeBase = () => ({});
	let cabinCalc = () => ({ cabinePers: 0, brut: 0, prixPers: 0, coussin: 0, total: 0, prixPersNuit: 0 });
	let activeCabins = () => [];
	let workflowAgent = {
		setStep: () => {},
		refresh: () => {},
		prepare: () => {},
	};
	let stateApi = {
		collectState: () => ({}),
		clearAll: () => {},
		applyState: () => {},
	};
	let storageApi = {
		hasFileHandle: () => false,
		getContext: () => ({ FSA: false, fileHandle: null, handleMemorise: null }),
		scheduleDbWrite: () => {},
		updateDbStatus: () => {},
		detectSavedHandle: async () => {},
		creerBase: async () => {},
		ouvrirBase: async () => {},
		reprendreBase: async () => {},
		exportSqlite: async () => {},
		importSqliteFichier: async () => {},
		onBeforeUnload: () => {},
	};
	let dossiersApi = {
		showMessage: () => {},
		getDossiers: () => [],
		setDossiers: () => {},
		findDossierById: () => null,
		getAutosaveSnap: () => null,
		loadDossiersCache: async () => {},
		saveDossier: async () => {},
		renderDossiers: () => {},
		handleDossierListClick: async () => {},
		scheduleAutosave: () => {},
		fetchAutosave: async () => {},
	};
	let accueilApi = {
		renderAccueil: () => {},
		bindActions: () => {},
	};

	function scheduleDbWrite(immediat) {
		storageApi.scheduleDbWrite(immediat);
	}
	async function initCalculCore() {
		await ensureCalculCore();
		const core = window.CalculCoreModule.init({ $, num, getConstantes: () => C });
		CABINES = core.CABINES;
		modeOf = core.modeOf;
		modeTxt = core.modeTxt;
		computeBase = core.computeBase;
		cabinCalc = core.cabinCalc;
		activeCabins = core.activeCabins;
	}
	async function initStateModule() {
		await ensureState();
		stateApi = window.StateModule.init({ $, render, syncToggles });
	}
	async function initWorkflowAgent() {
		await ensureWorkflowAgent();
		workflowAgent = window.WorkflowAgentModule.init({
			$,
			num,
			computeBase,
			activeCabins,
			switchTab,
			showProjectReady: () => {
				$("excelMsg").textContent = "Dossier prêt ✓ vous pouvez générer Excel ou PDF.";
				$("excelMsg").className = "text-sm font-semibold ml-1 text-ok";
			},
			msgOkClass: CL.msgOk,
			msgErrClass: CL.msgErr,
		});
		workflowAgent.setStep(1);
	}
	async function initExportsModule() {
		await ensureExports();
		const ex = window.ExportsModule.init({
			$,
			txt,
			num,
			modeOf,
			modeTxt,
			computeBase,
			activeCabins,
			cabinCalc,
			dateHeure,
			plage,
			pdfFmt,
			ensureXlsx,
			ensureJsPdf,
			excelMsgShow,
			dossMsgShow,
			collectState,
			applyState,
			scheduleDbWrite: (immediat) => storageApi.scheduleDbWrite(immediat),
			goApp,
			getConstantes: () => C,
		});
		genExcel = ex.genExcel;
		genPDF = ex.genPDF;
		exportCsv = ex.exportCsv;
		importCsvFichier = ex.importCsvFichier;
	}
	async function initStorageModule() {
		await ensureStorage();
		storageApi = window.StorageModule.init({
			$,
			CL,
			esc,
			heure,
			txt,
			cache,
			goApp,
			collectState,
			applyState,
			render,
			renderDossiers,
			renderAccueil,
			getConstantes: () => C,
			setConstantes: (next) => {
				C = { ...DEFAULTS, ...next };
			},
			defaultConstantes: DEFAULTS,
			fillConstInputs,
			getDossiers: () => dossiersApi.getDossiers(),
			setDossiers: (next) => dossiersApi.setDossiers(next),
		});
	}
	async function initDossiersModule() {
		await ensureDossiers();
		dossiersApi = window.DossiersModule.init({
			$,
			CL,
			cache,
			txt,
			esc,
			heure,
			dateHeure,
			collectState,
			applyState,
			switchTab,
			scheduleDbWrite: (immediat) => storageApi.scheduleDbWrite(immediat),
			hasFileHandle: () => storageApi.hasFileHandle(),
			onDataChanged: () => {
				if (!$("accueil").classList.contains("hidden")) renderAccueil();
			},
		});
	}
	async function initAccueilModule() {
		await ensureAccueil();
		accueilApi = window.AccueilModule.init({
			$,
			CL,
			esc,
			txt,
			dateHeure,
			clearAll,
			render,
			goApp,
			applyState,
			getDbContext: () => storageApi.getContext(),
			getDossiers: () => dossiersApi.getDossiers(),
			findDossierById: (id) => dossiersApi.findDossierById(id),
			getAutosaveSnap: () => dossiersApi.getAutosaveSnap(),
			ouvrirBase,
			creerBase,
			reprendreBase,
			openCsvImportPicker: () => $("importCsvFile").click(),
			openSqliteImportPicker: () => $("importSqliteFile").click(),
		});
		accueilApi.bindActions();
	}

	function collectState() {
		return stateApi.collectState();
	}

	function clearAll(rerender) {
		stateApi.clearAll(rerender);
	}

	function applyState(s) {
		stateApi.applyState(s);
	}

	/* ══════════ 6. DATES → NUITS ═════════════════════════════════════════════ */

	/* Nuits entre deux champs date (null si incomplet/incohérent). */
	function diffJours(idDebut, idFin) {
		const d = txt(idDebut),
			f = txt(idFin);
		if (!d || !f) return null;
		const n = Math.round((new Date(f + "T00:00:00") - new Date(d + "T00:00:00")) / 86400000);
		return n > 0 ? n : null;
	}

	/* Compare dates de croisiere/hotel avec les nuits calculees ; avertit + bouton « Appliquer ». */
	function checkDates(b) {
		const nb = diffJours("pCroisiereDebut", "pCroisiereFin");
		const nh = diffJours("pHotelDebut", "pHotelFin");
		const np = diffJours("pHotelPostDebut", "pHotelPostFin");
		const notice = $("dateNotice");
		const diff = [];
		if (nb !== null && nb !== b.nuits) diff.push(nb + " nuits à bord");
		if (nh !== null && nh !== b.nuitsHotel) diff.push(nh + " nuit" + (nh > 1 ? "s" : "") + " hôtel pré");
		if (np !== null && np !== b.nuitsHotelPost) diff.push(np + " nuit" + (np > 1 ? "s" : "") + " hôtel post");
		if (diff.length) {
			notice.innerHTML =
				"⚠ Selon les dates saisies : " +
				diff.join(", ") +
				' — different du calcul. <button type="button" id="applyDates" class="' +
				CL.btnNotice +
				'">Appliquer ces nuits</button>';
			notice.classList.remove("hidden");
			$("applyDates").addEventListener("click", () => {
				// recréé à chaque rendu → rebranché ici
				if (nb !== null) $("nuits").value = nb;
				if (nh !== null) $("nuitsHotel").value = nh;
				if (np !== null) {
					$("hasPost").checked = true;
					$("nuitsHotelPost").value = np;
				}
				syncToggles();
				render();
			});
		} else {
			notice.classList.add("hidden");
			notice.innerHTML = "";
		}
	}

	/* ══════════ 7. RENDU DES BILLETS DE PRIX ═════════════════════════════════
     render() = LA fonction de rafraîchissement, appelée après chaque frappe.
     Reconstruit le résumé, un billet par catégorie, l'avertissement de dates
     et les billets de revenus. Tout le HTML utilise les gabarits CL. */
	function render() {
		const b = computeBase();
		const cabs = activeCabins(b);
		workflowAgent.refresh(b, cabs);

		const nuitsHotelTxt = b.hasPost
			? b.nuitsHotel + " + " + b.nuitsHotelPost + " nuits d\u2019hôtel"
			: b.nuitsHotel + " nuit" + (b.nuitsHotel > 1 ? "s" : "") + " d\u2019hôtel";
		$("resultsSub").textContent =
			b.pax +
			" passager" +
			(b.pax > 1 ? "s" : "") +
			" · " +
			b.nuits +
			" nuit" +
			(b.nuits > 1 ? "s" : "") +
			" à bord + " +
			nuitsHotelTxt +
			" = " +
			b.totalNuits +
			" nuits au total · " +
			"frais admin " +
			fmt(C.admin) +
			"/pers · frais de service vols " +
			C.pctVols +
			"% · markup hôtel max " +
			C.pctMarkup +
			"%" +
			(b.usd ? " · factures croisière converties à " + b.taux + " CAD/USD" : "") +
			(C.arrondi > 0 ? " · arrondi au " + C.arrondi + " $ supérieur" : "");

		const cont = $("tickets");
		cont.innerHTML = "";

		cabs.forEach((cab) => {
			const r = cabinCalc(b, cab.facture);

			const badge =
				b.perte > 0
					? '<span class="' + CL.badgeLoss + '">perte absorbée ' + fmt(b.perte) + "/pers</span>"
					: '<span class="' + CL.badgeOk + '">frais couverts</span>';

			const pourboiresLbl =
				b.pourboiresMode === "inclus"
					? "Pourboires (inclus au forfait)"
					: b.pourboiresMode === "manuel"
						? "Pourboires prépayés (montant manuel)"
						: "Pourboires prépayés (" + C.pourboiresNuit + " $ × " + b.nuits + " nuits)";

			const cabLbl =
				"Cabine " +
				cab.nom.toLowerCase() +
				" (" +
				fmt(cab.facture) +
				" ÷ " +
				b.pax +
				")" +
				(b.usd ? " — converti de " + cab.factureBrute.toFixed(2) + " USD" : "");

			const lignes = [
				[cabLbl, r.cabinePers],
				["Vols", b.vols],
				["Bagages (aller " + fmt(b.bagAller) + " + retour " + fmt(b.bagRetour) + ")", b.bagages],
				["Hôtel pré (" + fmt(b.hotelNuit) + " × " + b.nuitsHotel + " nuit" + (b.nuitsHotel > 1 ? "s" : "") + " ÷ " + b.pax + ")", b.hotelChambre / b.pax],
			];
			if (b.hasPost) {
				lignes.push([
					"Hôtel post (" + fmt(b.hotelNuitPost) + " × " + b.nuitsHotelPost + " nuit" + (b.nuitsHotelPost > 1 ? "s" : "") + " ÷ " + b.pax + ")",
					b.hotelChambrePost / b.pax,
				]);
			}
			lignes.push(
				["Transferts (" + b.nbTransferts + " segments)", b.transferts],
				[pourboiresLbl, b.pourboires],
				["Frais administratifs", C.admin],
				["Markup hôtel appliqué", b.markup],
			);
			if (r.coussin > 0.005) {
				// évite d'afficher 0,00 $ (arrondi flottant)
				lignes.push(["Coussin d\u2019arrondi (au " + C.arrondi + " $ sup.)", r.coussin]);
			}
			const lignesHtml = lignes
				.map((l) => '<div class="' + CL.line + '"><span class="' + CL.lbl + '">' + l[0] + '</span><span class="' + CL.val + '">' + fmt(l[1]) + "</span></div>")
				.join("");

			const copyBtn = (v) => '<button type="button" class="copy ' + CL.copy + '" data-val="' + v.toFixed(2) + '">copier</button>';
			const taapHtml = b.hasPost
				? '<div class="' +
					CL.taap +
					'">Prix hôtel à afficher dans TAAP — pré : <span class="' +
					CL.taapVal +
					'">' +
					fmt(b.hotelClientChambre) +
					"</span>" +
					copyBtn(b.hotelClientChambre) +
					' · post : <span class="' +
					CL.taapVal +
					'">' +
					fmt(b.hotelClientChambrePost) +
					"</span>" +
					copyBtn(b.hotelClientChambrePost) +
					" /chambre (coûtant + markup réparti)</div>"
				: '<div class="' +
					CL.taap +
					'">Prix hôtel à afficher dans TAAP : <span class="' +
					CL.taapVal +
					'">' +
					fmt(b.hotelClientChambre) +
					"</span>" +
					copyBtn(b.hotelClientChambre) +
					" /chambre (coûtant + markup total)</div>";

			cont.insertAdjacentHTML(
				"beforeend",
				'<article class="' +
					CL.ticket +
					'">' +
					'<div class="' +
					CL.ticketHead +
					'"><span class="' +
					CL.cat +
					'">' +
					cab.nom +
					'</span><span class="' +
					CL.code +
					'">CAT · ' +
					cab.code +
					"</span></div>" +
					'<div class="' +
					CL.ticketBody +
					'">' +
					lignesHtml +
					'<hr class="' +
					CL.divider +
					'">' +
					'<div class="' +
					CL.line +
					'"><span class="' +
					CL.lblStrong +
					'">Frais de service vols visés (' +
					C.pctVols +
					'%)</span><span class="' +
					CL.val +
					'">' +
					fmt(b.fraisVises) +
					"</span></div>" +
					'<div class="' +
					CL.line +
					'"><span class="' +
					CL.lbl +
					'">Markup hôtel maximal (' +
					C.pctMarkup +
					'%)</span><span class="' +
					CL.val +
					'">' +
					fmt(b.markupMax) +
					badge +
					"</span></div>" +
					taapHtml +
					"</div>" +
					'<div class="' +
					CL.ticketFoot +
					'">' +
					'<div><div class="' +
					CL.footK +
					'">Par personne</div><div class="' +
					CL.footV +
					'">' +
					fmt(r.prixPers) +
					"</div></div>" +
					'<div><div class="' +
					CL.footK +
					'">Par pers / nuit · ' +
					b.totalNuits +
					' nuits</div><div class="' +
					CL.footV +
					'">' +
					fmt(r.prixPersNuit) +
					"</div></div>" +
					'<div><div class="' +
					CL.footK +
					'">Total · ' +
					b.pax +
					' pax</div><div class="' +
					CL.footVTotal +
					'">' +
					fmt(r.total) +
					"</div></div>" +
					"</div>" +
					"</article>",
			);
		});

		if (!cabs.length) {
			cont.innerHTML = '<div class="' + CL.empty + '">Entrez le prix d\u2019au moins une catégorie de cabine pour voir le calcul du forfait.</div>';
		}

		checkDates(b);
		renderCommissions(b, cabs);
	}

	/* ══════════ 8. RENDU DES REVENUS (section Sommaire) ══════════════════════ */
	function renderCommissions(b, cabs) {
		const cont = $("commTickets");
		cont.innerHTML = "";

		if (!cabs.length) {
			cont.innerHTML = '<div class="' + CL.empty + '">Entrez le prix d\u2019au moins une categorie de cabine pour voir les revenus estimes.</div>';
			return;
		}

		const commHotel = num("kHotel");
		const commTransferts = num("kTransferts");
		const commVols = num("kVols");
		const markupRev = b.markup * b.pax; // markup vols réellement récupéré via l'hôtel
		const adminRev = C.admin * b.pax; // frais administratifs = revenu

		cabs.forEach((cab) => {
			const r = cabinCalc(b, cab.facture);
			const commCroisiere = num("kCr" + cab.code);
			const coussinRev = r.coussin * b.pax;
			const totalRev = commCroisiere + commHotel + commTransferts + commVols + markupRev + adminRev + coussinRev;
			const pct = r.total > 0 ? (totalRev / r.total) * 100 : 0;

			const lignes = [
				["Commission croisière", commCroisiere],
				["Commission hôtel", commHotel],
				["Commission transferts", commTransferts],
				["Ajustement vols", commVols],
				["Markup vols récupéré (" + fmt(b.markup) + " × " + b.pax + " pax)", markupRev],
				["Frais administratifs (" + fmt(C.admin) + " × " + b.pax + " pax)", adminRev],
			];
			if (coussinRev > 0.005) lignes.push(["Coussin d\u2019arrondi (× " + b.pax + " pax)", coussinRev]);
			const lignesHtml = lignes
				.map((l) => '<div class="' + CL.line + '"><span class="' + CL.lbl + '">' + l[0] + '</span><span class="' + CL.val + '">' + fmt(l[1]) + "</span></div>")
				.join("");

			cont.insertAdjacentHTML(
				"beforeend",
				'<article class="' +
					CL.ticket +
					'">' +
					'<div class="' +
					CL.ticketHead +
					'"><span class="' +
					CL.cat +
					'">' +
					cab.nom +
					'</span><span class="' +
					CL.code +
					'">CAT · ' +
					cab.code +
					"</span></div>" +
					'<div class="' +
					CL.ticketBody +
					'">' +
					lignesHtml +
					(b.perte > 0
						? '<div class="' +
							CL.taapAlerte +
							'">Perte absorbée sur les frais vols : ' +
							fmt(b.perte * b.pax) +
							" au total (déjà reflétée dans le markup récupéré)</div>"
						: "") +
					"</div>" +
					'<div class="' +
					CL.ticketFoot +
					'">' +
					'<div><div class="' +
					CL.footK +
					'">% du forfait</div><div class="' +
					CL.footV +
					'">' +
					pct.toFixed(1) +
					" %</div></div>" +
					'<div><div class="' +
					CL.footK +
					'">Revenu total</div><div class="' +
					CL.footVTotal +
					'">' +
					fmt(totalRev) +
					"</div></div>" +
					"</div>" +
					"</article>",
			);
		});
	}

	/* ══════════ 9. COPIER DANS LE PRESSE-PAPIERS ═════════════════════════════
     Boutons « copier » des encadrés TAAP. API moderne, sinon execCommand. */
	function copyText(t, btn) {
		const done = () => {
			// rétroaction : classes « copié » pendant 1,8 s
			btn.textContent = "copié ✓";
			btn.className = "copy " + CL.copyDone;
			setTimeout(() => {
				btn.textContent = "copier";
				btn.className = "copy " + CL.copy;
			}, 1800);
		};
		const fallback = () => {
			const ta = document.createElement("textarea");
			ta.value = t;
			ta.style.position = "fixed";
			ta.style.opacity = "0";
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand("copy");
				done();
			} catch (e) {}
			document.body.removeChild(ta);
		};
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(t).then(done).catch(fallback);
		} else fallback();
	}
	$("tickets").addEventListener("click", (e) => {
		// délégation : billets recréés à chaque rendu
		const btn = e.target.closest(".copy");
		if (btn) copyText(btn.dataset.val, btn);
	});

	/* ══════════ 10. ÉTAT COMPLET D'UN DOSSIER ════════════════════════════════
	    Détails déplacés dans app/state.js (collect/apply/clear). */

	/* ══════════ 11. DOSSIERS SAUVEGARDÉS ═════════════════════════════════════
	    Détails déplacés dans app/dossiers.js (liste + autosave). */
	async function loadDossiersCache() {
		await dossiersApi.loadDossiersCache();
	}

	function dossMsgShow(t, ok) {
		dossiersApi.showMessage(t, ok);
	}

	async function saveDossier() {
		await dossiersApi.saveDossier();
	}

	function renderDossiers() {
		dossiersApi.renderDossiers();
	}

	$("dossierList").addEventListener("click", async (e) => {
		await dossiersApi.handleDossierListClick(e);
	});

	function scheduleAutosave() {
		dossiersApi.scheduleAutosave();
	}

	async function fetchAutosave() {
		await dossiersApi.fetchAutosave();
	}

	/* ══════════ 13-14. SQL.JS + BASE DISQUE (module) ════════════════════════
     Détails déplacés dans app/storage.js; ici, wrappers pour garder les appels
     existants inchangés dans le reste du fichier. */
	function updateDbStatus() {
		storageApi.updateDbStatus();
	}

	async function detectSavedHandle() {
		await storageApi.detectSavedHandle();
	}

	async function creerBase() {
		await storageApi.creerBase();
	}

	async function ouvrirBase() {
		await storageApi.ouvrirBase();
	}

	async function reprendreBase() {
		await storageApi.reprendreBase();
	}

	/* ══════════ 15. ÉCRAN D'ACCUEIL ══════════════════════════════════════════
	    Trois zones remplies par app/accueil.js. */
	function renderAccueil() {
		accueilApi.renderAccueil();
	}
	/* ══════════ 16. SOMMAIRE EXCEL (interne) ═════════════════════════════════
     Document INTERNE : contient le markup, le prix TAAP, la perte absorbée,
     les notes internes. Ne pas envoyer au client (c'est le rôle du PDF).
     Construit ligne par ligne dans 'rows' via le raccourci R(...colonnes). */

	/* Formate une plage de deux champs date : « Du X au Y » (gère les cas partiels). */
	const plage = (idDebut, idFin) => {
		const d = txt(idDebut),
			f = txt(idFin);
		if (d && f) return "Du " + d + " au " + f;
		if (d) return "À partir du " + d;
		if (f) return "Jusqu\u2019au " + f;
		return "";
	};

	/* Message temporaire a cote des boutons Excel/PDF (onglet Sommaire). */
	function excelMsgShow(t, ok) {
		const m = $("excelMsg");
		m.textContent = t;
		m.className = "save-msg " + (ok ? "ok" : "err");
		setTimeout(() => {
			m.textContent = "";
		}, 4000);
	}

	/* Bouton « Sommaire Excel (interne) ». Sections dans l'ordre :
     titre+horodatage / PROJET / VOYAGE / COÛTS COMMUNS / FRAIS & MARKUP /
     PRIX PAR CATÉGORIE (tableau) / NOTES INTERNES / CONSTANTES UTILISÉES.
     ► Pour ajouter une ligne : un appel R('Libellé', valeur, 'détail'). */
	function genExcel() {
		if (typeof XLSX === "undefined") {
			excelMsgShow("Librairie Excel non chargée — vérifiez que le dossier lib/ accompagne le fichier HTML", false);
			return;
		}

		const b = computeBase();
		const cabs = activeCabins(b);
		const cabNums = { INT: txt("pCabInt"), EXT: txt("pCabExt"), BAL: txt("pCabBal"), SUI: txt("pCabSui") };
		const titre = txt("pTitre") || "Sommaire de forfait";
		const horodatage = dateHeure(new Date());
		const depot = num("pDepot");

		const rows = [];
		const R = (...c) => rows.push(c); // R('a','b') = une ligne, chaque argument = une colonne

		R(titre.toUpperCase());
		R("Généré le", horodatage, "Les prix évoluent rapidement — sommaire valide au moment de la génération");
		R();

		R("PROJET");
		R("Compagnie de croisière", txt("pCompagnie"));
		R("Navire", txt("pNavire"));
		R("Port de départ", txt("pPortDep"));
		R("Port d\u2019arrivée", txt("pPortArr"));
		R("Croisière — dates", plage("pCroisiereDebut", "pCroisiereFin"));
		R("Hôtel pré-croisière", txt("pHotel"), plage("pHotelDebut", "pHotelFin"));
		if (b.hasPost || txt("pHotelPost") || plage("pHotelPostDebut", "pHotelPostFin"))
			R("Hôtel post-croisière", txt("pHotelPost"), plage("pHotelPostDebut", "pHotelPostFin"));
		R("Détails des vols", txt("pVols"));
		R();

		R("VOYAGE");
		R("Passagers", b.pax);
		R("Nuits à bord", b.nuits);
		R("Nuits à l\u2019hôtel — pré-croisière", b.nuitsHotel);
		if (b.hasPost) R("Nuits à l\u2019hôtel — post-croisière", b.nuitsHotelPost);
		R("Nuits au total", b.totalNuits);
		R(
			"Pourboires",
			b.pourboiresMode === "inclus"
				? "Inclus dans le forfait"
				: b.pourboiresMode === "manuel"
					? "Prépayés — montant manuel : " + b.pourboires.toFixed(2) + " $/pers"
					: "Prépayés — " + C.pourboiresNuit + " $ × " + b.nuits + " nuits = " + b.pourboires.toFixed(2) + " $/pers",
		);
		if (b.usd) R("Taux de change appliqué (croisière)", b.taux, "USD → CAD");
		if (C.arrondi > 0) R("Arrondi du prix par personne", "Au " + C.arrondi + " $ supérieur");
		if (depot > 0 || txt("pDepotDate") || txt("pSoldeDate")) {
			R("Dépôt requis", depot, depot > 0 ? depot.toFixed(2) + " $/pers × " + b.pax + " pax = " + (depot * b.pax).toFixed(2) + " $" : "");
			if (txt("pDepotDate")) R("Date limite — dépôt", txt("pDepotDate"));
			if (txt("pSoldeDate")) R("Date limite — solde", txt("pSoldeDate"));
		}
		R();

		// Chaque ligne indique le mode saisi ($/pers ou total) et le calcul de conversion si total
		R("COÛTS COMMUNS", "Montant saisi", "Détail");
		R("Vols (" + modeTxt("vols") + ")", num("vols"), modeOf("vols") === "tot" ? "Total ÷ " + b.pax + " pax = " + b.vols.toFixed(2) + " $/pers" : "");
		R(
			"Bagages — aller (" + modeTxt("bagAller") + ")",
			num("bagAller"),
			modeOf("bagAller") === "tot" ? "÷ " + b.pax + " pax = " + b.bagAller.toFixed(2) + " $/pers" : "",
		);
		R(
			"Bagages — retour (" + modeTxt("bagRetour") + ")",
			num("bagRetour"),
			modeOf("bagRetour") === "tot" ? "÷ " + b.pax + " pax = " + b.bagRetour.toFixed(2) + " $/pers" : "",
		);
		R(
			"Hôtel pré — chambre par nuit (coûtant)",
			b.hotelNuit,
			b.hotelNuit.toFixed(2) + " × " + b.nuitsHotel + " nuits ÷ " + b.pax + " pax = " + (b.hotelChambre / b.pax).toFixed(2) + " $/pers",
		);
		if (b.hasPost)
			R(
				"Hôtel post — chambre par nuit (coûtant)",
				b.hotelNuitPost,
				b.hotelNuitPost.toFixed(2) + " × " + b.nuitsHotelPost + " nuits ÷ " + b.pax + " pax = " + (b.hotelChambrePost / b.pax).toFixed(2) + " $/pers",
			);
		const trDetail = (id, comp) => [comp, modeOf(id) === "tot" ? "Total ÷ " + b.pax + " pax" : "Par personne"].filter(Boolean).join(" — ");
		R("Transfert Aéroport → Hôtel (" + modeTxt("trA") + ")", num("trA"), trDetail("trA", txt("pTrA")));
		R("Transfert Hôtel → Port (" + modeTxt("trB") + ")", num("trB"), trDetail("trB", txt("pTrB")));
		R("Transfert Port → Aéroport (" + modeTxt("trC") + ")", num("trC"), trDetail("trC", txt("pTrC")));
		if (b.hasPost) {
			R("Transfert Port → Hôtel post (" + modeTxt("trD") + ")", num("trD"), trDetail("trD", ""));
			R("Transfert Hôtel post → Aéroport (" + modeTxt("trE") + ")", num("trE"), trDetail("trE", ""));
		}
		R();

		R("FRAIS & MARKUP (par personne)");
		R("Frais administratifs", C.admin);
		R("Frais de service vols visés (" + C.pctVols + " %)", b.fraisVises);
		R("Markup hôtel maximal (" + C.pctMarkup + " %)", b.markupMax, b.hasPost ? "Calculé sur les 2 hôtels combinés" : "");
		R("Markup hôtel appliqué", b.markup);
		R("Perte absorbée", b.perte, b.perte > 0 ? "Frais visés > markup possible" : "");
		R("Prix hôtel pré à afficher dans TAAP (par chambre)", b.hotelClientChambre, b.hasPost ? "Coûtant + part du markup" : "Coûtant + markup total du groupe");
		if (b.hasPost) R("Prix hôtel post à afficher dans TAAP (par chambre)", b.hotelClientChambrePost, "Coûtant + part du markup");
		R();

		R("PRIX PAR CATÉGORIE");
		if (cabs.length) {
			R(
				"Catégorie",
				"Cabine exemple",
				"Facture croisière (CAD)",
				"Croisière / pers",
				"Prix / pers",
				"Prix / pers / nuit",
				"Total · " + b.pax + " pax",
				"Dépôt total",
				"Solde",
			);
			cabs.forEach((cab) => {
				const r = cabinCalc(b, cab.facture);
				const depTotal = depot * b.pax;
				R(
					cab.nom,
					cabNums[cab.code] || "",
					cab.facture,
					r.cabinePers,
					r.prixPers,
					r.prixPersNuit,
					r.total,
					depot > 0 ? depTotal : "",
					depot > 0 ? r.total - depTotal : "",
				);
			});
		} else {
			R("Aucune catégorie de cabine remplie dans le calculateur");
		}
		R();

		const notes = txt("pNotes");
		if (notes) {
			R("NOTES INTERNES");
			R(notes);
			R();
		}

		R("CONSTANTES UTILISÉES");
		R("Frais administratifs (par passager)", C.admin);
		R("Frais de service sur les vols (%)", C.pctVols);
		R("Markup maximum hôtel (%)", C.pctMarkup);
		R("Pourboires prépayés (par nuit, par personne)", C.pourboiresNuit);
		R("Arrondi du prix par personne", C.arrondi > 0 ? "Au " + C.arrondi + " $ supérieur" : "Aucun");

		try {
			const ws = XLSX.utils.aoa_to_sheet(rows);
			ws["!cols"] = [{ wch: 44 }, { wch: 20 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }]; // largeurs des colonnes
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Sommaire");
			const nomFichier =
				titre
					.replace(/[\\/:*?"<>|]/g, "")
					.replace(/\s+/g, "-")
					.toLowerCase()
					.slice(0, 60) || "sommaire-forfait";
			XLSX.writeFile(wb, nomFichier + ".xlsx");
			excelMsgShow("Sommaire Excel téléchargé ✓", true);
		} catch (e) {
			excelMsgShow("Erreur lors de la génération du fichier", false);
		}
	}

	/* ══════════ 17. SOUMISSION CLIENT PDF ════════════════════════════════════
     Document CLIENT : itinéraire, inclusions, prix par catégorie, paiement.
     ► NE CONTIENT JAMAIS : markup, prix TAAP, perte, commissions, notes internes.
     Construction manuelle avec jsPDF : 'y' = position verticale courante (mm),
     checkY(h) ajoute une page si les h prochains mm ne rentrent pas. */
	function genPDF() {
		if (!window.jspdf || !window.jspdf.jsPDF) {
			excelMsgShow("Librairie PDF non chargée — vérifiez que le dossier lib/ accompagne le fichier HTML", false);
			return;
		}
		const b = computeBase();
		const cabs = activeCabins(b);
		if (!cabs.length) {
			excelMsgShow("Entrez au moins une catégorie de cabine avant de générer la soumission", false);
			return;
		}

		const doc = new window.jspdf.jsPDF({ unit: "mm", format: "letter" });
		const W = 216,
			MARGE = 18; // largeur lettre US en mm, marges latérales
		const LARGE = W - MARGE * 2;
		let y = 0; // curseur vertical

		// Palette du PDF (RVB) — reprend les couleurs de l'outil
		const marine = [13, 43, 69],
			lagon = [14, 124, 134],
			sourdine = [91, 113, 131],
			encre = [28, 43, 54],
			ligne = [216, 226, 233];
		const horodatage = dateHeure(new Date());

		const checkY = (besoin) => {
			if (y + besoin > 262) {
				doc.addPage();
				y = 20;
			}
		}; // saut de page automatique
		const section = (t) => {
			// titre de section avec ligne de soulignement
			checkY(16);
			y += 9;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10.5);
			doc.setTextColor(...marine);
			doc.text(t.toUpperCase(), MARGE, y);
			doc.setDrawColor(...ligne);
			doc.setLineWidth(0.3);
			doc.line(MARGE, y + 2, W - MARGE, y + 2);
			y += 8;
		};
		const infoLine = (lbl, val) => {
			// ligne libellé/valeur ; ignorée si valeur vide
			if (!val) return;
			checkY(7);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(9.5);
			doc.setTextColor(...sourdine);
			doc.text(lbl, MARGE, y);
			doc.setTextColor(...encre);
			const lignesTxt = doc.splitTextToSize(String(val), LARGE - 62); // repli automatique des textes longs
			doc.text(lignesTxt, MARGE + 60, y);
			y += 5.5 * lignesTxt.length;
		};

		// ── Bandeau d'en-tête ──
		doc.setFillColor(...marine);
		doc.rect(0, 0, W, 34, "F");
		doc.setFont("helvetica", "bold");
		doc.setFontSize(17);
		doc.setTextColor(255, 255, 255);
		doc.text(txt("pTitre") || "Votre projet de voyage", MARGE, 16);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);
		doc.setTextColor(159, 195, 217);
		doc.text("Soumission préparée le " + horodatage + " — prix sujets à changement sans préavis", MARGE, 24);
		y = 42;

		// ── Itinéraire ──
		section("Votre croisière");
		infoLine("Compagnie", txt("pCompagnie"));
		infoLine("Navire", txt("pNavire"));
		infoLine("Dates", plage("pCroisiereDebut", "pCroisiereFin"));
		infoLine("Départ / arrivée", [txt("pPortDep"), txt("pPortArr")].filter(Boolean).join(" → "));
		infoLine("Nuits à bord", String(b.nuits));

		const hebPre = [txt("pHotel"), plage("pHotelDebut", "pHotelFin")].filter(Boolean).join(" — ");
		const hebPost = [txt("pHotelPost"), plage("pHotelPostDebut", "pHotelPostFin")].filter(Boolean).join(" — ");
		if (hebPre || hebPost || b.nuitsHotel > 0) {
			section("Hébergement");
			infoLine("Avant la croisière", hebPre || b.nuitsHotel + " nuit" + (b.nuitsHotel > 1 ? "s" : "") + " d\u2019hôtel");
			if (b.hasPost) infoLine("Après la croisière", hebPost || b.nuitsHotelPost + " nuit" + (b.nuitsHotelPost > 1 ? "s" : "") + " d\u2019hôtel");
		}

		if (txt("pVols")) {
			section("Vols");
			infoLine("Itinéraire", txt("pVols"));
		}

		// ── Liste des inclusions (puces) ──
		section("Ce forfait comprend");
		const inclusions = [
			"Croisière de " + b.nuits + " nuit" + (b.nuits > 1 ? "s" : "") + " dans la catégorie choisie",
			"Vols aller-retour",
			"Franchise de bagages",
		];
		inclusions.push(b.hasPost ? "Hébergement avant et après la croisière" : "Hébergement avant la croisière");
		inclusions.push("Tous les transferts (" + b.nbTransferts + " segments)");
		if (b.pourboiresMode === "inclus") inclusions.push("Pourboires à bord (inclus par la croisiériste)");
		else inclusions.push("Pourboires à bord prépayés");
		inclusions.push("Frais de service et de gestion du dossier");
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...encre);
		inclusions.forEach((inc) => {
			checkY(6);
			doc.setTextColor(...lagon);
			doc.text("•", MARGE, y);
			doc.setTextColor(...encre);
			doc.text(inc, MARGE + 5, y);
			y += 5.5;
		});

		// ── Un encadré de prix par catégorie remplie ──
		section("Prix par personne — occupation double" + (b.pax !== 2 ? " (" + b.pax + " passagers)" : ""));
		cabs.forEach((cab) => {
			const r = cabinCalc(b, cab.facture);
			checkY(24);
			doc.setDrawColor(...ligne);
			doc.setLineWidth(0.3);
			doc.roundedRect(MARGE, y - 4, LARGE, 19, 2, 2);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.setTextColor(...marine);
			doc.text("Cabine " + cab.nom.toLowerCase(), MARGE + 5, y + 2.5);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8.5);
			doc.setTextColor(...sourdine);
			doc.text(
				"Soit " + pdfFmt(r.prixPersNuit) + " par personne par nuit (" + b.totalNuits + " nuits) — total pour " + b.pax + " pax : " + pdfFmt(r.total),
				MARGE + 5,
				y + 9,
			);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(14);
			doc.setTextColor(...lagon);
			doc.text(pdfFmt(r.prixPers), W - MARGE - 5, y + 5, { align: "right" }); // le prix, aligné à droite
			y += 22;
		});

		// ── Modalités de paiement (seulement si dépôt ou dates saisis) ──
		const depot = num("pDepot");
		if (depot > 0 || txt("pDepotDate") || txt("pSoldeDate")) {
			section("Modalités de paiement");
			if (depot > 0)
				infoLine(
					"Dépôt requis",
					pdfFmt(depot) + " par personne (" + pdfFmt(depot * b.pax) + " au total)" + (txt("pDepotDate") ? " — d\u2019ici le " + txt("pDepotDate") : ""),
				);
			else if (txt("pDepotDate")) infoLine("Dépôt", "D\u2019ici le " + txt("pDepotDate"));
			if (txt("pSoldeDate")) infoLine("Solde", "Paiement complet d\u2019ici le " + txt("pSoldeDate"));
		}

		// ── Pied de page (mentions) ──
		checkY(14);
		y += 6;
		doc.setDrawColor(...ligne);
		doc.line(MARGE, y, W - MARGE, y);
		y += 6;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		doc.setTextColor(...sourdine);
		doc.text("Les prix sont en dollars canadiens, par personne, et valides au moment de la préparation de cette soumission.", MARGE, y);
		y += 4.5;
		doc.text("La disponibilité des cabines, des vols et des hôtels n\u2019est pas garantie tant que le dossier n\u2019est pas confirmé.", MARGE, y);

		try {
			const titre = txt("pTitre") || "soumission";
			const nomFichier = titre
				.replace(/[\\/:*?"<>|]/g, "")
				.replace(/\s+/g, "-")
				.toLowerCase()
				.slice(0, 60);
			doc.save(nomFichier + "-client.pdf");
			excelMsgShow("Soumission client PDF téléchargée ✓", true);
		} catch (e) {
			excelMsgShow("Erreur lors de la génération du PDF", false);
		}
	}

	/* ══════════ 18. EXPORT / IMPORT CSV (un seul dossier) ════════════════════
     Format : 2 colonnes « champ,valeur », une ligne par champ de l'état,
     plus des lignes __meta_ (version, date, nom). BOM UTF-8 pour qu'Excel
     affiche correctement les accents. */

	/* Échappe une valeur CSV : guillemets doublés + encadrement si nécessaire. */
	const csvEsc = (v) => {
		const s = String(v);
		return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
	};

	/* Bouton « Exporter le dossier en CSV » : l'état actuel → téléchargement. */
	function exportCsv() {
		const state = collectState();
		const lignes = [
			"champ,valeur",
			csvEsc("__meta_version") + "," + csvEsc("1"),
			csvEsc("__meta_exporte") + "," + csvEsc(new Date().toISOString()),
			csvEsc("__meta_nom") + "," + csvEsc(txt("dossierNom") || txt("pTitre") || ""),
		];
		Object.keys(state).forEach((k) => {
			lignes.push(csvEsc(k) + "," + csvEsc(state[k]));
		});
		const contenu = "\ufeff" + lignes.join("\r\n"); // \ufeff = BOM UTF-8 (accents corrects dans Excel)
		const blob = new Blob([contenu], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		const nom = (txt("dossierNom") || txt("pTitre") || "dossier-forfait")
			.replace(/[\\/:*?"<>|]/g, "")
			.replace(/\s+/g, "-")
			.toLowerCase()
			.slice(0, 60);
		a.download = nom + ".csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(() => URL.revokeObjectURL(a.href), 2000);
		dossMsgShow("Dossier exporté en CSV ✓", true);
	}

	/* Analyseur CSV maison : gère les guillemets, les virgules et les sauts de
     ligne À L'INTÉRIEUR des valeurs citées (p. ex. les notes multi-lignes).
     Retourne un tableau de lignes, chaque ligne = tableau de valeurs. */
	function parseCsv(texte) {
		const rows = [];
		let champ = "",
			row = [],
			dansGuillemets = false;
		const t = texte.replace(/^\ufeff/, ""); // retire le BOM s'il est présent
		for (let i = 0; i < t.length; i++) {
			const c = t[i];
			if (dansGuillemets) {
				if (c === '"') {
					if (t[i + 1] === '"') {
						champ += '"';
						i++;
					} // "" = un guillemet littéral
					else dansGuillemets = false;
				} else champ += c;
			} else {
				if (c === '"') dansGuillemets = true;
				else if (c === ",") {
					row.push(champ);
					champ = "";
				} else if (c === "\n" || c === "\r") {
					if (c === "\r" && t[i + 1] === "\n") i++; // \r\n compte pour un seul saut
					row.push(champ);
					champ = "";
					if (row.length > 1 || row[0] !== "") rows.push(row); // ignore les lignes vides
					row = [];
				} else champ += c;
			}
		}
		if (champ !== "" || row.length) {
			row.push(champ);
			rows.push(row);
		}
		return rows;
	}

	/* Lit un fichier CSV importé et applique l'état (REMPLACE ce qui est à l'écran).
     Les champs inconnus sont ignorés ; 0 champ reconnu = message d'erreur. */
	function importCsvFichier(file) {
		const lecteur = new FileReader();
		lecteur.onload = () => {
			try {
				const rows = parseCsv(lecteur.result);
				const state = {};
				let nom = "";
				let valides = 0;
				rows.forEach((r) => {
					if (r.length < 2) return;
					const k = r[0],
						v = r.slice(1).join(","); // recolle les virgules non citées par prudence
					if (k === "champ") return; // ligne d'en-tête
					if (k === "__meta_nom") {
						nom = v;
						return;
					}
					if (k.startsWith("__meta_")) return;
					const el = $(k);
					if (!el) return; // champ inconnu (autre version?) → ignoré
					state[k] = el.type === "checkbox" ? v === "true" : v;
					valides++;
				});
				if (!valides) {
					dossMsgShow("Aucun champ reconnu dans ce CSV — est-ce un export de cet outil?", false);
					return;
				}
				applyState(state);
				if (nom) $("dossierNom").value = nom;
				dossMsgShow("Dossier importé (" + valides + " champs) ✓", true);
				scheduleDbWrite();
				goApp("croisiere");
			} catch (e) {
				dossMsgShow("Impossible de lire ce fichier CSV", false);
			}
		};
		lecteur.onerror = () => dossMsgShow("Impossible de lire ce fichier", false);
		lecteur.readAsText(file, "utf-8");
	}

	/* ══════════ 19. EXPORT / IMPORT SQLITE MANUELS ═══════════════════════════
     Indépendants de la base connectée : l'export télécharge une copie datée,
     l'import FUSIONNE une autre base dans la vôtre (rien n'est écrasé sauf
     les dossiers dont la version importée est plus récente). */

	async function exportSqlite() {
		await storageApi.exportSqlite();
	}

	async function importSqliteFichier(file) {
		await storageApi.importSqliteFichier(file);
	}

	/* ══════════ 20. BASCULES D'INTERFACE + ÉCOUTEURS ═════════════════════════ */

	/* Synchronise l'affichage conditionnel avec l'état des cases à cocher :
     champs hôtel post + transferts post, champ pourboires manuel (grisé si
     « inclus »), champ taux de change (visible si case USD). Appelée après
     chaque modification et après tout chargement d'état. */
	function syncToggles() {
		const pre = $("hasPre").checked;
		const on = $("hasPost").checked;
		const transfertsOn = $("hasTransferts").checked;
		$("nuitsHotelWrap").classList.toggle("hidden", !pre);
		$("hotelPreWrap").classList.toggle("hidden", !pre);
		$("transfertsFields").classList.toggle("hidden", !transfertsOn);
		$("postFields").classList.toggle("hidden", !on);
		$("postHotelFields").classList.toggle("hidden", !on);
		$("postTransferts").classList.toggle("hidden", !on || !transfertsOn);
		const inclus = $("pourboiresInclus").checked;
		$("pourboiresManuel").disabled = inclus;
		$("pourboiresManuelWrap").style.opacity = inclus ? 0.45 : 1;
		$("tauxWrap").classList.toggle("hidden", !$("usdCab").checked);
		const hasPost = $("hasPost").checked;
		const postTransferGroup = $("incTransfPostGroup");
		if (postTransferGroup) postTransferGroup.classList.toggle("hidden", !hasPost);
		document.querySelectorAll(".inclusion-toggle").forEach((el) => {
			const detailWrap = $(el.dataset.detail || "");
			if (!detailWrap) return;
			detailWrap.classList.toggle("hidden", !el.checked);
		});
	}

	/* L'ecouteur central : CHAQUE modification d'un champ des pages de donnees
     déclenche → bascules + recalcul + sauvegarde cache (45 s) + écriture base (4 s).
     ('change' en plus de 'input' pour les selects, cases et dates : certains
     navigateurs n'émettent pas 'input' pour ces types.) */
	document
		.querySelectorAll(
			"#page-croisiere input, #page-croisiere select, #page-croisiere textarea, #page-vols input, #page-vols select, #page-vols textarea, #page-hotel input, #page-hotel select, #page-hotel textarea, #page-transferts input, #page-transferts select, #page-transferts textarea, #page-sommaire input, #page-sommaire select, #page-sommaire textarea",
		)
		.forEach((el) => {
			el.addEventListener("input", () => {
				syncToggles();
				render();
				scheduleAutosave();
				scheduleDbWrite();
			});
			if (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "date") {
				el.addEventListener("change", () => {
					syncToggles();
					render();
					scheduleAutosave();
					scheduleDbWrite();
				});
			}
		});

	// ── Boutons (un écouteur par bouton, dans l'ordre des onglets) ──
	$("saveConst").addEventListener("click", saveConst); // Paramètres : enregistrer les constantes
	$("genExcel").addEventListener("click", () => genExcel()); // Projet : sommaire Excel interne
	$("genPDF").addEventListener("click", () => genPDF()); // Projet : soumission client PDF
	$("calcGenerate").addEventListener("click", () => workflowAgent.prepare()); // Sommaire : validation guidee
	$("saveDossier").addEventListener("click", saveDossier); // Dossiers : enregistrer
	$("newDossier").addEventListener("click", () => {
		// Dossiers : tout vider
		clearAll();
		$("dossierNom").value = "";
		scheduleDbWrite();
		dossMsgShow("Tous les champs ont été vidés — prêt pour un nouveau dossier", true);
	});
	$("exportCsv").addEventListener("click", () => exportCsv()); // Dossiers : export CSV
	$("importCsv").addEventListener("click", () => $("importCsvFile").click()); // ouvre le sélecteur de fichier caché
	$("importCsvFile").addEventListener("change", (e) => {
		if (e.target.files && e.target.files[0]) importCsvFichier(e.target.files[0]);
		e.target.value = ""; // permet de réimporter le même fichier deux fois de suite
	});
	$("exportSqlite").addEventListener("click", exportSqlite); // Paramètres : copie .sqlite
	$("importSqlite").addEventListener("click", () => $("importSqliteFile").click());
	$("importSqliteFile").addEventListener("change", (e) => {
		if (e.target.files && e.target.files[0]) importSqliteFichier(e.target.files[0]);
		e.target.value = "";
	});
	$("dbOpen2").addEventListener("click", ouvrirBase); // Paramètres : connecter une base
	$("dbCreate2").addEventListener("click", creerBase); // Paramètres : créer une base
	$("dbResume").addEventListener("click", reprendreBase); // Paramètres : reprendre la base mémorisée

	/* Avant la fermeture de la page : dernière tentative d'écriture si des
     modifications attendaient. (Le navigateur ne garantit pas la fin d'une
     opération asynchrone ici — c'est un « meilleur effort », le délai de 4 s
     rend le cas rare de toute façon.) */
	window.addEventListener("beforeunload", () => {
		storageApi.onBeforeUnload();
	});

	/* ══════════ 21. DÉMARRAGE ════════════════════════════════════════════════
     Ordre : bascules → statut → constantes (cache) → premier rendu →
     en parallèle : dossiers (cache) + copie auto + poignée mémorisée →
     statut à jour → construction de l'écran d'accueil.
     L'accueil reste affiché jusqu'à ce que l'utilisateur choisisse une action. */
	syncToggles();
	updateDbStatus();
	(async () => {
		await initCalculCore();
		await initStateModule();
		await initStorageModule();
		await initDossiersModule();
		await initAccueilModule();
		await initWorkflowAgent();
		await initExportsModule();
		await loadConstCache();
		render();
		await Promise.all([loadDossiersCache(), fetchAutosave(), detectSavedHandle()]);
		updateDbStatus();
		renderAccueil();
	})();
})();
