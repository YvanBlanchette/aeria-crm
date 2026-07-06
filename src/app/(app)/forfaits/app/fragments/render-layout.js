(function () {
"use strict";

// ---------------------------------------------------------------------------
// ASSEMBLEUR DE LAYOUT
// Rôle : reconstruire le body complet à partir des fragments HTML externes.
// Pourquoi : garder calculateur-forfaits.html lisible et rendre la maintenance
// accessible à un dev junior (chaque gros bloc est isolé).
// ---------------------------------------------------------------------------

function getFragmentsOrThrow() {
var f = window.AppLayoutFragments || {};
var missing = [];
if (!f.accueil) missing.push("accueil.fragment.js");
if (!f.header) missing.push("header.fragment.js");
if (!f.pages) missing.push("pages.fragment.js");
if (missing.length) {
throw new Error("Fragments manquants: " + missing.join(", "));
}
return f;
}

function renderLayout() {
var host = document.getElementById("app-shell");
if (!host) {
throw new Error("#app-shell introuvable dans calculateur-forfaits.html");
}

var f = getFragmentsOrThrow();

// Injection dans l'ordre visuel réel de l'application.
host.innerHTML = f.accueil + "\n" + f.header + "\n" + f.pages;
}

renderLayout();
})();