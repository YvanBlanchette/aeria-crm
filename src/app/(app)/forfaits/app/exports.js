(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var txt = options.txt;
		var num = options.num;
		var modeOf = options.modeOf;
		var modeTxt = options.modeTxt;
		var computeBase = options.computeBase;
		var activeCabins = options.activeCabins;
		var cabinCalc = options.cabinCalc;
		var dateHeure = options.dateHeure;
		var plage = options.plage;
		var pdfFmt = options.pdfFmt;
		var ensureXlsx = options.ensureXlsx;
		var ensureJsPdf = options.ensureJsPdf;
		var excelMsgShow = options.excelMsgShow;
		var dossMsgShow = options.dossMsgShow;
		var collectState = options.collectState;
		var applyState = options.applyState;
		var scheduleDbWrite = options.scheduleDbWrite;
		var goApp = options.goApp;
		var getConstantes = options.getConstantes;

		function genExcel() {
			return ensureXlsx()
				.then(function () {
					var C = getConstantes();
					var b = computeBase();
					var cabs = activeCabins(b);
					var cabNums = { INT: txt("pCabInt"), EXT: txt("pCabExt"), BAL: txt("pCabBal"), SUI: txt("pCabSui") };
					var titre = txt("pTitre") || "Sommaire de forfait";
					var horodatage = dateHeure(new Date());
					var depotBase = num("pDepot");
					var depotParPers = depotBase + b.vols + b.hotelPers + C.admin;

					var rows = [];
					var R = function () {
						rows.push(Array.prototype.slice.call(arguments));
					};

					R(titre.toUpperCase());
					R("Genere le", horodatage, "Les prix evoluent rapidement - sommaire valide au moment de la generation");
					R();

					R("PROJET");
					R("Compagnie de croisiere", txt("pCompagnie"));
					R("Navire", txt("pNavire"));
					R("Port de depart", txt("pPortDep"));
					R("Port d'arrivee", txt("pPortArr"));
					R("Croisiere - dates", plage("pCroisiereDebut", "pCroisiereFin"));
					if (b.hasPre) R("Hotel pre-croisiere", txt("pHotel"), plage("pHotelDebut", "pHotelFin"));
					if (b.hasPost) R("Hotel post-croisiere", txt("pHotelPost"), plage("pHotelPostDebut", "pHotelPostFin"));
					R("Details des vols", txt("pVols"));
					R();

					R("VOYAGE");
					R("Passagers", b.pax);
					R("Nuits a bord", b.nuits);
					if (b.hasPre) R("Nuits a l'hotel - pre-croisiere", b.nuitsHotel);
					if (b.hasPost) R("Nuits a l'hotel - post-croisiere", b.nuitsHotelPost);
					R("Nuits au total", b.totalNuits);
					R(
						"Pourboires",
						b.pourboiresMode === "inclus"
							? "Inclus dans le forfait"
							: b.pourboiresMode === "manuel"
								? "Prepayes - montant manuel : " + b.pourboires.toFixed(2) + " $/pers"
								: "Prepayes - " + C.pourboiresNuit + " $ x " + b.nuits + " nuits = " + b.pourboires.toFixed(2) + " $/pers",
					);
					if (b.usd) R("Taux de change applique (croisiere)", b.taux, "USD -> CAD");
					if (C.arrondi > 0) R("Arrondi du prix par personne", "Au " + C.arrondi + " $ superieur");
					if (depotParPers > 0 || txt("pDepotDate") || txt("pSoldeDate")) {
						R(
							"Depot requis",
							depotParPers,
							depotParPers > 0
								? "Croisiere " +
										depotBase.toFixed(2) +
										" + vols " +
										b.vols.toFixed(2) +
										" + hotels " +
										b.hotelPers.toFixed(2) +
										" + admin " +
										C.admin.toFixed(2) +
										" = " +
										depotParPers.toFixed(2) +
										" $/pers x " +
										b.pax +
										" pax = " +
										(depotParPers * b.pax).toFixed(2) +
										" $"
								: "",
						);
						if (txt("pDepotDate")) R("Date limite - depot", txt("pDepotDate"));
						if (txt("pSoldeDate")) R("Date limite - solde", txt("pSoldeDate"));
					}
					R();

					R("COUTS COMMUNS", "Montant saisi", "Detail");
					R("Vols (" + modeTxt("vols") + ")", num("vols"), modeOf("vols") === "tot" ? "Total / " + b.pax + " pax = " + b.vols.toFixed(2) + " $/pers" : "");
					R(
						"Bagages - aller (" + modeTxt("bagAller") + ")",
						num("bagAller"),
						modeOf("bagAller") === "tot" ? "/ " + b.pax + " pax = " + b.bagAller.toFixed(2) + " $/pers" : "",
					);
					R(
						"Bagages - retour (" + modeTxt("bagRetour") + ")",
						num("bagRetour"),
						modeOf("bagRetour") === "tot" ? "/ " + b.pax + " pax = " + b.bagRetour.toFixed(2) + " $/pers" : "",
					);
					if (b.hasPre) {
						R(
							"Hotel pre - chambre par nuit (coutant)",
							b.hotelNuit,
							b.hotelNuit.toFixed(2) + " x " + b.nuitsHotel + " nuits / " + b.pax + " pax = " + (b.hotelChambre / b.pax).toFixed(2) + " $/pers",
						);
					}
					if (b.hasPost) {
						R(
							"Hotel post - chambre par nuit (coutant)",
							b.hotelNuitPost,
							b.hotelNuitPost.toFixed(2) + " x " + b.nuitsHotelPost + " nuits / " + b.pax + " pax = " + (b.hotelChambrePost / b.pax).toFixed(2) + " $/pers",
						);
					}
					if (b.hasTransferts) {
						var trDetail = function (id, comp) {
							return [comp, modeOf(id) === "tot" ? "Total / " + b.pax + " pax" : "Par personne"].filter(Boolean).join(" - ");
						};
						R("Transfert Aeroport -> Hotel (" + modeTxt("trA") + ")", num("trA"), trDetail("trA", txt("pTrA")));
						R("Transfert Hotel -> Port (" + modeTxt("trB") + ")", num("trB"), trDetail("trB", txt("pTrB")));
						R("Transfert Port -> Aeroport (" + modeTxt("trC") + ")", num("trC"), trDetail("trC", txt("pTrC")));
						if (b.hasPost) {
							R("Transfert Port -> Hotel post (" + modeTxt("trD") + ")", num("trD"), trDetail("trD", ""));
							R("Transfert Hotel post -> Aeroport (" + modeTxt("trE") + ")", num("trE"), trDetail("trE", ""));
						}
					}
					R();

					R("FRAIS & MARKUP (par personne)");
					R("Frais administratifs", C.admin);
					R("Frais de service vols vises (" + C.pctVols + " %)", b.fraisVises);
					R("Markup hotel maximal (" + C.pctMarkup + " %)", b.markupMax, b.hasPost ? "Calcule sur les 2 hotels combines" : "");
					R("Markup hotel applique", b.markup);
					R("Perte absorbee", b.perte, b.perte > 0 ? "Frais vises > markup possible" : "");
					R(
						"Prix hotel pre a afficher dans TAAP (par chambre)",
						b.hotelClientChambre,
						b.hasPost ? "Coutant + part du markup" : "Coutant + markup total du groupe",
					);
					if (b.hasPost) R("Prix hotel post a afficher dans TAAP (par chambre)", b.hotelClientChambrePost, "Coutant + part du markup");
					R();

					R("PRIX PAR CATEGORIE");
					if (cabs.length) {
						R(
							"Categorie",
							"Cabine exemple",
							"Facture croisiere (CAD)",
							"Croisiere / pers",
							"Prix / pers",
							"Prix / pers / nuit",
							"Total - " + b.pax + " pax",
							"Depot total",
							"Solde",
						);
						cabs.forEach(function (cab) {
							var r = cabinCalc(b, cab.facture);
							var depTotal = depotParPers * b.pax;
							R(
								cab.nom,
								cabNums[cab.code] || "",
								cab.facture,
								r.cabinePers,
								r.prixPers,
								r.prixPersNuit,
								r.total,
								depotParPers > 0 ? depTotal : "",
								depotParPers > 0 ? r.total - depTotal : "",
							);
						});
					} else {
						R("Aucune categorie de cabine remplie dans le calculateur");
					}
					R();

					var notes = txt("pNotes");
					if (notes) {
						R("NOTES INTERNES");
						R(notes);
						R();
					}

					R("CONSTANTES UTILISEES");
					R("Frais administratifs (par passager)", C.admin);
					R("Frais de service sur les vols (%)", C.pctVols);
					R("Markup maximum hotel (%)", C.pctMarkup);
					R("Pourboires prepayes (par nuit, par personne)", C.pourboiresNuit);
					R("Arrondi du prix par personne", C.arrondi > 0 ? "Au " + C.arrondi + " $ superieur" : "Aucun");

					var ws = XLSX.utils.aoa_to_sheet(rows);
					ws["!cols"] = [{ wch: 44 }, { wch: 20 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
					var wb = XLSX.utils.book_new();
					XLSX.utils.book_append_sheet(wb, ws, "Sommaire");
					var nomFichier =
						titre
							.replace(/[\\/:*?"<>|]/g, "")
							.replace(/\s+/g, "-")
							.toLowerCase()
							.slice(0, 60) || "sommaire-forfait";
					XLSX.writeFile(wb, nomFichier + ".xlsx");
					excelMsgShow("Sommaire Excel telecharge", true);
				})
				.catch(function () {
					excelMsgShow("Erreur lors de la generation du fichier", false);
				});
		}

		function genPDF() {
			var pdfWindow = window.open("", "_blank");
			if (pdfWindow) {
				pdfWindow.document.write("<p style='font-family:sans-serif;padding:16px'>Generation du PDF en cours...</p>");
			}
			return ensureJsPdf()
				.then(function () {
					var C = getConstantes();
					var b = computeBase();
					var cabs = activeCabins(b);
					if (!cabs.length) {
						excelMsgShow("Entrez au moins une categorie de cabine avant de generer la soumission", false);
						if (pdfWindow) {
							pdfWindow.document.body.innerHTML = "<p style='font-family:sans-serif;padding:16px'>Veuillez entrer au moins une categorie de cabine.</p>";
						}
						return;
					}
					var cabSelection = {
						INT: !$("pdfCabInt") || $("pdfCabInt").checked,
						EXT: !$("pdfCabExt") || $("pdfCabExt").checked,
						BAL: !$("pdfCabBal") || $("pdfCabBal").checked,
						SUI: !$("pdfCabSui") || $("pdfCabSui").checked,
					};
					var cabsPdf = cabs.filter(function (cab) {
						return !!cabSelection[cab.code];
					});
					if (!cabsPdf.length) {
						excelMsgShow("Cochez au moins un type de cabine a afficher dans la soumission PDF", false);
						if (pdfWindow) {
							pdfWindow.document.body.innerHTML =
								"<p style='font-family:sans-serif;padding:16px'>Veuillez cocher au moins un type de cabine a afficher dans la soumission PDF.</p>";
						}
						return;
					}

					var doc = new window.jspdf.jsPDF({ unit: "mm", format: "letter" });
					var W = 216;
					var MARGE = 18;
					var LARGE = W - MARGE * 2;
					var y = 0;
					var marine = [13, 43, 69],
						lagon = [14, 124, 134],
						sourdine = [91, 113, 131],
						encre = [28, 43, 54],
						ligne = [193, 154, 71];
					var checkY = function (besoin) {
						if (y + besoin > 262) {
							doc.addPage();
							y = 20;
						}
					};
					var section = function (t) {
						checkY(16);
						y += 9;
						doc.setFont("helvetica", "bold");
						doc.setFontSize(10.5);
						doc.setTextColor.apply(doc, marine);
						doc.text(t.toUpperCase(), MARGE, y);
						doc.setDrawColor.apply(doc, ligne);
						doc.setLineWidth(0.3);
						doc.line(MARGE, y + 2, W - MARGE, y + 2);
						y += 8;
					};
					var infoLine = function (lbl, val) {
						if (!val) return;
						checkY(7);
						doc.setFont("helvetica", "normal");
						doc.setFontSize(9.5);
						doc.setTextColor.apply(doc, sourdine);
						doc.text(lbl, MARGE, y);
						doc.setTextColor.apply(doc, encre);
						var lignesTxt = doc.splitTextToSize(String(val), LARGE - 62);
						doc.text(lignesTxt, MARGE + 60, y);
						y += 5.5 * lignesTxt.length;
					};

					var headerH = 30;
					doc.setFillColor.apply(doc, marine);
					doc.rect(0, 0, W, headerH, "F");
					doc.setFont("helvetica", "bold");
					doc.setFontSize(13);
					doc.setTextColor(255, 255, 255);
					var logoReserve = window.AeriaLogoDataUrl ? 74 : 0;
					var titreLigne = doc.splitTextToSize(txt("pTitre") || "Votre projet de voyage", Math.max(40, LARGE - logoReserve))[0];
					doc.text(titreLigne, MARGE, 14.6);
					var dateMois = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
					var datePdf = new Date();
					var dateTexte = String(datePdf.getDate()).padStart(2, "0") + " " + dateMois[datePdf.getMonth()] + " " + datePdf.getFullYear();
					doc.setFont("helvetica", "normal");
					doc.setFontSize(9);
					doc.text(dateTexte, MARGE, 20.2);

					if (window.AeriaLogoDataUrl) {
						try {
							var logoW = 67;
							var logoH = 16;
							if (doc.getImageProperties) {
								var logoProps = doc.getImageProperties(window.AeriaLogoDataUrl);
								if (logoProps && logoProps.width && logoProps.height) {
									logoH = (logoProps.height * logoW) / logoProps.width;
								}
							}
							doc.addImage(window.AeriaLogoDataUrl, "PNG", W - MARGE - logoW, 10.5, logoW, logoH);
						} catch (e) {
							if (typeof console !== "undefined" && console.warn) console.warn("Logo PDF non charge", e);
						}
					}

					y = headerH;

					section("Votre croisiere");
					infoLine("Compagnie", txt("pCompagnie"));
					infoLine("Navire", txt("pNavire"));
					infoLine("Dates", plage("pCroisiereDebut", "pCroisiereFin"));
					infoLine("Depart / arrivee", [txt("pPortDep"), txt("pPortArr")].filter(Boolean).join(" -> "));
					infoLine("Nuits a bord", String(b.nuits));

					var hebPre = b.hasPre ? [txt("pHotel"), plage("pHotelDebut", "pHotelFin")].filter(Boolean).join(" - ") : "";
					var hebPost = [txt("pHotelPost"), plage("pHotelPostDebut", "pHotelPostFin")].filter(Boolean).join(" - ");
					if (hebPre || hebPost || b.nuitsHotel > 0) {
						section("Hebergement");
						if (b.hasPre) infoLine("Avant la croisiere", hebPre || b.nuitsHotel + " nuit" + (b.nuitsHotel > 1 ? "s" : "") + " d'hotel");
						if (b.hasPost) infoLine("Apres la croisiere", hebPost || b.nuitsHotelPost + " nuit" + (b.nuitsHotelPost > 1 ? "s" : "") + " d'hotel");
					}

					if (txt("pVols")) {
						section("Vols");
						infoLine("Itineraire", txt("pVols"));
					}

					section("Ce forfait comprend");
					var inclusionDefs = [
						{ id: "incCroisiereBoissons", detailId: "incCroisiereBoissonsDetails", label: "Forfait Boissons" },
						{ id: "incCroisiereWifi", detailId: "incCroisiereWifiDetails", label: "Forfait Wifi" },
						{ id: "incCroisiereRestos", detailId: "incCroisiereRestosDetails", label: "Restaurants de Specialite" },
						{ id: "incCroisiereCreditBord", detailId: "incCroisiereCreditBordDetails", label: "Credit a bord" },
						{ id: "incCroisiereCreditExcursions", detailId: "incCroisiereCreditExcursionsDetails", label: "Credits excursions" },
						{ id: "incCroisierePourboires", detailId: "incCroisierePourboiresDetails", label: "Pourboires prepayes" },
						{ id: "incCroisiereFraisAdminCredites", detailId: "incCroisiereFraisAdminCreditesDetails", label: "Frais administratifs credites" },
						{ id: "incHotelDejeuner", detailId: "incHotelDejeunerDetails", label: "Dejeuner inclus" },
						{ id: "incHotelToutInclus", detailId: "incHotelToutInclusDetails", label: "Formule tout-inclus" },
						{ id: "incHotelNavette", detailId: "incHotelNavetteDetails", label: "Navette aeroportuaire" },
						{ id: "incHotelBalcon", detailId: "incHotelBalconDetails", label: "Chambre avec balcon" },
						{ id: "incHotelVue", detailId: "incHotelVueDetails", label: "Chambre avec vue" },
						{ id: "incVolsBagages", detailId: "incVolsBagagesDetails", label: "Bagages enregistres" },
						{ id: "incVolsSieges", detailId: "incVolsSiegesDetails", label: "Choix de sieges" },
						{ id: "incTransfAeroHotel", label: "Transfert Aeroport -> Hotel" },
						{ id: "incTransfHotelPort", label: "Transfert Hotel -> Port" },
						{ id: "incTransfPortAero", label: "Transfert Port -> Aeroport" },
						{ id: "incTransfPortHotelPost", label: "Transfert Port -> Hotel", postOnly: true },
						{ id: "incTransfHotelPostAero", label: "Transfert Hotel -> Aeroport", postOnly: true },
					];
					var inclusions = inclusionDefs
						.filter(function (def) {
							if (def.postOnly && !b.hasPost) return false;
							var chk = $(def.id);
							return chk && chk.checked;
						})
						.map(function (def) {
							var detail = txt(def.detailId);
							return detail ? def.label + " (" + detail + ")" : def.label;
						});
					if (!inclusions.length) inclusions.push("Aucune inclusion supplementaire selectionnee");
					doc.setFont("helvetica", "normal");
					doc.setFontSize(9.5);
					doc.setTextColor.apply(doc, encre);
					inclusions.forEach(function (inc) {
						checkY(6);
						doc.setTextColor.apply(doc, lagon);
						doc.text("•", MARGE, y);
						doc.setTextColor.apply(doc, encre);
						var incLines = doc.splitTextToSize(inc, LARGE - 8);
						doc.text(incLines, MARGE + 5, y);
						y += 5.5 * incLines.length;
					});

					section("Prix par personne - occupation double" + (b.pax !== 2 ? " (" + b.pax + " passagers)" : ""));
					cabsPdf.forEach(function (cab) {
						var r = cabinCalc(b, cab.facture);
						checkY(24);
						doc.setFont("helvetica", "bold");
						doc.setFontSize(11);
						doc.setTextColor.apply(doc, marine);
						doc.text("Cabine " + cab.nom.toLowerCase(), MARGE + 5, y + 2.5);
						doc.setFont("helvetica", "normal");
						doc.setFontSize(8.5);
						doc.setTextColor.apply(doc, sourdine);
						doc.text("Soit " + pdfFmt(r.prixPersNuit) + " par personne par nuit (" + b.totalNuits + " nuits)", MARGE + 5, y + 9);
						doc.setFont("helvetica", "bold");
						doc.setFontSize(14);
						doc.setTextColor(0, 0, 0);
						doc.text(pdfFmt(r.prixPers), W - MARGE - 5, y + 5, { align: "right" });
						y += 22;
					});

					var depotBase = num("pDepot");
					var depotParPers = depotBase + b.vols + b.hotelPers + C.admin;
					if (depotParPers > 0 || txt("pDepotDate") || txt("pSoldeDate")) {
						section("Modalites de paiement");
						if (depotParPers > 0)
							infoLine("Depot requis", pdfFmt(depotParPers) + " par personne" + (txt("pDepotDate") ? " - d'ici le " + txt("pDepotDate") : ""));
						else if (txt("pDepotDate")) infoLine("Depot", "D'ici le " + txt("pDepotDate"));
						if (txt("pSoldeDate")) infoLine("Solde", "Paiement complet d'ici le " + txt("pSoldeDate"));
						infoLine("Important", "Les depots sont toujours non-remboursables sauf si specifiquement mentionnes");
					}

					checkY(14);
					y += 6;
					doc.setDrawColor.apply(doc, ligne);
					doc.line(MARGE, y, W - MARGE, y);
					y += 6;
					doc.setFont("helvetica", "normal");
					doc.setFontSize(8);
					doc.setTextColor.apply(doc, sourdine);
					doc.text("Les prix sont en dollars canadiens, par personne, et valides au moment de la preparation de cette soumission.", MARGE, y);
					y += 4.5;
					doc.text("La disponibilite des cabines, des vols et des hotels n'est pas garantie tant que le dossier n'est pas confirme.", MARGE, y);

					var pdfBlob = doc.output("blob");
					var blobUrl = (window.URL || window.webkitURL).createObjectURL(pdfBlob);
					if (pdfWindow) {
						pdfWindow.location.replace(blobUrl);
						pdfWindow.focus();
						excelMsgShow("Soumission client PDF ouverte dans un nouvel onglet", true);
					} else {
						window.open(blobUrl, "_blank");
						excelMsgShow("Soumission client PDF prete - autorisez l'ouverture de nouvel onglet", true);
					}
					setTimeout(function () {
						try {
							(window.URL || window.webkitURL).revokeObjectURL(blobUrl);
						} catch (e) {}
					}, 120000);
				})
				.catch(function (err) {
					if (pdfWindow) {
						var detail = err && err.message ? err.message : String(err || "Erreur inconnue");
						pdfWindow.document.body.innerHTML =
							"<p style='font-family:sans-serif;padding:16px'>Erreur lors de la generation du PDF.</p>" +
							"<pre style='font-family:monospace;white-space:pre-wrap;padding:0 16px 16px;'>" +
							detail.replace(/[&<>]/g, function (c) {
								return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
							}) +
							"</pre>";
					}
					if (typeof console !== "undefined" && console.error) console.error(err);
					excelMsgShow("Erreur lors de la generation du PDF", false);
				});
		}

		function csvEsc(v) {
			var s = String(v);
			return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
		}

		function exportCsv() {
			var state = collectState();
			var lignes = [
				"champ,valeur",
				csvEsc("__meta_version") + "," + csvEsc("1"),
				csvEsc("__meta_exporte") + "," + csvEsc(new Date().toISOString()),
				csvEsc("__meta_nom") + "," + csvEsc(txt("dossierNom") || txt("pTitre") || ""),
			];
			Object.keys(state).forEach(function (k) {
				lignes.push(csvEsc(k) + "," + csvEsc(state[k]));
			});
			var contenu = "\ufeff" + lignes.join("\r\n");
			var blob = new Blob([contenu], { type: "text/csv;charset=utf-8" });
			var a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			var nom = (txt("dossierNom") || txt("pTitre") || "dossier-forfait")
				.replace(/[\\/:*?"<>|]/g, "")
				.replace(/\s+/g, "-")
				.toLowerCase()
				.slice(0, 60);
			a.download = nom + ".csv";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(function () {
				URL.revokeObjectURL(a.href);
			}, 2000);
			dossMsgShow("Dossier exporte en CSV", true);
		}

		function parseCsv(texte) {
			var rows = [];
			var champ = "";
			var row = [];
			var dansGuillemets = false;
			var t = texte.replace(/^\ufeff/, "");
			for (var i = 0; i < t.length; i++) {
				var c = t[i];
				if (dansGuillemets) {
					if (c === '"') {
						if (t[i + 1] === '"') {
							champ += '"';
							i++;
						} else dansGuillemets = false;
					} else champ += c;
				} else {
					if (c === '"') dansGuillemets = true;
					else if (c === ",") {
						row.push(champ);
						champ = "";
					} else if (c === "\n" || c === "\r") {
						if (c === "\r" && t[i + 1] === "\n") i++;
						row.push(champ);
						champ = "";
						if (row.length > 1 || row[0] !== "") rows.push(row);
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

		function importCsvFichier(file) {
			var lecteur = new FileReader();
			lecteur.onload = function () {
				try {
					var rows = parseCsv(lecteur.result);
					var state = {};
					var nom = "";
					var valides = 0;
					rows.forEach(function (r) {
						if (r.length < 2) return;
						var k = r[0];
						var v = r.slice(1).join(",");
						if (k === "champ") return;
						if (k === "__meta_nom") {
							nom = v;
							return;
						}
						if (k.indexOf("__meta_") === 0) return;
						var el = $(k);
						if (!el) return;
						state[k] = el.type === "checkbox" ? v === "true" : v;
						valides++;
					});
					if (!valides) {
						dossMsgShow("Aucun champ reconnu dans ce CSV", false);
						return;
					}
					applyState(state);
					if (nom) $("dossierNom").value = nom;
					dossMsgShow("Dossier importe (" + valides + " champs)", true);
					scheduleDbWrite();
					goApp("croisiere");
				} catch (e) {
					dossMsgShow("Impossible de lire ce fichier CSV", false);
				}
			};
			lecteur.onerror = function () {
				dossMsgShow("Impossible de lire ce fichier", false);
			};
			lecteur.readAsText(file, "utf-8");
		}

		return {
			genExcel: genExcel,
			genPDF: genPDF,
			exportCsv: exportCsv,
			importCsvFichier: importCsvFichier,
		};
	}

	window.ExportsModule = { init: init };
})();
