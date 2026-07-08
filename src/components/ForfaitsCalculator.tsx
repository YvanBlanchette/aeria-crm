"use client";

import React, { useState, useCallback, useEffect } from "react";

/* TYPES */
interface Constants {
  admin: number;
  pctVols: number;
  pctMarkup: number;
  pourboiresNuit: number;
  arrondi: number;
}

interface FormState {
  // Croisière
  pax: number;
  nuits: number;
  hasPre: boolean;
  nuitsHotel: number;
  hasPost: boolean;
  nuitsHotelPost: number;
  hasTransferts: boolean;

  // Cabines
  cabInt: number;
  cabExt: number;
  cabBal: number;
  cabSui: number;
  usdCab: boolean;
  taux: number;

  // Prix
  vols: number;
  bagAller: number;
  bagRetour: number;
  hotel: number;
  hotelPost: number;

  // Transferts
  trA: number;
  trB: number;
  trC: number;
  trD: number;
  trE: number;

  // Pourboires
  pourboiresInclus: boolean;
  pourboiresManuel: number | null;
}

interface BaseCalc {
  pax: number;
  nuits: number;
  totalNuits: number;
  vols: number;
  bagAller: number;
  bagRetour: number;
  bagages: number;
  hotelPers: number;
  hotelChambre: number;
  hotelChambrePost: number;
  hotelTotal: number;
  transferts: number;
  pourboires: number;
  pourboiresMode: "inclus" | "manuel" | "auto";
  usd: boolean;
  taux: number;
  markup: number;
  fraisVises: number;
}

interface CabinResult {
  nom: string;
  code: string;
  factureBrute: number;
  facture: number;
  cabinePers: number;
  prixPers: number;
  coussin: number;
  total: number;
  prixPersNuit: number;
}

interface DossierProject {
  id: string;
  nom: string;
  createdAt: string;
  state: FormState;
}

