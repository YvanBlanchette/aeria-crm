(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var CL = options.CL;
		var esc = options.esc;
		var heure = options.heure;
		var txt = options.txt;
		var cache = options.cache;
		var goApp = options.goApp;
		var collectState = options.collectState;
		var applyState = options.applyState;
		var render = options.render;
		var renderDossiers = options.renderDossiers;
		var renderAccueil = options.renderAccueil;
		var getConstantes = options.getConstantes;
		var setConstantes = options.setConstantes;
		var defaultConstantes = options.defaultConstantes;
		var fillConstInputs = options.fillConstInputs;
		var getDossiers = options.getDossiers;
		var setDossiers = options.setDossiers;

		var FSA = typeof window.showOpenFilePicker === "function" && typeof window.showSaveFilePicker === "function";
		var fileHandle = null;
		var handleMemorise = null;
		var dbWriteTimer = null;
		var dbEnCours = false;
		var dbRefaire = false;
		var dernierEcrit = null;
		var dbErreur = false;
		var SQLp = null;

		function dbMsgShow(t, ok) {
			var m = $("dbMsg");
			if (!m) return;
			m.textContent = t;
			m.className = ok ? CL.msgOk : CL.msgErr;
			setTimeout(function () {
				m.textContent = "";
			}, 5000);
		}

		function getSQL() {
			if (!SQLp) {
				if (typeof initSqlJs === "undefined") return Promise.reject(new Error("sql.js non charge"));
				SQLp = initSqlJs({
					locateFile: function (f) {
						return "lib/" + f;
					},
				});
			}
			return SQLp;
		}

		async function buildDbBytes() {
			// Keep this schema aligned with parseDbBytes (versioned pair).
			var SQL = await getSQL();
			var db = new SQL.Database();
			db.run("CREATE TABLE meta(cle TEXT PRIMARY KEY, valeur TEXT);");
			db.run("CREATE TABLE constantes(cle TEXT PRIMARY KEY, valeur TEXT);");
			db.run("CREATE TABLE dossiers(id TEXT PRIMARY KEY, nom TEXT, ts TEXT, state TEXT);");
			db.run("CREATE TABLE courant(id INTEGER PRIMARY KEY, nom TEXT, ts TEXT, state TEXT);");

			var ins = function (sql, params) {
				var st = db.prepare(sql);
				st.run(params);
				st.free();
			};

			var C = getConstantes();
			ins("INSERT INTO meta VALUES(?,?)", ["version", "1"]);
			ins("INSERT INTO meta VALUES(?,?)", ["exporte", new Date().toISOString()]);
			ins("INSERT INTO meta VALUES(?,?)", ["outil", "calculateur-forfaits"]);
			Object.keys(C).forEach(function (k) {
				ins("INSERT INTO constantes VALUES(?,?)", [k, String(C[k])]);
			});

			getDossiers().forEach(function (d) {
				ins("INSERT INTO dossiers VALUES(?,?,?,?)", [d.id, d.nom, d.ts, JSON.stringify(d.state)]);
			});

			ins("INSERT INTO courant VALUES(1,?,?,?)", [txt("dossierNom") || txt("pTitre") || "", new Date().toISOString(), JSON.stringify(collectState())]);
			var data = db.export();
			db.close();
			return data;
		}

		async function parseDbBytes(buf, remplacer) {
			// remplacer=true: DB becomes source of truth. remplacer=false: merge import.
			var SQL = await getSQL();
			var db = new SQL.Database(buf);
			var resultat = { ajoutes: 0, maj: 0, courant: null, total: 0 };

			try {
				var res = db.exec("SELECT id, nom, ts, state FROM dossiers");
				var lus = [];
				if (res.length) {
					res[0].values.forEach(function (v) {
						var st;
						try {
							st = JSON.parse(v[3]);
						} catch (e) {
							return;
						}
						lus.push({ id: String(v[0]), nom: String(v[1] || "Dossier"), ts: String(v[2] || new Date().toISOString()), state: st });
					});
				}
				resultat.total = lus.length;
				if (remplacer) {
					setDossiers(lus);
				} else {
					var next = getDossiers().slice();
					lus.forEach(function (d) {
						var ex = next.find(function (x) {
							return x.id === d.id;
						});
						if (!ex) {
							next.push(d);
							resultat.ajoutes++;
						} else if (new Date(d.ts) > new Date(ex.ts)) {
							next[next.indexOf(ex)] = d;
							resultat.maj++;
						}
					});
					next.sort(function (a, b) {
						return new Date(b.ts) - new Date(a.ts);
					});
					setDossiers(next);
				}
			} catch (e) {
				// table absente
			}

			try {
				var rc = db.exec("SELECT cle, valeur FROM constantes");
				if (rc.length) {
					var C = { ...defaultConstantes, ...getConstantes() };
					rc[0].values.forEach(function (v) {
						if (v[0] in defaultConstantes) {
							var n = parseFloat(v[1]);
							if (!isNaN(n)) C[v[0]] = n;
						}
					});
					setConstantes(C);
					fillConstInputs();
					cache.set("constantes-forfaits", JSON.stringify(C));
				}
			} catch (e) {
				// table absente
			}

			try {
				var rq = db.exec("SELECT nom, state FROM courant");
				if (rq.length && rq[0].values.length) {
					resultat.courant = { nom: String(rq[0].values[0][0] || ""), state: JSON.parse(rq[0].values[0][1]) };
				}
			} catch (e) {
				// table absente
			}

			db.close();
			return resultat;
		}

		function idbOpen() {
			return new Promise(function (res, rej) {
				var r = indexedDB.open("forfaits-fs", 1);
				r.onupgradeneeded = function () {
					r.result.createObjectStore("handles");
				};
				r.onsuccess = function () {
					res(r.result);
				};
				r.onerror = function () {
					rej(r.error);
				};
			});
		}

		async function idbSet(k, v) {
			try {
				var db = await idbOpen();
				return new Promise(function (res, rej) {
					var tx = db.transaction("handles", "readwrite");
					tx.objectStore("handles").put(v, k);
					tx.oncomplete = function () {
						res(true);
					};
					tx.onerror = function () {
						rej(tx.error);
					};
				});
			} catch (e) {
				return false;
			}
		}

		async function idbGet(k) {
			try {
				var db = await idbOpen();
				return new Promise(function (res, rej) {
					var tx = db.transaction("handles", "readonly");
					var rq = tx.objectStore("handles").get(k);
					rq.onsuccess = function () {
						res(rq.result || null);
					};
					rq.onerror = function () {
						rej(rq.error);
					};
				});
			} catch (e) {
				return null;
			}
		}

		function updateDbStatus() {
			var st = $("dbStatus");
			if (!st) return;
			var pastille = function (c) {
				return '<span class="inline-block w-2 h-2 rounded-full mr-2 ' + c + '"></span>';
			};

			if (fileHandle) {
				var quand = dernierEcrit ? " - derniere ecriture a " + heure(dernierEcrit) : " - en attente d'ecriture";
				st.innerHTML =
					pastille(dbErreur ? "bg-alerte" : "bg-ok") +
					"Base connectee : <strong>" +
					esc(fileHandle.name) +
					"</strong>" +
					(dbErreur ? "<br>ERREUR D'ECRITURE - exportez une copie de vos donnees!" : quand);
			} else if (FSA && handleMemorise) {
				st.innerHTML =
					pastille("bg-laiton") +
					'Base "' +
					esc(handleMemorise.name) +
					'" memorisee mais non connectee - cliquez "Reprendre ma base". En attendant, donnees dans le cache du navigateur.';
			} else if (FSA) {
				st.innerHTML =
					pastille("bg-laiton") +
					"Aucune base connectee - donnees dans le cache du navigateur seulement. Creez ou connectez une base pour la persistance sur disque.";
			} else {
				st.innerHTML =
					pastille("bg-laiton") +
					"Mode cache - le fichier de donnees automatique necessite Chrome ou Edge avec l'outil ouvert localement (hors de Claude). En attendant : cache + exports manuels.";
			}

			var btnR = $("dbResume");
			if (btnR) btnR.classList.toggle("hidden", !(FSA && handleMemorise && !fileHandle));
		}

		async function writeDb() {
			// Serialized writer: never run two writes concurrently.
			if (!fileHandle) return;
			if (dbEnCours) {
				dbRefaire = true;
				return;
			}
			dbEnCours = true;
			try {
				var bytes = await buildDbBytes();
				var w = await fileHandle.createWritable();
				await w.write(bytes);
				await w.close();
				dernierEcrit = new Date();
				dbErreur = false;
			} catch (e) {
				dbErreur = true;
			}
			dbEnCours = false;
			updateDbStatus();
			if (dbRefaire) {
				dbRefaire = false;
				writeDb();
			}
		}

		function scheduleDbWrite(immediat) {
			// Debounced disk writes to keep UI responsive during frequent edits.
			if (!fileHandle) return;
			clearTimeout(dbWriteTimer);
			dbWriteTimer = setTimeout(writeDb, immediat ? 100 : 4000);
		}

		async function assurerPermission(handle) {
			if (!handle) return false;
			try {
				var p = await handle.queryPermission({ mode: "readwrite" });
				if (p === "granted") return true;
				p = await handle.requestPermission({ mode: "readwrite" });
				return p === "granted";
			} catch (e) {
				return false;
			}
		}

		async function connecterHandle(handle, lire) {
			fileHandle = handle;
			handleMemorise = handle;
			await idbSet("base", handle);

			if (lire) {
				try {
					var f = await handle.getFile();
					if (f.size > 0) {
						var buf = new Uint8Array(await f.arrayBuffer());
						var r = await parseDbBytes(buf, true);
						await cache.set("dossiers-forfaits", JSON.stringify(getDossiers()));
						renderDossiers();
						if (r.courant && r.courant.state) {
							applyState(r.courant.state);
							if (r.courant.nom) $("dossierNom").value = r.courant.nom;
						}
					}
				} catch (e) {
					dbMsgShow("Base connectee mais illisible - elle sera reecrite a la prochaine sauvegarde", false);
				}
			}

			updateDbStatus();
			writeDb();
		}

		async function creerBase() {
			if (!FSA) {
				dbMsgShow("Necessite Chrome ou Edge avec l'outil ouvert hors de Claude", false);
				return;
			}
			try {
				var handle = await window.showSaveFilePicker({
					suggestedName: "forfaits.sqlite",
					types: [{ description: "Base SQLite", accept: { "application/x-sqlite3": [".sqlite"] } }],
				});
				await connecterHandle(handle, false);
				dbMsgShow('Base "' + handle.name + '" creee et connectee', true);
				goApp("croisiere");
			} catch (e) {
				if (e && e.name === "AbortError") return;
				dbMsgShow("Creation impossible ici - ouvrez le fichier HTML localement dans Chrome/Edge", false);
			}
		}

		async function ouvrirBase() {
			if (!FSA) {
				dbMsgShow("Necessite Chrome ou Edge avec l'outil ouvert hors de Claude", false);
				return;
			}
			try {
				var handles = await window.showOpenFilePicker({
					types: [{ description: "Base SQLite", accept: { "application/x-sqlite3": [".sqlite", ".db", ".sqlite3"] } }],
				});
				var handle = handles[0];
				if (!(await assurerPermission(handle))) {
					dbMsgShow("Permission refusee", false);
					return;
				}
				await connecterHandle(handle, true);
				dbMsgShow('Base "' + handle.name + '" connectee', true);
				goApp("croisiere");
			} catch (e) {
				if (e && e.name === "AbortError") return;
				dbMsgShow("Ouverture impossible ici - ouvrez le fichier HTML localement dans Chrome/Edge", false);
			}
		}

		async function detectSavedHandle() {
			if (!FSA) return;
			handleMemorise = await idbGet("base");
		}

		async function reprendreBase() {
			if (!handleMemorise) return;
			if (!(await assurerPermission(handleMemorise))) {
				dbMsgShow("Permission refusee pour " + handleMemorise.name, false);
				return;
			}
			await connecterHandle(handleMemorise, true);
			goApp("croisiere");
		}

		async function exportSqlite() {
			try {
				var data = await buildDbBytes();
				var blob = new Blob([data], { type: "application/x-sqlite3" });
				var a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = "forfaits-" + new Date().toISOString().slice(0, 10) + ".sqlite";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				setTimeout(function () {
					URL.revokeObjectURL(a.href);
				}, 2000);
				dbMsgShow("Base SQLite exportee (" + getDossiers().length + " dossier" + (getDossiers().length > 1 ? "s" : "") + " + travail en cours)", true);
			} catch (e) {
				dbMsgShow("Export SQLite impossible - verifiez que le dossier lib/ accompagne le fichier HTML", false);
			}
		}

		async function importSqliteFichier(file) {
			try {
				var buf = new Uint8Array(await file.arrayBuffer());
				var r = await parseDbBytes(buf, false);
				if (!r.total && !r.courant) {
					dbMsgShow("Aucune donnee reconnue dans cette base - est-ce un export de cet outil?", false);
					return;
				}
				await cache.set("dossiers-forfaits", JSON.stringify(getDossiers()));
				renderDossiers();
				renderAccueil();
				if (r.courant && r.courant.state) {
					applyState(r.courant.state);
					if (r.courant.nom) $("dossierNom").value = r.courant.nom;
				} else {
					render();
				}
				scheduleDbWrite(true);
				dbMsgShow("Base importee : " + r.ajoutes + " dossier(s) ajoute(s), " + r.maj + " mis a jour", true);
				goApp("croisiere");
			} catch (e) {
				dbMsgShow("Impossible de lire cette base SQLite", false);
			}
		}

		function onBeforeUnload() {
			if (fileHandle && dbWriteTimer) writeDb();
		}

		function getContext() {
			return {
				FSA: FSA,
				fileHandle: fileHandle,
				handleMemorise: handleMemorise,
			};
		}

		return {
			hasFileHandle: function () {
				return !!fileHandle;
			},
			getContext: getContext,
			scheduleDbWrite: scheduleDbWrite,
			updateDbStatus: updateDbStatus,
			detectSavedHandle: detectSavedHandle,
			creerBase: creerBase,
			ouvrirBase: ouvrirBase,
			reprendreBase: reprendreBase,
			exportSqlite: exportSqlite,
			importSqliteFichier: importSqliteFichier,
			onBeforeUnload: onBeforeUnload,
		};
	}

	window.StorageModule = { init: init };
})();
