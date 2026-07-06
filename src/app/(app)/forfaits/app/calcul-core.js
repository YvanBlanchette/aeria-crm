(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var num = options.num;
		var getConstantes = options.getConstantes;

		var CABINES = [
			{ id: "cabInt", nom: "Interieure", code: "INT" },
			{ id: "cabExt", nom: "Exterieure", code: "EXT" },
			{ id: "cabBal", nom: "Balcon", code: "BAL" },
			{ id: "cabSui", nom: "Suite", code: "SUI" },
		];

		function modeOf(id) {
			return $(id + "Mode") ? $(id + "Mode").value : "pers";
		}

		function modeTxt(id) {
			return modeOf(id) === "tot" ? "total" : "par personne";
		}

		function computeBase() {
			var C = getConstantes();
			var pax = Math.max(1, num("pax"));
			var perVal = function (id) {
				return modeOf(id) === "tot" ? num(id) / pax : num(id);
			};

			var nuits = num("nuits");
			var hasPre = $("hasPre").checked;
			var hasPost = $("hasPost").checked;
			var hasTransferts = $("hasTransferts").checked;
			var nuitsHotel = hasPre ? num("nuitsHotel") : 0;
			var inclus = $("pourboiresInclus").checked;

			var vols = perVal("vols");
			var bagAller = perVal("bagAller");
			var bagRetour = perVal("bagRetour");
			var bagages = bagAller + bagRetour;

			var hotelNuit = hasPre ? num("hotel") : 0;
			var hotelChambre = hotelNuit * nuitsHotel;

			var nuitsHotelPost = hasPost ? num("nuitsHotelPost") : 0;
			var hotelNuitPost = hasPost ? num("hotelPost") : 0;
			var hotelChambrePost = hotelNuitPost * nuitsHotelPost;
			var hotelTotal = hotelChambre + hotelChambrePost;
			var hotelPers = hotelTotal / pax;

			var trA = hasTransferts ? perVal("trA") : 0;
			var trB = hasTransferts ? perVal("trB") : 0;
			var trC = hasTransferts ? perVal("trC") : 0;
			var trD = hasTransferts && hasPost ? perVal("trD") : 0;
			var trE = hasTransferts && hasPost ? perVal("trE") : 0;
			var transferts = trA + trB + trC + trD + trE;
			var nbTransferts = hasTransferts ? (hasPost ? 5 : 3) : 0;

			var manuelRaw = $("pourboiresManuel").value;
			var manuel = manuelRaw !== "" && !isNaN(parseFloat(manuelRaw)) ? parseFloat(manuelRaw) : null;
			var pourboires = 0;
			var pourboiresMode = "inclus";
			if (inclus) {
				pourboires = 0;
				pourboiresMode = "inclus";
			} else if (manuel !== null) {
				pourboires = manuel;
				pourboiresMode = "manuel";
			} else {
				pourboires = C.pourboiresNuit * nuits;
				pourboiresMode = "auto";
			}

			var totalNuits = nuits + nuitsHotel + nuitsHotelPost;
			var usd = $("usdCab").checked;
			var taux = usd ? Math.max(0, num("taux")) : 1;

			var fraisVises = (vols * C.pctVols) / 100;
			var markupMax = (hotelPers * C.pctMarkup) / 100;
			var markup = Math.min(fraisVises, markupMax);
			var perte = Math.max(0, fraisVises - markup);
			var markupTotal = markup * pax;
			var partPre = hotelTotal > 0 ? hotelChambre / hotelTotal : 1;
			var hotelClientChambre = hotelChambre + markupTotal * partPre;
			var hotelClientChambrePost = hotelChambrePost + markupTotal * (1 - partPre);

			return {
				pax: pax,
				nuits: nuits,
				hasPre: hasPre,
				nuitsHotel: nuitsHotel,
				totalNuits: totalNuits,
				inclus: inclus,
				vols: vols,
				bagAller: bagAller,
				bagRetour: bagRetour,
				bagages: bagages,
				hotelNuit: hotelNuit,
				hotelChambre: hotelChambre,
				hotelPers: hotelPers,
				trA: trA,
				trB: trB,
				trC: trC,
				trD: trD,
				trE: trE,
				transferts: transferts,
				nbTransferts: nbTransferts,
				hasTransferts: hasTransferts,
				hasPost: hasPost,
				nuitsHotelPost: nuitsHotelPost,
				hotelNuitPost: hotelNuitPost,
				hotelChambrePost: hotelChambrePost,
				hotelTotal: hotelTotal,
				pourboires: pourboires,
				pourboiresMode: pourboiresMode,
				usd: usd,
				taux: taux,
				fraisVises: fraisVises,
				markupMax: markupMax,
				markup: markup,
				perte: perte,
				hotelClientChambre: hotelClientChambre,
				hotelClientChambrePost: hotelClientChambrePost,
			};
		}

		function cabinCalc(b, cabineFacture) {
			var C = getConstantes();
			var cabinePers = cabineFacture / b.pax;
			var brut = cabinePers + b.vols + b.bagages + b.hotelPers + b.transferts + b.pourboires + C.admin + b.markup;
			var step = C.arrondi || 0;
			var prixPers = step > 0 ? Math.ceil(brut / step) * step : brut;
			var coussin = prixPers - brut;
			var total = prixPers * b.pax;
			var prixPersNuit = b.totalNuits > 0 ? prixPers / b.totalNuits : 0;
			return { cabinePers: cabinePers, brut: brut, prixPers: prixPers, coussin: coussin, total: total, prixPersNuit: prixPersNuit };
		}

		function activeCabins(b) {
			return CABINES.filter(function (cab) {
				var raw = $(cab.id).value;
				return raw !== "" && !isNaN(parseFloat(raw));
			}).map(function (cab) {
				var brut = parseFloat($(cab.id).value);
				return {
					id: cab.id,
					nom: cab.nom,
					code: cab.code,
					factureBrute: brut,
					facture: brut * (b.usd ? b.taux : 1),
				};
			});
		}

		return {
			CABINES: CABINES,
			modeOf: modeOf,
			modeTxt: modeTxt,
			computeBase: computeBase,
			cabinCalc: cabinCalc,
			activeCabins: activeCabins,
		};
	}

	window.CalculCoreModule = { init: init };
})();
