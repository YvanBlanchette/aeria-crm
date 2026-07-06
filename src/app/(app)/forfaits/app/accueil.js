(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var CL = options.CL;
		var esc = options.esc;
		var txt = options.txt;
		var dateHeure = options.dateHeure;
		var clearAll = options.clearAll;
		var render = options.render;
		var goApp = options.goApp;
		var applyState = options.applyState;
		var getDbContext = options.getDbContext;
		var getDossiers = options.getDossiers;
		var findDossierById = options.findDossierById;
		var getAutosaveSnap = options.getAutosaveSnap;
		var ouvrirBase = options.ouvrirBase;
		var creerBase = options.creerBase;
		var reprendreBase = options.reprendreBase;
		var openCsvImportPicker = options.openCsvImportPicker;
		var openSqliteImportPicker = options.openSqliteImportPicker;

		var actionsBound = false;

		// Render is pure UI: call after any data/context change while home is visible.
		function renderAccueil() {
			var dbCtx = getDbContext();
			var FSA = dbCtx.FSA;
			var handleMemorise = dbCtx.handleMemorise;
			var dossiers = getDossiers();
			var autosaveSnap = getAutosaveSnap();
			var dbTxt = $("accueilDbTxt");
			var dbBtns = $("accueilDbBtns");

			if (!FSA) {
				dbTxt.textContent =
					"Le fichier de donnees automatique (.sqlite ecrit en continu sur votre disque) necessite Chrome ou Edge avec cet outil ouvert localement. Ici, vos donnees sont conservees dans le stockage integre - pensez aux exports.";
				dbBtns.innerHTML = "";
			} else if (handleMemorise) {
				dbTxt.textContent =
					"Votre base « " +
					handleMemorise.name +
					" » est memorisee. Un clic pour la rouvrir (le navigateur demandera confirmation) - tous vos dossiers et le travail en cours seront recharges.";
				dbBtns.innerHTML =
					'<button id="aDbReprendre" class="' +
					CL.btn +
					' mr-2 mb-1.5">Reprendre ' +
					esc(handleMemorise.name) +
					"</button>" +
					'<button id="aDbOuvrir" class="' +
					CL.btnGhost +
					' mr-2 mb-1.5">Ouvrir une autre base...</button>' +
					'<button id="aDbCreer" class="' +
					CL.btnGhost +
					' mb-1.5">Creer une nouvelle base...</button>';
				$("aDbReprendre").addEventListener("click", reprendreBase);
				$("aDbOuvrir").addEventListener("click", ouvrirBase);
				$("aDbCreer").addEventListener("click", creerBase);
			} else {
				dbTxt.textContent =
					"Recommande : creez votre fichier de donnees (.sqlite) - placez-le dans OneDrive/Dropbox pour une sauvegarde infonuagique. L'outil y ecrira automatiquement pendant que vous travaillez ; effacer les donnees de navigation n'y touchera jamais.";
				dbBtns.innerHTML =
					'<button id="aDbCreer" class="' +
					CL.btn +
					' mr-2 mb-1.5">Creer ma base de donnees...</button>' +
					'<button id="aDbOuvrir" class="' +
					CL.btnGhost +
					' mb-1.5">Ouvrir une base existante...</button>';
				$("aDbCreer").addEventListener("click", creerBase);
				$("aDbOuvrir").addEventListener("click", ouvrirBase);
			}

			var cont = $("accueilDossiers");
			if (!dossiers.length) {
				cont.innerHTML =
					'<div class="' + CL.aEmpty + '">Aucun dossier pour le moment' + (handleMemorise ? " - reprenez d'abord votre base ci-dessus." : ".") + "</div>";
			} else {
				cont.innerHTML = dossiers
					.map(function (d) {
						return (
							'<button type="button" class="aitem ' +
							CL.aitem +
							'" data-id="' +
							d.id +
							'">' +
							'<div class="' +
							CL.aitemNom +
							'">' +
							esc(d.nom) +
							"</div>" +
							'<div class="' +
							CL.aitemDate +
							'">' +
							dateHeure(new Date(d.ts)) +
							"</div></button>"
						);
					})
					.join("");
			}

			if (autosaveSnap) {
				$("accueilReprendreTxt").innerHTML =
					"Travail non enregistre" +
					(autosaveSnap.nom ? " - « " + esc(autosaveSnap.nom) + " »" : "") +
					" (copie automatique du " +
					dateHeure(new Date(autosaveSnap.ts)) +
					")";
				$("accueilReprendre").classList.remove("hidden");
			}
		}

		// Bind once to avoid stacking listeners if renderAccueil is called often.
		function bindActions() {
			if (actionsBound) return;
			actionsBound = true;

			$("accueilCreer").addEventListener("click", function () {
				var nom = txt("accueilNom");
				clearAll();
				$("dossierNom").value = nom;
				if (nom) $("pTitre").value = nom;
				render();
				goApp("croisiere");
			});

			$("accueilNom").addEventListener("keydown", function (e) {
				if (e.key === "Enter") $("accueilCreer").click();
			});

			$("accueilDossiers").addEventListener("click", function (e) {
				var item = e.target.closest(".aitem");
				if (!item) return;
				var d = findDossierById(item.dataset.id);
				if (!d) return;
				applyState(d.state);
				$("dossierNom").value = d.nom;
				goApp("croisiere");
			});

			$("accueilImporter").addEventListener("click", openCsvImportPicker);
			$("accueilImporterSqlite").addEventListener("click", openSqliteImportPicker);

			$("accueilReprendreBtn").addEventListener("click", function () {
				var snap = getAutosaveSnap();
				if (!snap) return;
				applyState(snap.state);
				if (snap.nom) $("dossierNom").value = snap.nom;
				goApp("croisiere");
			});

			$("accueilPasser").addEventListener("click", function () {
				goApp("croisiere");
			});
		}

		return {
			renderAccueil: renderAccueil,
			bindActions: bindActions,
		};
	}

	window.AccueilModule = { init: init };
})();
