(function () {
	"use strict";

	function init(options) {
		var $ = options.$;
		var render = options.render;
		var syncToggles = options.syncToggles;

		// Any new data input that must be persisted should live in one of these pages.
		// Keeping the list centralized avoids accidental partial saves.
		var PAGES_STATE = ["page-croisiere", "page-vols", "page-hotel", "page-transferts", "page-sommaire"];

		function collectState() {
			var s = {};
			PAGES_STATE.forEach(function (p) {
				document.querySelectorAll("#" + p + " input, #" + p + " select, #" + p + " textarea").forEach(function (el) {
					if (!el.id) return;
					s[el.id] = el.type === "checkbox" ? el.checked : el.value;
				});
			});
			return s;
		}

		function clearAll(rerender) {
			PAGES_STATE.forEach(function (p) {
				document.querySelectorAll("#" + p + " input, #" + p + " select, #" + p + " textarea").forEach(function (el) {
					if (el.type === "checkbox") el.checked = false;
					else if (el.tagName === "SELECT") el.selectedIndex = 0;
					else el.value = "";
				});
			});

			// Baseline values expected by pricing formulas.
			$("pax").value = 2;
			$("nuits").value = 7;
			$("nuitsHotel").value = 1;
			$("nuitsHotelPost").value = 1;
			$("taux").value = 1.38;

			syncToggles();
			if (rerender !== false) render();
		}

		function applyState(s) {
			clearAll(false);
			Object.keys(s || {}).forEach(function (id) {
				var el = $(id);
				if (!el) return;
				if (el.type === "checkbox") el.checked = !!s[id];
				else el.value = s[id];
			});
			syncToggles();
			render();
		}

		return {
			collectState: collectState,
			clearAll: clearAll,
			applyState: applyState,
		};
	}

	window.StateModule = { init: init };
})();