/* MAIN COMPONENT */
export function ForfaitsCalculator() {
  const [constants, setConstants] = useState<Constants>({
    admin: 120,
    pctVols: 15,
    pctMarkup: 30,
    pourboiresNuit: 25,
    arrondi: 50,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    pax: 2,
    nuits: 7,
    hasPre: false,
    nuitsHotel: 1,
    hasPost: false,
    nuitsHotelPost: 1,
    hasTransferts: false,
    cabInt: 0,
    cabExt: 0,
    cabBal: 0,
    cabSui: 0,
    usdCab: false,
    taux: 1.38,
    vols: 0,
    bagAller: 0,
    bagRetour: 0,
    hotel: 0,
    hotelPost: 0,
    trA: 0,
    trB: 0,
    trC: 0,
    trD: 0,
    trE: 0,
    pourboiresInclus: false,
    pourboiresManuel: null,
  });

  const [dossiers, setDossiers] = useState<DossierProject[]>([]);
  const [currentDossier, setCurrentDossier] = useState<string | null>(null);

  /* BOOTSTRAP DATA */
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/forfaits/store", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.constants) setConstants(data.constants);
          if (data.dossiers) setDossiers(data.dossiers);
        }
      } catch (e) {
        console.error("Bootstrap failed:", e);
      }
    };
    bootstrap();
  }, []);

  /* FORM HANDLERS */
  const updateForm = useCallback((updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      pax: 2,
      nuits: 7,
      hasPre: false,
      nuitsHotel: 1,
      hasPost: false,
      nuitsHotelPost: 1,
      hasTransferts: false,
      cabInt: 0,
      cabExt: 0,
      cabBal: 0,
      cabSui: 0,
      usdCab: false,
      taux: 1.38,
      vols: 0,
      bagAller: 0,
      bagRetour: 0,
      hotel: 0,
      hotelPost: 0,
      trA: 0,
      trB: 0,
      trC: 0,
      trD: 0,
      trE: 0,
      pourboiresInclus: false,
      pourboiresManuel: null,
    });
    setCurrentStep(1);
  }, []);

  /* CALCULATION ENGINE */
  const computeBase = useCallback((): BaseCalc => {
    const pax = Math.max(1, form.pax);
    const vols = form.vols / pax;
    const bagAller = form.bagAller / pax;
    const bagRetour = form.bagRetour / pax;
    const bagages = bagAller + bagRetour;

    const nuitsHotel = form.hasPre ? form.nuitsHotel : 0;
    const hotelChambre = form.hasPre ? form.hotel * nuitsHotel : 0;

    const nuitsHotelPost = form.hasPost ? form.nuitsHotelPost : 0;
    const hotelChambrePost = form.hasPost ? form.hotelPost * nuitsHotelPost : 0;
    const hotelTotal = hotelChambre + hotelChambrePost;
    const hotelPers = hotelTotal / pax;

    const transferts = form.hasTransferts
      ? form.trA / pax +
        form.trB / pax +
        form.trC / pax +
        (form.hasPost ? form.trD / pax + form.trE / pax : 0)
      : 0;

    const pourboires = form.pourboiresInclus
      ? 0
      : (form.pourboiresManuel ?? constants.pourboiresNuit * form.nuits);

    const fraisVises = (vols * constants.pctVols) / 100;
    const markupMax = (hotelPers * constants.pctMarkup) / 100;
    const markup = Math.min(fraisVises, markupMax);

    return {
      pax,
      nuits: form.nuits,
      totalNuits: form.nuits + nuitsHotel + nuitsHotelPost,
      vols,
      bagAller,
      bagRetour,
      bagages,
      hotelPers,
      hotelChambre,
      hotelChambrePost,
      hotelTotal,
      transferts,
      pourboires,
      pourboiresMode: form.pourboiresInclus
        ? "inclus"
        : form.pourboiresManuel !== null
          ? "manuel"
          : "auto",
      usd: form.usdCab,
      taux: form.usdCab ? form.taux : 1,
      markup,
      fraisVises,
    };
  }, [form, constants]);

  const cabinCalc = useCallback(
    (b: BaseCalc, cabinePrix: number): CabinResult => {
      const cabinePers = (cabinePrix / b.pax) * (b.usd ? b.taux : 1);
      const brut =
        cabinePers +
        b.vols +
        b.bagages +
        b.hotelPers +
        b.transferts +
        b.pourboires +
        constants.admin +
        b.markup;

      const step = constants.arrondi || 0;
      const prixPers = step > 0 ? Math.ceil(brut / step) * step : brut;
      const coussin = prixPers - brut;
      const total = prixPers * b.pax;
      const prixPersNuit = b.totalNuits > 0 ? prixPers / b.totalNuits : 0;

      return {
        cabinePers,
        prixPers,
        coussin,
        total,
        prixPersNuit,
        nom: "",
        code: "",
        factureBrute: 0,
        facture: 0,
      };
    },
    [constants],
  );

  const activeCabins = useCallback(
    (b: BaseCalc) => {
      return [
        { id: "cabInt", nom: "Intérieure", code: "INT", prix: form.cabInt },
        { id: "cabExt", nom: "Extérieure", code: "EXT", prix: form.cabExt },
        { id: "cabBal", nom: "Balcon", code: "BAL", prix: form.cabBal },
        { id: "cabSui", nom: "Suite", code: "SUI", prix: form.cabSui },
      ]
        .filter((c) => c.prix > 0)
        .map((c) => {
          const calc = cabinCalc(b, c.prix);
          return {
            nom: c.nom,
            code: c.code,
            factureBrute: c.prix,
            facture: c.prix * b.taux,
            cabinePers: calc.cabinePers,
            prixPers: calc.prixPers,
            coussin: calc.coussin,
            total: calc.total,
            prixPersNuit: calc.prixPersNuit,
          };
        });
    },
    [form, cabinCalc],
  );

  const validateReady = useCallback(() => {
    const b = computeBase();
    const cabs = activeCabins(b);
    const issues: string[] = [];

    if (form.pax < 1) issues.push("Au moins 1 passager requis");
    if (form.nuits <= 0) issues.push("Nuits à bord > 0");
    if (!cabs.length) issues.push("Entrez une cabine");
    if (form.usdCab && form.taux <= 0) issues.push("Taux USD > 0");
    if (form.vols === 0 && !form.hasPre) issues.push("Renseignez le coût des vols");

    if (form.hasPre) {
      if (form.nuitsHotel <= 0) issues.push("Séjour pré: nuits > 0");
      if (form.hotel <= 0) issues.push("Séjour pré: coût hôtel > 0");
    }
    if (form.hasPost) {
      if (form.nuitsHotelPost <= 0) issues.push("Séjour post: nuits > 0");
      if (form.hotelPost <= 0) issues.push("Séjour post: coût hôtel > 0");
    }
    if (form.hasTransferts) {
      if (form.trA === 0 || form.trB === 0 || form.trC === 0)
        issues.push("Transferts: complétez chaque segment");
      if (form.hasPost && (form.trD === 0 || form.trE === 0))
        issues.push("Transferts post: complétez");
    }

    return issues;
  }, [form, computeBase, activeCabins]);

  /* PERSIST DOSSIER */
  const saveDossier = useCallback(
    async (nom: string) => {
      try {
        const res = await fetch("/api/forfaits/store", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "upsertDossier",
            id: currentDossier || `${Date.now()}`,
            nom,
            state: form,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentDossier(data.dossier.id);
          setDossiers((prev) => [
            ...prev.filter((d) => d.id !== data.dossier.id),
            { ...data.dossier, state: form },
          ]);
        }
      } catch (e) {
        console.error("Save failed:", e);
      }
    },
    [form, currentDossier],
  );

  /* RENDER */
  const base = computeBase();
  const cabs = activeCabins(base);
  const issues = validateReady();

  const step1Score = `${(form.pax >= 1 ? 1 : 0) + (form.nuits > 0 ? 1 : 0)}/2`;
  const step2Score = `${cabs.length}/4`;
  const step3Score = `${
    (form.vols > 0 ? 1 : 0) +
    (form.hasPre && form.hotel > 0 ? 1 : 0) +
    (form.hasPost && form.hotelPost > 0 ? 1 : 0) +
    (form.hasTransferts && form.trA > 0 ? 1 : 0)
  }/${form.hasPost ? 4 : 3}`;
  const step4Score = `${(cabs.length > 0 ? 1 : 0) + (form.taux > 0 ? 1 : 0)}/2`;

  return (
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-marine">Calculateur de forfaits</h1>
        <p className="text-sm text-gray-600 mt-1">
          Croisière, vols, hôtel, transferts — tout en un.
        </p>
      </div>

      {/* TABS/STEPS */}
      <div className="flex gap-2 flex-wrap border-b">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => setCurrentStep(s)}
            className={`px-4 py-2 text-sm font-semibold ${
              currentStep === s ? "text-lagon border-b-2 border-lagon" : "text-gray-500"
            }`}
          >
            {s === 1
              ? `Croisière (${step1Score})`
              : s === 2
                ? `Cabines (${step2Score})`
                : s === 3
                  ? `Prix (${step3Score})`
                  : `Sommaire (${step4Score})`}
          </button>
        ))}
      </div>

      {/* STEP 1: CROISIÈRE */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Cadre du voyage</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">Passagers</span>
              <input
                type="number"
                value={form.pax}
                onChange={(e) =>
                  updateForm({
                    pax: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full border rounded px-2 py-1"
                min="1"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Nuits à bord</span>
              <input
                type="number"
                value={form.nuits}
                onChange={(e) =>
                  updateForm({
                    nuits: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border rounded px-2 py-1"
                min="0"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasPre}
                onChange={(e) =>
                  updateForm({
                    hasPre: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Séjour pré-croisière</span>
            </label>
            {form.hasPre && (
              <div className="grid grid-cols-2 gap-2 ml-6">
                <label className="space-y-1">
                  <span className="text-xs">Nuits hôtel</span>
                  <input
                    type="number"
                    value={form.nuitsHotel}
                    onChange={(e) =>
                      updateForm({
                        nuitsHotel: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs">Coût / nuit</span>
                  <input
                    type="number"
                    value={form.hotel}
                    onChange={(e) =>
                      updateForm({
                        hotel: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasPost}
                onChange={(e) =>
                  updateForm({
                    hasPost: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Séjour post-croisière</span>
            </label>
            {form.hasPost && (
              <div className="grid grid-cols-2 gap-2 ml-6">
                <label className="space-y-1">
                  <span className="text-xs">Nuits hôtel</span>
                  <input
                    type="number"
                    value={form.nuitsHotelPost}
                    onChange={(e) =>
                      updateForm({
                        nuitsHotelPost: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs">Coût / nuit</span>
                  <input
                    type="number"
                    value={form.hotelPost}
                    onChange={(e) =>
                      updateForm({
                        hotelPost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.hasTransferts}
                onChange={(e) =>
                  updateForm({
                    hasTransferts: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Transferts</span>
            </label>
          </div>

          <button
            onClick={() => setCurrentStep(2)}
            className="px-4 py-2 bg-lagon text-white rounded font-semibold"
          >
            Étape 2: Cabines →
          </button>
        </div>
      )}

      {/* STEP 2: CABINES */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Catégories de cabines</h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "cabInt", nom: "Intérieure" },
              {
                key: "cabExt",
                nom: "Extérieure",
              },
              { key: "cabBal", nom: "Balcon" },
              { key: "cabSui", nom: "Suite" },
            ].map((cab) => (
              <label key={cab.key} className="space-y-1">
                <span className="text-sm font-medium">{cab.nom}</span>
                <input
                  type="number"
                  value={String(form[cab.key as "cabInt" | "cabExt" | "cabBal" | "cabSui"] ?? 0)}
                  onChange={(e) =>
                    updateForm({
                      [cab.key]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border rounded px-2 py-1"
                  placeholder="0"
                />
              </label>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.usdCab}
                onChange={(e) =>
                  updateForm({
                    usdCab: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Tarifs en USD</span>
            </label>
            {form.usdCab && (
              <label className="space-y-1">
                <span className="text-sm">Taux USD → CAD</span>
                <input
                  type="number"
                  value={form.taux}
                  onChange={(e) =>
                    updateForm({
                      taux: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full border rounded px-2 py-1"
                  step="0.01"
                  min="0"
                />
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-gray-300 rounded font-semibold"
            >
              ← Étape 1
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 bg-lagon text-white rounded font-semibold"
            >
              Étape 3: Prix →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PRIX & ADD-ONS */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Prix et suppléments</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">Vols (total)</span>
              <input
                type="number"
                value={form.vols}
                onChange={(e) =>
                  updateForm({
                    vols: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border rounded px-2 py-1"
                min="0"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Bagages aller</span>
              <input
                type="number"
                value={form.bagAller}
                onChange={(e) =>
                  updateForm({
                    bagAller: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border rounded px-2 py-1"
                min="0"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Bagages retour</span>
              <input
                type="number"
                value={form.bagRetour}
                onChange={(e) =>
                  updateForm({
                    bagRetour: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border rounded px-2 py-1"
                min="0"
              />
            </label>
          </div>

          {form.hasTransferts && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold text-sm">Transferts (total)</h3>
              <div className="grid grid-cols-2 gap-2">
                {["trA", "trB", "trC", "trD", "trE"].map((tr) => {
                  if (tr === "trD" || tr === "trE") {
                    if (!form.hasPost) return null;
                  }
                  const trKey = tr as "trA" | "trB" | "trC" | "trD" | "trE";
                  return (
                    <label key={tr} className="space-y-1">
                      <span className="text-xs">Segment {tr.toUpperCase()}</span>
                      <input
                        type="number"
                        value={String(form[trKey] ?? 0)}
                        onChange={(e) =>
                          updateForm({
                            [tr]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                        min="0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pourboiresInclus}
                onChange={(e) =>
                  updateForm({
                    pourboiresInclus: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Pourboires inclus</span>
            </label>
            {!form.pourboiresInclus && (
              <label className="space-y-1">
                <span className="text-sm">
                  Ou manuel ({form.pourboiresManuel ?? constants.pourboiresNuit * form.nuits} $ par
                  défaut)
                </span>
                <input
                  type="number"
                  value={form.pourboiresManuel === null ? "" : String(form.pourboiresManuel)}
                  onChange={(e) =>
                    updateForm({
                      pourboiresManuel:
                        e.target.value === "" ? null : parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border rounded px-2 py-1"
                  placeholder="Laisser vide = auto"
                  min="0"
                />
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-gray-300 rounded font-semibold"
            >
              ← Étape 2
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 bg-lagon text-white rounded font-semibold"
            >
              Étape 4: Sommaire →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SOMMAIRE & RESULTS */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Résumé et exports</h2>

          {issues.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Validation incomplète:</strong>
              <ul className="mt-2 space-y-1">
                {issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {issues.length === 0 && (
            <>
              {/* CABINES RÉSULTATS */}
              <div className="space-y-2">
                <h3 className="font-semibold">Prix par catégorie</h3>
                <div className="space-y-2">
                  {cabs.map((cab) => (
                    <div key={cab.code} className="border rounded p-3 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>
                          {cab.nom} ({cab.code})
                        </span>
                        <span className="text-lg text-lagon">
                          ${cab.prixPers.toFixed(2)}
                          /pers
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          Cabine: ${cab.cabinePers.toFixed(2)} + Frais: $
                          {(
                            base.vols +
                            base.bagages +
                            base.hotelPers +
                            base.transferts +
                            base.pourboires +
                            constants.admin +
                            base.markup
                          ).toFixed(2)}{" "}
                          + Arrondi: ${cab.coussin.toFixed(2)}
                        </div>
                        <div>
                          <strong>Total {cab.code}:</strong> ${cab.total.toFixed(2)} ({form.pax}
                          pers)
                        </div>
                        <div>Prix/nuit: ${cab.prixPersNuit.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVE DOSSIER */}
              <div className="border-t pt-4">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Nom du dossier</span>
                  <input
                    type="text"
                    placeholder="Ex: Croisière Caraïbes 2025"
                    id="dossierName"
                    className="w-full border rounded px-2 py-1"
                  />
                </label>
                <button
                  onClick={() => {
                    const name = (document.getElementById("dossierName") as HTMLInputElement).value;
                    if (name.trim()) saveDossier(name);
                  }}
                  className="mt-2 w-full px-4 py-2 bg-marine text-white rounded font-semibold"
                >
                  💾 Enregistrer le dossier
                </button>
              </div>

              {/* EXPORT BUTTONS */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs text-gray-600">Prochainement: CSV, Excel, PDF</p>
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded font-semibold cursor-not-allowed"
                >
                  📥 Exporter CSV/Excel
                </button>
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded font-semibold cursor-not-allowed"
                >
                  📄 Générer PDF
                </button>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 border border-gray-300 rounded font-semibold"
            >
              ← Étape 3
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded font-semibold"
            >
              🔄 Nouveau dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
