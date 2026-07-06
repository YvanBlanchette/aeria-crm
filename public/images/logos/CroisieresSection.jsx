import { useState, useMemo, useEffect, useRef } from "react";
import {
	X, MapPin, Calendar, Ship, Wifi, GlassWater, BadgeCheck,
	ChevronRight, Anchor, MessageCircle, Check, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// ── Logos vrais fichiers PNG (à placer dans /public/logos/) ───────────────────
import logoRoyal     from "/logos/royal.png";
import logoPrincess  from "/logos/princess.png";
import logoVirgin    from "/logos/virgin.png";
import logoCelebrity from "/logos/celebrity.png";
import logoNCL       from "/logos/ncl.png";
import logoHAL       from "/logos/hal.png";
import logoCunard    from "/logos/cunard.png";
import logoSeabourn  from "/logos/seabourn.png";
import logoExplora   from "/logos/explora.png";

// ── Données ───────────────────────────────────────────────────────────────────
import CroisieresSudData from "@/data/croisieres-sud.json";
// import CroisieresEuropeData    from "@/data/croisieres-europe.json";
// import CroisieresAlaskaData    from "@/data/croisieres-alaska.json";
// import CroisieresExotiquesData from "@/data/croisieres-exotiques.json";

// ── Config ────────────────────────────────────────────────────────────────────
const MESSENGER_URL      = "https://m.me/yvanblanchettecvc";
const COMPAGNIES_EXCLUES = ["Carnival Cruise Line"];
const ITEMS_PAR_PAGE     = 9;
const GOLD               = "#B8935C";

const DESTINATION_LABELS = {
	"sud":       "Destinations Soleil",
	"europe":    "Europe",
	"alaska":    "Alaska",
	"exotiques": "Exotiques",
};

const TOUTES = [
	...CroisieresSudData.map(c => ({ ...c, _dest: "sud" })),
	// ...CroisieresEuropeData.map(c => ({ ...c, _dest: "europe" })),
	// ...CroisieresAlaskaData.map(c => ({ ...c, _dest: "alaska" })),
	// ...CroisieresExotiquesData.map(c => ({ ...c, _dest: "exotiques" })),
].filter(c => !COMPAGNIES_EXCLUES.includes(c["Croisiériste"]));

// ── Logos par compagnie ───────────────────────────────────────────────────────
// bg     = couleur du badge derrière le logo
// filter = filtre CSS si le logo a besoin d'être éclairci/assombri
// maxH   = hauteur max dans le badge (en px)
const LOGOS_CONFIG = {
	"Royal Caribbean":       { src: logoRoyal,     bg: "#ffffff", border: true,  maxH: 32 },
	"Princess Cruises":      { src: logoPrincess,  bg: "#ffffff", border: true,  maxH: 28 },
	"Virgin Voyages":        { src: logoVirgin,    bg: "#1a0000", border: false, maxH: 36 },
	"Celebrity Cruises":     { src: logoCelebrity, bg: "#ffffff", border: true,  maxH: 36 },
	"Norwegian Cruise Line": { src: logoNCL,       bg: "#ffffff", border: true,  maxH: 30 },
	"Holland America Line":  { src: logoHAL,       bg: "#ffffff", border: true,  maxH: 32 },
	"Cunard Line":           { src: logoCunard,    bg: "#ffffff", border: true,  maxH: 32 },
	"Seabourn":              { src: logoSeabourn,  bg: "#ffffff", border: true,  maxH: 28 },
	"Explora Journeys":      { src: logoExplora,   bg: "#1a1510", border: false, maxH: 28 },
};

function LogoBadge({ compagnie, size = "card" }) {
	const config = LOGOS_CONFIG[compagnie];
	const isModal = size === "modal";

	if (!config) {
		// Fallback texte pour compagnies sans logo
		return (
			<div className="px-2.5 py-1.5 rounded-xl text-white text-[10px] tracking-widest uppercase font-bold shadow-sm bg-stone-600">
				{compagnie}
			</div>
		);
	}

	const { src, bg, border, maxH } = config;
	const paddingX = isModal ? "px-4" : "px-2.5";
	const paddingY = isModal ? "py-2"  : "py-1.5";
	const borderCls = border ? "border border-black/[0.07]" : "";

	return (
		<div
			className={`${paddingX} ${paddingY} rounded-xl shadow-sm flex items-center justify-center ${borderCls}`}
			style={{ backgroundColor: bg, minWidth: 48 }}
		>
			<img
				src={src}
				alt={compagnie}
				style={{ height: isModal ? maxH * 1.2 : maxH, width: "auto", objectFit: "contain" }}
				onError={e => { e.target.parentElement.innerHTML = `<span style="font-size:10px;color:#666;font-weight:600;letter-spacing:0.1em;text-transform:uppercase">${compagnie}</span>`; }}
			/>
		</div>
	);
}

// ── Durées ────────────────────────────────────────────────────────────────────
const DUREES = [
	{ label: "1 – 6 nuits",   min: 1,  max: 6   },
	{ label: "7 – 10 nuits",  min: 7,  max: 10  },
	{ label: "11 – 14 nuits", min: 11, max: 14  },
	{ label: "15 nuits +",    min: 15, max: 999 },
];

// ── Utils dates ───────────────────────────────────────────────────────────────
const MOIS_LONG = ["","janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const MOIS_COURT = ["","Jan","Fév","Mar","Avr","Mai","Jun","Juil","Août","Sept","Oct","Nov","Déc"];

const getMois  = iso => (iso && iso !== "N/A") ? parseInt(iso.split("-")[1]) : 0;
const getAnnee = iso => (iso && iso !== "N/A") ? iso.split("-")[0] : "";
const getJour  = iso => (iso && iso !== "N/A") ? parseInt(iso.split("-")[2]) : 0;

function fmtPeriode(dep, ret) {
	if (!dep || dep === "N/A") return "—";
	const jD = getJour(dep), mD = getMois(dep), aD = getAnnee(dep);
	const jR = getJour(ret), mR = getMois(ret), aR = getAnnee(ret);
	if (!ret || ret === "N/A") return `${jD} ${MOIS_LONG[mD]} ${aD}`;
	if (mD === mR && aD === aR) return `${jD} au ${jR} ${MOIS_LONG[mR]} ${aD}`;
	if (aD === aR)              return `${jD} ${MOIS_LONG[mD]} au ${jR} ${MOIS_LONG[mR]} ${aD}`;
	return `${jD} ${MOIS_LONG[mD]} ${aD} au ${jR} ${MOIS_LONG[mR]} ${aR}`;
}

// ── Messenger ─────────────────────────────────────────────────────────────────
function buildMessengerUrl(c) {
	const prix = c["Prix Int."] || c["Prix Ext."] || c["Prix Balcon"] || 0;
	const txt =
		`Bonjour Yvan ! Je suis intéressé(e) par cette croisière :\n\n` +
		`🚢 ${c["Itinéraire"]} — ${c["Navire"]} (${c["Croisiériste"]})\n` +
		`📅 ${fmtPeriode(c["Date Départ"], c["Date Retour"])} · ${c["Nuits"]} nuits\n` +
		`⚓ Port de départ : ${c["Port Départ"]}\n` +
		`💰 À partir de ${prix.toLocaleString("fr-CA")} $ / pers.\n\n` +
		`Pourriez-vous me confirmer les disponibilités et le prix exact ?`;
	return `${MESSENGER_URL}?text=${encodeURIComponent(txt)}`;
}

// ── Multi-Select dropdown ─────────────────────────────────────────────────────
function MultiSelect({ placeholder, options, selected, onChange }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
		document.addEventListener("mousedown", fn);
		return () => document.removeEventListener("mousedown", fn);
	}, []);

	const toggle = val => onChange(selected.includes(val)
		? selected.filter(v => v !== val)
		: [...selected, val]
	);

	const displayLabel = selected.length === 0
		? placeholder
		: selected.length === 1
		? (options.find(o => o.value === selected[0])?.label || selected[0])
		: `${selected.length} sélectionnés`;

	const hasSelection = selected.length > 0;

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen(!open)}
				className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-all duration-200 min-w-[160px] justify-between bg-white
				            ${open || hasSelection
				              ? "border-[#B8935C] shadow-sm"
				              : "border-stone-200 hover:border-stone-300"}`}
			>
				<span className={hasSelection ? "text-stone-800 font-medium" : "text-stone-400"}>
					{displayLabel}
				</span>
				<div className="flex items-center gap-1.5 shrink-0">
					{hasSelection && (
						<span
							onClick={e => { e.stopPropagation(); onChange([]); }}
							className="size-4 bg-[#B8935C] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
						>
							<X className="size-2.5 text-white" />
						</span>
					)}
					<ChevronDown className={`size-3.5 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
				</div>
			</button>

			{open && (
				<div className="absolute top-full left-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl z-40 py-1.5 min-w-full max-h-72 overflow-y-auto">
					{options.map(opt => {
						const isSel = selected.includes(opt.value);
						return (
							<button key={opt.value} onClick={() => toggle(opt.value)}
								className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-stone-50 transition-colors gap-3">
								<span className={isSel ? "text-stone-900 font-medium" : "text-stone-600"}>
									{opt.label}
								</span>
								<span className={`size-4 rounded border flex items-center justify-center shrink-0 transition-all ${
									isSel ? "border-[#B8935C]" : "border-stone-300"
								}`} style={isSel ? { backgroundColor: GOLD } : {}}>
									{isSel && <Check className="size-2.5 text-white" />}
								</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ── Inclusion pill (modal) ────────────────────────────────────────────────────
function InclPill({ Icon, label, statut }) {
	const cls = {
		"Inclus":     "bg-emerald-50 text-emerald-700 border-emerald-200",
		"Gratuit":    "bg-amber-50   text-amber-700   border-amber-200",
		"Non inclus": "bg-stone-50   text-stone-400   border-stone-200",
	}[statut] || "bg-stone-50 text-stone-400 border-stone-200";
	return (
		<span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cls}`}>
			<Icon className="size-3" />{label}
		</span>
	);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ c, onClose }) {
	const prix   = c["Prix Int."] || c["Prix Ext."] || c["Prix Balcon"] || 0;
	const msgUrl = buildMessengerUrl(c);

	useEffect(() => {
		const fn = e => e.key === "Escape" && onClose();
		document.addEventListener("keydown", fn);
		document.body.style.overflow = "hidden";
		return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
			onClick={e => e.target === e.currentTarget && onClose()}>
			<div className="relative w-full sm:max-w-xl bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl
			                animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

				{/* Image header */}
				<div className="relative h-52 overflow-hidden bg-stone-200">
					<img src={c["Image Itinéraire"]} alt={c["Itinéraire"]} className="size-full object-cover" />
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

					{/* Logo */}
					<div className="absolute top-4 left-4">
						<LogoBadge compagnie={c["Croisiériste"]} size="modal" />
					</div>

					{/* Nuits */}
					<span className="absolute top-4 right-12 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
						{c["Nuits"]} nuits
					</span>

					{/* Close */}
					<button onClick={onClose}
						className="absolute top-3 right-3 size-8 rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white transition-colors">
						<X className="size-4" />
					</button>

					{/* Titre */}
					<div className="absolute bottom-0 inset-x-0 p-5">
						<h2 className="font-serif text-2xl text-white font-semibold leading-tight">{c["Itinéraire"]}</h2>
						<p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
							<Ship className="size-3.5" />{c["Navire"]}
						</p>
					</div>
				</div>

				{/* Corps */}
				<div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">

					{/* Période */}
					<div className="bg-stone-50 rounded-2xl p-3 text-center">
						<p className="text-[10px] text-stone-400 tracking-[0.15em] uppercase mb-1">Période</p>
						<p className="font-semibold text-stone-800 capitalize">{fmtPeriode(c["Date Départ"], c["Date Retour"])}</p>
						<p className="text-xs text-stone-400 mt-0.5">Port de départ : {c["Port Départ"]}</p>
					</div>

					{/* Prix */}
					<div>
						<p className="text-[10px] text-stone-400 tracking-[0.15em] uppercase mb-2">Prix par personne</p>
						<div className="flex gap-3 flex-wrap">
							{[["Intérieure", c["Prix Int."]], ["Extérieure", c["Prix Ext."]], ["Balcon", c["Prix Balcon"]]]
								.filter(([,p]) => p > 0).map(([label, p]) => (
								<div key={label} className="flex-1 min-w-[90px] border border-stone-200 rounded-2xl p-3 text-center">
									<p className="text-[10px] text-stone-400 mb-0.5">{label}</p>
									<p className="font-semibold text-stone-900 text-sm">{p.toLocaleString("fr-CA")} $</p>
								</div>
							))}
						</div>
					</div>

					{/* Inclusions */}
					<div>
						<p className="text-[10px] text-stone-400 tracking-[0.15em] uppercase mb-2">Inclusions</p>
						<div className="flex flex-wrap gap-2">
							<InclPill Icon={Wifi}       label="WiFi"       statut={c["WiFi"]}       />
							<InclPill Icon={GlassWater} label="Boissons"   statut={c["Boissons"]}   />
							<InclPill Icon={BadgeCheck} label="Pourboires" statut={c["Pourboires"]} />
						</div>
					</div>

					{/* Navire */}
					{c["Image Navire"] && (
						<div className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3">
							<img src={c["Image Navire"]} alt={c["Navire"]}
								className="h-14 w-24 object-cover rounded-xl"
								onError={e => { e.target.parentElement.style.display = "none"; }} />
							<div>
								<p className="text-[10px] text-stone-400 tracking-[0.1em] uppercase">Navire</p>
								<p className="font-semibold text-stone-800 text-sm">{c["Navire"]}</p>
								<p className="text-xs text-stone-500">{c["Croisiériste"]}</p>
							</div>
						</div>
					)}

					<Separator />

					<a href={msgUrl} target="_blank" rel="noopener noreferrer"
						className="flex w-full items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white bg-[#0084FF] hover:bg-[#006fd6] transition-colors duration-200">
						<MessageCircle className="size-5" />
						Demander de l'information via Messenger
					</a>
					<p className="text-center text-xs text-stone-400 pb-1">
						Les informations de cette croisière seront pré-remplies dans votre message.
					</p>
				</div>
			</div>
		</div>
	);
}

// ── Carte croisière ───────────────────────────────────────────────────────────
function CarteCreoisiere({ c, onClick }) {
	const prix = c["Prix Int."] || c["Prix Ext."] || c["Prix Balcon"] || 0;

	return (
		<button onClick={() => onClick(c)}
			className="group text-left flex flex-col rounded-2xl overflow-hidden border border-stone-200 bg-white
			           hover:border-stone-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)]
			           transition-all duration-400 hover:-translate-y-1 cursor-pointer">

			{/* Image */}
			<div className="relative h-44 overflow-hidden bg-stone-100 shrink-0">
				<img src={c["Image Itinéraire"]} alt={c["Itinéraire"]}
					className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
					onError={e => { e.target.style.display = "none"; }} />
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

				{/* Logo */}
				<div className="absolute top-3 left-3">
					<LogoBadge compagnie={c["Croisiériste"]} size="card" />
				</div>

				{/* Nuits */}
				<span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
					{c["Nuits"]} nuits
				</span>

				{/* Vignette navire */}
				{c["Image Navire"] && (
					<div className="absolute bottom-3 right-3 h-12 w-20 rounded-xl overflow-hidden border-2 border-white shadow-md bg-stone-200">
						<img src={c["Image Navire"]} alt={c["Navire"]} className="size-full object-cover"
							onError={e => { e.target.parentElement.style.display = "none"; }} />
					</div>
				)}
			</div>

			{/* Corps */}
			<div className="flex flex-col flex-1 p-4 gap-3">

				<div>
					<h3 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-[#B8935C] transition-colors duration-300">
						{c["Itinéraire"]}
					</h3>
					<p className="flex items-center gap-1.5 text-stone-400 text-xs mt-0.5">
						<Ship className="size-3 shrink-0" />{c["Navire"]}
					</p>
				</div>

				{/* Port + date longue */}
				<div className="space-y-1">
					<p className="flex items-center gap-1.5 text-xs text-stone-500">
						<MapPin className="size-3 shrink-0" style={{ color: GOLD }} />
						{c["Port Départ"]}
					</p>
					<p className="flex items-center gap-1.5 text-xs text-stone-500 capitalize">
						<Calendar className="size-3 shrink-0 text-stone-400" />
						{fmtPeriode(c["Date Départ"], c["Date Retour"])}
					</p>
				</div>

				<Separator className="bg-stone-100" />

				{/* Prix */}
				<div className="flex items-end justify-between gap-2">
					<div>
						<p className="text-[10px] text-stone-400 tracking-[0.15em] uppercase">À partir de</p>
						<div className="flex items-baseline gap-1 mt-0.5">
							<span className="text-xl font-semibold text-stone-900">{prix.toLocaleString("fr-CA")} $</span>
							<span className="text-xs text-stone-400">/ pers.</span>
						</div>
						<div className="flex flex-wrap gap-1 mt-1.5">
							{c["Prix Int."]   > 0 && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">Int. {c["Prix Int."].toLocaleString("fr-CA")} $</span>}
							{c["Prix Ext."]   > 0 && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">Ext. {c["Prix Ext."].toLocaleString("fr-CA")} $</span>}
							{c["Prix Balcon"] > 0 && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">Bal. {c["Prix Balcon"].toLocaleString("fr-CA")} $</span>}
						</div>
					</div>

					<div className="flex flex-col items-end gap-2 shrink-0">
						<div className="flex gap-1.5">
							{c["WiFi"]       === "Inclus" && <Wifi        className="size-3.5 text-emerald-500" title="WiFi inclus" />}
							{c["Boissons"]   === "Inclus" && <GlassWater  className="size-3.5 text-emerald-500" title="Boissons incluses" />}
							{c["Pourboires"] === "Inclus" && <BadgeCheck  className="size-3.5 text-emerald-500" title="Pourboires inclus" />}
						</div>
						<div className="size-8 rounded-full border border-[#B8935C]/30 flex items-center justify-center
						                group-hover:bg-[#B8935C] group-hover:border-[#B8935C] transition-all duration-300">
							<ChevronRight className="size-4 text-[#B8935C] group-hover:text-white transition-colors duration-300" />
						</div>
					</div>
				</div>
			</div>
		</button>
	);
}

// ── Section principale ────────────────────────────────────────────────────────
const CroisieresSection = () => {
	const [modalC,       setModalC]       = useState(null);
	const [afficherTout, setAfficherTout] = useState(false);

	const [fDests,  setFDests]  = useState([]);
	const [fComps,  setFComps]  = useState([]);
	const [fDurees, setFDurees] = useState([]);
	const [fMois,   setFMois]   = useState([]);

	const reset = () => { setFDests([]); setFComps([]); setFDurees([]); setFMois([]); setAfficherTout(false); };
	const filtresActifs = fDests.length > 0 || fComps.length > 0 || fDurees.length > 0 || fMois.length > 0;

	const destinations = useMemo(() => [...new Set(TOUTES.map(c => c._dest))], []);
	const compagnies   = useMemo(() => [...new Set(TOUTES.map(c => c["Croisiériste"]))].sort(), []);
	const moisDispos   = useMemo(() => [...new Set(TOUTES.map(c => getMois(c["Date Départ"])).filter(Boolean))].sort((a,b) => a-b), []);

	const optsDest  = destinations.map(d => ({ value: d, label: DESTINATION_LABELS[d] || d }));
	const optsComp  = compagnies.map(c => ({ value: c, label: c }));
	const optsDuree = DUREES.map((d, i) => ({ value: String(i), label: d.label }));
	const optsMois  = moisDispos.map(m => ({ value: String(m), label: MOIS_LONG[m].charAt(0).toUpperCase() + MOIS_LONG[m].slice(1) }));

	const filtrees = useMemo(() => {
		let r = TOUTES;
		if (fDests.length  > 0) r = r.filter(c => fDests.includes(c._dest));
		if (fComps.length  > 0) r = r.filter(c => fComps.includes(c["Croisiériste"]));
		if (fMois.length   > 0) r = r.filter(c => fMois.includes(String(getMois(c["Date Départ"]))));
		if (fDurees.length > 0) {
			r = r.filter(c => fDurees.some(i => {
				const { min, max } = DUREES[parseInt(i)];
				return c["Nuits"] >= min && c["Nuits"] <= max;
			}));
		}
		return r;
	}, [fDests, fComps, fDurees, fMois]);

	const affichees = afficherTout ? filtrees : filtrees.slice(0, ITEMS_PAR_PAGE);
	const changer = setter => val => { setter(val); setAfficherTout(false); };

	return (
		<section id="croisieres" className="py-20 px-6 bg-white">
			<div className="max-w-7xl mx-auto">

				{/* En-tête */}
				<div className="text-center mb-14">
					<Badge variant="outline" className="text-xs tracking-[0.4em] uppercase mb-4" style={{ borderColor: GOLD, color: GOLD }}>
						Dernière Minute
					</Badge>
					<h2 className="font-serif text-4xl lg:text-5xl font-semibold text-stone-900">
						Croisières de Prestige
					</h2>
					<p className="text-stone-400 mt-4 text-sm max-w-md mx-auto">
						Départs imminents sélectionnés — contactez Yvan pour réserver
					</p>
					<div className="w-20 h-0.5 mx-auto mt-8 bg-gradient-to-r from-transparent via-[#B8935C] to-transparent" />
				</div>

				{/* Filtres */}
				<div className="mb-10 p-5 bg-stone-50 rounded-2xl border border-stone-100">
					<div className="flex flex-wrap gap-3 items-center">

						{destinations.length > 1 && (
							<MultiSelect placeholder="Destination" options={optsDest}
								selected={fDests} onChange={changer(setFDests)} />
						)}

						<MultiSelect placeholder="Durée du séjour" options={optsDuree}
							selected={fDurees} onChange={changer(setFDurees)} />

						<MultiSelect placeholder="Mois de départ" options={optsMois}
							selected={fMois} onChange={changer(setFMois)} />

						<MultiSelect placeholder="Croisiériste" options={optsComp}
							selected={fComps} onChange={changer(setFComps)} />

						<div className="ml-auto flex items-center gap-4">
							<p className="text-sm text-stone-500">
								<span className="font-semibold text-stone-800">{filtrees.length}</span>
								{" "}croisière{filtrees.length !== 1 ? "s" : ""}
							</p>
							{filtresActifs && (
								<button onClick={reset} className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: GOLD }}>
									<X className="size-3" /> Réinitialiser
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Grille */}
				{affichees.length === 0 ? (
					<div className="text-center py-24">
						<Anchor className="size-12 mx-auto mb-4 text-stone-200" />
						<p className="text-stone-400 font-medium text-lg">Aucune croisière pour ces filtres.</p>
						<button onClick={reset} className="mt-4 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: GOLD }}>
							Réinitialiser les filtres
						</button>
					</div>
				) : (
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{affichees.map((c, i) => (
							<CarteCreoisiere key={`${c["Navire"]}-${c["Date Départ"]}-${i}`} c={c} onClick={setModalC} />
						))}
					</div>
				)}

				{/* Pagination */}
				<div className="text-center mt-12 space-y-3">
					{!afficherTout && filtrees.length > ITEMS_PAR_PAGE && (
						<>
							<p className="text-stone-400 text-sm">
								{affichees.length} sur {filtrees.length} croisières affichées
							</p>
							<Button onClick={() => setAfficherTout(true)} size="lg" variant="outline"
								className="border-stone-200 text-stone-600 text-sm tracking-[0.15em] uppercase font-semibold
								           hover:bg-[#B8935C] hover:border-[#B8935C] hover:text-white transition-all duration-300">
								Voir toutes les croisières
								<ChevronRight className="size-5 ms-2" />
							</Button>
						</>
					)}
					{afficherTout && filtrees.length > ITEMS_PAR_PAGE && (
						<button onClick={() => { setAfficherTout(false); document.getElementById("croisieres")?.scrollIntoView({ behavior: "smooth" }); }}
							className="text-xs text-stone-400 hover:text-stone-600 tracking-widest uppercase transition-colors">
							Réduire la liste
						</button>
					)}
				</div>
			</div>

			{modalC && <Modal c={modalC} onClose={() => setModalC(null)} />}
		</section>
	);
};

export default CroisieresSection;
