(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var num = options.num;
		var computeBase = options.computeBase;
		var activeCabins = options.activeCabins;
		var switchTab = options.switchTab;
		var showProjectReady = options.showProjectReady;
		var msgOkClass = options.msgOkClass;
		var msgErrClass = options.msgErrClass;

		var guideHints = {
			1: "Commencez par le cadre du voyage: passagers, nuits et parametres de base.",
			2: "Entrez les prix de cabine pour les categories offertes.",
			3: "Ajoutez vols, sejours et transferts selon le dossier client.",
			4: "Validez le prix final par categorie, puis exportez Excel/PDF.",
		};

		function setStep(step) {
			document.querySelectorAll(".calc-step").forEach(function (btn) {
				var on = btn.dataset.step === String(step);
				btn.className =
					"calc-step appearance-none cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-full border " +
					(on ? "border-lagon bg-lagon text-white" : "border-ligne bg-white text-marine");
			});
			$("calcGuideHint").textContent = guideHints[step] || "";
		}

		function gotoStep(step, scroll) {
			setStep(step);
			if (scroll === false) return;
			var btn = document.querySelector('.calc-step[data-step="' + step + '"]');
			if (!btn) return;
			var target = $(btn.dataset.target);
			if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
		}

		function stepScore(done, total) {
			return { done: done, total: total };
		}

		function getProgress(b, cabs) {
			var volsRenseigne = $("vols").value !== "";
			var tauxOk = !b.usd || num("taux") > 0;
			var s3Total = 1;
			var s3Done = volsRenseigne ? 1 : 0;

			if (b.hasPre) {
				s3Total += 2;
				s3Done += num("nuitsHotel") > 0 ? 1 : 0;
				s3Done += $("hotel").value !== "" ? 1 : 0;
			}
			if (b.hasPost) {
				s3Total += 2;
				s3Done += num("nuitsHotelPost") > 0 ? 1 : 0;
				s3Done += $("hotelPost").value !== "" ? 1 : 0;
			}
			if (b.hasTransferts) {
				var ids = b.hasPost ? ["trA", "trB", "trC", "trD", "trE"] : ["trA", "trB", "trC"];
				s3Total += ids.length;
				s3Done += ids.filter(function (id) {
					return $(id).value !== "";
				}).length;
			}

			return {
				1: stepScore((num("pax") >= 1 ? 1 : 0) + (num("nuits") > 0 ? 1 : 0), 2),
				2: stepScore(cabs.length, 4),
				3: stepScore(s3Done, s3Total),
				4: stepScore((cabs.length > 0 ? 1 : 0) + (tauxOk ? 1 : 0), 2),
			};
		}

		function refresh(b, cabs) {
			var p = getProgress(b, cabs);
			document.querySelectorAll(".calc-step").forEach(function (btn) {
				var s = p[btn.dataset.step];
				if (!s) return;
				btn.textContent = btn.dataset.label + " (" + s.done + "/" + s.total + ")";
			});
		}

		function showMessage(text, ok) {
			var m = $("calcGenerateMsg");
			m.textContent = text;
			m.className = ok ? msgOkClass : msgErrClass;
			setTimeout(function () {
				m.textContent = "";
			}, 4500);
		}

		function validateReady() {
			var b = computeBase();
			var cabs = activeCabins(b);
			var issues = [];

			if (num("pax") < 1) issues.push({ step: 1, msg: "Indiquez au moins 1 passager." });
			if (num("nuits") <= 0) issues.push({ step: 1, msg: "Indiquez un nombre de nuits a bord superieur a 0." });
			if (!cabs.length) issues.push({ step: 2, msg: "Entrez le prix d'au moins une categorie de cabine." });
			if (b.usd && num("taux") <= 0) issues.push({ step: 2, msg: "Le taux USD -> CAD doit etre superieur a 0." });
			if ($("vols").value === "") issues.push({ step: 3, msg: "Renseignez le cout des vols (ou 0 si non applicable)." });

			if (b.hasPre) {
				if (num("nuitsHotel") <= 0) issues.push({ step: 3, msg: "Le sejour pre est active: indiquez des nuits (> 0)." });
				if ($("hotel").value === "") issues.push({ step: 3, msg: "Le sejour pre est active: renseignez le cout hotel pre." });
			}
			if (b.hasPost) {
				if (num("nuitsHotelPost") <= 0) issues.push({ step: 3, msg: "Le sejour post est active: indiquez des nuits (> 0)." });
				if ($("hotelPost").value === "") issues.push({ step: 3, msg: "Le sejour post est active: renseignez le cout hotel post." });
			}
			if (b.hasTransferts) {
				var ids = b.hasPost ? ["trA", "trB", "trC", "trD", "trE"] : ["trA", "trB", "trC"];
				var missing = ids.find(function (id) {
					return $(id).value === "";
				});
				if (missing) issues.push({ step: 3, msg: "Les transferts sont actives: completez chaque segment (ou 0)." });
			}

			return issues;
		}

		function prepare() {
			var issues = validateReady();
			if (issues.length) {
				gotoStep(issues[0].step, true);
				showMessage("Validation incomplete: " + issues[0].msg, false);
				return false;
			}
			showMessage("Dossier valide. Ouverture de l'onglet Sommaire pour les exports.", true);
			switchTab("sommaire");
			showProjectReady();
			return true;
		}

		document.querySelectorAll(".calc-step").forEach(function (btn) {
			btn.addEventListener("click", function () {
				gotoStep(parseInt(btn.dataset.step, 10), true);
			});
		});

		return {
			setStep: setStep,
			gotoStep: gotoStep,
			refresh: refresh,
			prepare: prepare,
		};
	}

	window.WorkflowAgentModule = { init: init };
})();
