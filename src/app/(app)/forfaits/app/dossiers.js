(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var CL = options.CL;
		var cache = options.cache;
		var txt = options.txt;
		var esc = options.esc;
		var heure = options.heure;
		var dateHeure = options.dateHeure;
		var collectState = options.collectState;
		var applyState = options.applyState;
		var switchTab = options.switchTab;
		var scheduleDbWrite = options.scheduleDbWrite;
		var hasFileHandle = options.hasFileHandle;
		var onDataChanged = options.onDataChanged;

		var dossiers = [];
		var dernierAutosave = "";
		var autosaveTimer = null;
		var autosaveSnap = null;

		function notifyDataChanged() {
			if (typeof onDataChanged === "function") onDataChanged();
		}

		function showMessage(t, ok) {
			var m = $("dossMsg");
			if (!m) return;
			m.textContent = t;
			m.className = ok ? CL.msgOk : CL.msgErr;
			setTimeout(function () {
				m.textContent = "";
			}, 4000);
		}

		function getDossiers() {
			return dossiers;
		}

		function setDossiers(next) {
			dossiers = Array.isArray(next) ? next : [];
		}

		function findDossierById(id) {
			return dossiers.find(function (x) {
				return x.id === id;
			});
		}

		function getAutosaveSnap() {
			return autosaveSnap;
		}

		async function loadDossiersCache() {
			var v = await cache.get("dossiers-forfaits");
			if (v) {
				try {
					dossiers = JSON.parse(v);
				} catch (e) {
					dossiers = [];
				}
			}
			renderDossiers();
		}

		async function persistDossiers() {
			// Single write path for dossiers: cache + disk scheduling + accueil refresh hook.
			var ok = await cache.set("dossiers-forfaits", JSON.stringify(dossiers));
			scheduleDbWrite(true);
			notifyDataChanged();
			return ok;
		}

		async function saveDossier() {
			var nom = txt("dossierNom") || txt("pTitre") || "Dossier sans titre";
			var existant = dossiers.find(function (d) {
				return d.nom === nom;
			});
			var entree = { id: existant ? existant.id : Date.now().toString(36), nom: nom, ts: new Date().toISOString(), state: collectState() };
			if (existant) dossiers[dossiers.indexOf(existant)] = entree;
			else dossiers.unshift(entree);
			var ok = await persistDossiers();
			if (hasFileHandle()) showMessage((existant ? "Dossier « " + nom + " » mis a jour" : "Dossier « " + nom + " » enregistre") + " dans la base", true);
			else if (ok) showMessage(existant ? "Dossier « " + nom + " » mis a jour" : "Dossier « " + nom + " » enregistre", true);
			else showMessage("Sauvegarde locale impossible - connectez une base ou exportez en CSV", false);
			renderDossiers();
		}

		function renderDossiers() {
			var cont = $("dossierList");
			if (!cont) return;
			if (!dossiers.length) {
				cont.innerHTML = '<div class="' + CL.empty + '">Aucun dossier enregistre pour le moment.</div>';
				return;
			}
			cont.innerHTML = dossiers
				.map(function (d) {
					var quand = dateHeure(new Date(d.ts));
					return (
						'<div class="dossier ' +
						CL.dossier +
						'" data-id="' +
						d.id +
						'">' +
						'<div><div class="' +
						CL.dossierNom +
						'">' +
						esc(d.nom) +
						'</div><div class="' +
						CL.dossierDate +
						'">Sauvegarde le ' +
						quand +
						"</div></div>" +
						'<div class="flex gap-2 flex-wrap">' +
						'<button class="' +
						CL.btnSmall +
						'" data-act="open">Ouvrir</button>' +
						'<button class="' +
						CL.btnSmallGhost +
						'" data-act="dup">Dupliquer</button>' +
						'<button class="' +
						CL.btnSmallDanger +
						'" data-act="del">Supprimer</button>' +
						"</div></div>"
					);
				})
				.join("");
		}

		async function handleDossierListClick(e) {
			// Delegated click handler because dossier rows are rebuilt on each render.
			var btn = e.target.closest("button[data-act]");
			if (!btn) return;
			var host = btn.closest(".dossier");
			if (!host) return;
			var id = host.dataset.id;
			var d = findDossierById(id);
			if (!d) return;
			if (btn.dataset.act === "open") {
				applyState(d.state);
				$("dossierNom").value = d.nom;
				showMessage("Dossier « " + d.nom + " » ouvert", true);
				switchTab("croisiere");
				return;
			}
			if (btn.dataset.act === "dup") {
				var copie = { id: Date.now().toString(36), nom: d.nom + " (copie)", ts: new Date().toISOString(), state: JSON.parse(JSON.stringify(d.state)) };
				dossiers.unshift(copie);
				await persistDossiers();
				showMessage("Copie creee", true);
				renderDossiers();
				return;
			}
			if (btn.dataset.act === "del") {
				if (btn.dataset.confirme) {
					dossiers = dossiers.filter(function (x) {
						return x.id !== id;
					});
					await persistDossiers();
					showMessage("Dossier supprime", true);
					renderDossiers();
				} else {
					btn.dataset.confirme = "1";
					btn.textContent = "Confirmer?";
					setTimeout(function () {
						delete btn.dataset.confirme;
						btn.textContent = "Supprimer";
					}, 3000);
				}
			}
		}

		async function autosave() {
			var state = collectState();
			// Autosave stores only the in-progress form state, not the saved dossier list.
			var json = JSON.stringify(state);
			if (json === dernierAutosave) return;
			var ok = await cache.set(
				"autosave-forfaits",
				JSON.stringify({
					ts: new Date().toISOString(),
					nom: txt("dossierNom") || txt("pTitre") || "",
					state: state,
				}),
			);
			if (ok) {
				dernierAutosave = json;
				if (!hasFileHandle()) $("autosaveInfo").textContent = "Sauvegarde automatique (cache) : derniere copie a " + heure() + " ✓";
				else $("autosaveInfo").textContent = "Copie de secours (cache) : " + heure() + " ✓";
			} else {
				$("autosaveInfo").textContent = "Sauvegarde automatique : echec de la derniere tentative";
			}
		}

		function scheduleAutosave() {
			clearTimeout(autosaveTimer);
			// Debounce edits to limit write frequency while typing.
			// Keep 45s to preserve legacy UX and expectations.
			autosaveTimer = setTimeout(autosave, 45000);
		}

		// Safety net autosave in case no input event is fired.

		setInterval(autosave, 180000);

		async function fetchAutosave() {
			var v = await cache.get("autosave-forfaits");
			if (!v) return;
			var snap = null;
			try {
				snap = JSON.parse(v);
			} catch (e) {
				return;
			}
			if (!snap || !snap.state) return;
			var s = snap.state;
			var significatif = Object.keys(s).some(function (k) {
				if (["pax", "nuits", "nuitsHotel", "nuitsHotelPost", "taux"].includes(k)) return false;
				return s[k] !== "" && s[k] !== false;
			});
			if (significatif) autosaveSnap = snap;
		}

		return {
			showMessage: showMessage,
			getDossiers: getDossiers,
			setDossiers: setDossiers,
			findDossierById: findDossierById,
			getAutosaveSnap: getAutosaveSnap,
			loadDossiersCache: loadDossiersCache,
			saveDossier: saveDossier,
			renderDossiers: renderDossiers,
			handleDossierListClick: handleDossierListClick,
			scheduleAutosave: scheduleAutosave,
			fetchAutosave: fetchAutosave,
		};
	}

	window.DossiersModule = { init: init };
})();
