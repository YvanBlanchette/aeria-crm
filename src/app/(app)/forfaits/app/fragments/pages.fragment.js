(function () {
	"use strict";
	window.AppLayoutFragments = window.AppLayoutFragments || {};

	// FRAGMENT 3/3 : pages applicatives selon le workflow par element
	// Ce fragment contient uniquement du HTML statique.
	// Le script d'assemblage (render-layout.js) l'injecte dans #app-shell.
	window.AppLayoutFragments.pages = `
<main class="max-w-6xl mx-auto px-6 pt-6 pb-16">

			<!-- ═══ PAGE CROISIÈRE ═══ -->
      <!-- SECTION LEGACY CACHÉE -->
			<section id="page-croisiere" class="page">
				<div class="bg-neige border border-ligne rounded-xl px-4 py-3 mb-5 hidden">
					<div class="mono text-xs tracking-widest uppercase text-sourdine mb-2">Workflow agent</div>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="calc-step appearance-none cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-full border border-ligne bg-white text-marine" data-step="1" data-target="croisiereBloc" data-label="1. Croisiere">1. Croisiere</button>
						<button type="button" class="calc-step appearance-none cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-full border border-ligne bg-white text-marine" data-step="2" data-target="cabinesBloc" data-label="2. Cabines">2. Cabines</button>
						<button type="button" class="calc-step appearance-none cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-full border border-ligne bg-white text-marine" data-step="3" data-target="volsHint" data-label="3. Vols / Hotel / Transferts">3. Vols / Hotel / Transferts</button>
						<button type="button" class="calc-step appearance-none cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-full border border-ligne bg-white text-marine" data-step="4" data-target="calcStep4" data-label="4. Sommaire">4. Sommaire</button>
					</div>
					<p id="calcGuideHint" class="text-xs text-sourdine mt-2"></p>
				</div>

        <!-- SECTION CROISIÈRE -->
				<div class="grid md:grid-cols-2 gap-5">
					<div class="bg-white border border-ligne rounded-xl p-5 shadow-md" id="croisiereBloc">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Croisière</h2>
						<p class="text-xs text-sourdine mb-3.5">Informations générales sur la croisière, le navire et le voyage</p>

						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
								<label for="pCompagnie" class="block text-xs font-semibold mb-1 text-encre">Compagnie de croisière</label>
								<input type="text" id="pCompagnie" placeholder="Ex. : Norwegian" class="shadow-inner w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
							</div>
							<div class="mb-3">
								<label for="pNavire" class="block text-xs font-semibold mb-1 text-encre">Navire</label>
								<input type="text" id="pNavire" placeholder="Ex. : Norwegian Vista" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
								<label for="pPortDep" class="block text-xs font-semibold mb-1 text-encre">Port de départ</label>
								<input type="text" id="pPortDep" placeholder="Ex. : Miami" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
							</div>
							<div class="mb-3">
								<label for="pPortArr" class="block text-xs font-semibold mb-1 text-encre">Port d'arrivée</label>
								<input type="text" id="pPortArr" placeholder="Ex. : Miami" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
								<label for="pCroisiereDebut" class="block text-xs font-semibold mb-1 text-encre">Date de début</label>
								<input type="date" id="pCroisiereDebut" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
							</div>
							<div class="mb-3">
								<label for="pCroisiereFin" class="block text-xs font-semibold mb-1 text-encre">Date de fin</label>
								<input type="date" id="pCroisiereFin" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
								<label for="pax" class="block text-xs font-semibold mb-1 text-encre">Nombre de passagers</label>
								<div class="relative">
									<input type="number" id="pax" min="1" step="1" value="2" class="w-full px-3 py-2.5 pr-11 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
									<span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-sourdine mono pointer-events-none">pax</span>
								</div>
							</div>
							<div class="mb-3">
								<label for="nuits" class="block text-xs font-semibold mb-1 text-encre">Nombre de nuits à bord</label>
								<div class="relative">
									<input type="number" id="nuits" min="0" step="1" value="7" class="w-full px-3 py-2.5 pr-11 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
									<span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-sourdine mono pointer-events-none">nuits</span>
								</div>
							</div>
						</div>

						<div class="mb-3">
							<label class="flex items-center gap-2.5 px-3 py-2.5 border border-ligne rounded-lg cursor-pointer text-sm font-medium bg-white">
								<input type="checkbox" id="pourboiresInclus" class="w-4 h-4 cursor-pointer" />
								Pourboires inclus dans le forfait croisiere
							</label>
						</div>
						<div id="pourboiresManuelWrap" class="mb-3">
							<label for="pourboiresManuel" class="block text-xs font-semibold mb-1 text-encre">Pourboires manuels</label>
							<div class="relative">
								<input type="number" id="pourboiresManuel" min="0" step="0.01" class="w-full px-3 py-2.5 pr-11 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
								<span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-sourdine mono pointer-events-none">$/pers</span>
							</div>
						</div>

						<div class="mb-3">
							<label class="flex items-center gap-2.5 px-3 py-2.5 border border-ligne rounded-lg cursor-pointer text-sm font-medium bg-white">
								<input type="checkbox" id="usdCab" class="w-4 h-4 cursor-pointer" />
								Convertir USD vers CAD
							</label>
						</div>
						<div class="mb-3 hidden" id="tauxWrap">
							<label for="taux" class="block text-xs font-semibold mb-1 text-encre">Taux USD -> CAD</label>
							<input type="number" id="taux" min="0" step="0.0001" value="1.38" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" />
						</div>

						<div id="dateNotice" class="bg-laiton-pale rounded-lg px-3 py-2.5 text-xs text-brun mt-3 leading-relaxed hidden"></div>
					</div>

          <!-- CABINES ET COMMISSIONS CROISIERE -->
					<div class="bg-white border border-ligne rounded-xl p-5 shadow-md" id="cabinesBloc">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Cabines et commissions croisiere</h2>

            <div class="mt-1 px-3 bg-white rounded-lg">
            <p class="text-xs font-medium text-sourdine mb-3">Coût de la croisière par catégorie de cabine</p>
						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
                <label for="cabInt" class="block text-xs font-semibold mb-1 text-encre">Intérieure</label>
                <input type="number" id="cabInt" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" />
              </div>
							<div class="mb-3">
                <label for="cabExt" class="block text-xs font-semibold mb-1 text-encre">Extérieure</label>
                <input type="number" id="cabExt" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" />
              </div>
							<div class="mb-3">
                <label for="cabBal" class="block text-xs font-semibold mb-1 text-encre">Balcon</label>
                <input type="number" id="cabBal" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" /></div>
							<div class="mb-3">
                <label for="cabSui" class="block text-xs font-semibold mb-1 text-encre">Suite</label>
                <input type="number" id="cabSui" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" /></div>
						</div>
            </div>

            <hr class="opacity-50 my-4" />

            <div class="mt-1 px-3 bg-white rounded-lg">
            <p class="text-xs font-medium text-sourdine mb-3">Montants de commissions</p>
						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
                <label for="kCrINT" class="block text-xs font-semibold mb-1 text-encre">Commission intérieure</label>
                <input type="number" id="kCrINT" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" /></div>
							<div class="mb-3">
                <label for="kCrEXT" class="block text-xs font-semibold mb-1 text-encre">Commission extérieure</label>
                <input type="number" id="kCrEXT" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" /></div>
							<div class="mb-3">
                <label for="kCrBAL" class="block text-xs font-semibold mb-1 text-encre">Commission balcon</label>
                <input type="number" id="kCrBAL" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" /></div>
							<div class="mb-3">
                <label for="kCrSUI" class="block text-xs font-semibold mb-1 text-encre">Commission suite</label>
                <input type="number" id="kCrSUI" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg text-encre mono text-sm bg-gray-100" /></div>
						  </div>
            </div>

            <hr class="opacity-50 my-4" />

						<div class="mt-1 px-3 bg-white rounded-lg">
							<p class="text-xs font-medium text-sourdine mb-3">Cabines exemples pour la soumission client</p>
							<div class="grid grid-cols-2 gap-3">
								<div class="mb-3">
                  <label for="pCabInt" class="block text-xs font-semibold mb-1 text-encre">Cabine intérieure</label>
                  <input type="text" id="pCabInt" placeholder="Ex. : 9105" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" /></div>
								<div class="mb-3">
                  <label for="pCabExt" class="block text-xs font-semibold mb-1 text-encre">Cabine extérieure</label>
                  <input type="text" id="pCabExt" placeholder="Ex. : 8114" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" /></div>
								<div class="mb-3">
                  <label for="pCabBal" class="block text-xs font-semibold mb-1 text-encre">Cabine balcon</label>
                  <input type="text" id="pCabBal" placeholder="Ex. : 11208" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" /></div>
								<div class="mb-3">
                  <label for="pCabSui" class="block text-xs font-semibold mb-1 text-encre">Cabine suite</label>
                  <input type="text" id="pCabSui" placeholder="Ex. : 8113" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" /></div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- ═══ PAGE VOLS ═══ -->
			<section id="page-vols" class="page hidden">

				<div class="">
					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Vols</h2>
						<p class="text-xs text-sourdine mb-3.5">Coûts et détails de l'itinéraire</p>

						<div class="mb-3">
							<label for="pVols" class="block text-xs font-semibold mb-1 text-encre">Détails des vols</label>
							<textarea id="pVols" rows="3" placeholder="Ex. : AC1234 YUL->MIA 08h45, retour AC1235 MIA->YUL 17h30" class="bg-gray-100 w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre text-sm resize-y leading-relaxed"></textarea>
						</div>

						<div class="mb-3">
							<label for="vols" class="block text-xs font-semibold mb-1 text-encre">Coûts des vols</label>
							<div class="relative">
								<input type="number" id="vols" min="0" step="0.01" class="shadow-inner w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
								<select id="volsMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer"><option value="pers">$/pers</option><option value="tot">$ total</option></select>
							</div>
						</div>

            <!-- FRANCHISE BAGGAGE ALLER -->
						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
                <label for="bagAller" class="block text-xs font-semibold mb-1 text-encre">Bagages aller</label>
                <div class="relative">
                  <input type="number" id="bagAller" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                  <select id="bagAllerMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                    <option value="pers">$/pers</option>
                    <option value="tot">$ total</option>
                  </select>
                </div>
            </div>

            <!-- FRANCHISE BAGGAGE RETOUR -->
						<div class="mb-3">
              <label for="bagRetour" class="block text-xs font-semibold mb-1 text-encre">Bagages retour</label>
              <div class="relative">
                <input type="number" id="bagRetour" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                <select id="bagRetourMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                  <option value="pers">$/pers</option>
                  <option value="tot">$ total</option>
                </select>
              </div>
            </div>
					</div>
            
           <div>
						 <h2 class="font-display font-semibold text-lg text-marine mb-1">Commissions vols</h2>
						 <p class="text-xs text-sourdine mb-3.5">Ajustement global facultatif sur le segment vols</p>
						 <div class="mb-3">
               <label for="kVols" class="block text-xs font-semibold mb-1 text-encre">Ajustement vols</label>
               <input type="number" id="kVols" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
						 </div>
           </div>
          </div>
				</div>
			</section>

			<!-- ═══ PAGE HOTEL ═══ -->
			<section id="page-hotel" class="page hidden">
				<div class="grid md:grid-cols-2 gap-5">
					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Hôtel</h2>
						<p class="text-xs text-sourdine mb-3.5">Séjour pré/post et coûts par nuit</p>

            <!--  SECTION HÔTEL PRÉ-CROISIÈRE -->
						<div class="mb-3">
							<label class="flex items-center gap-2.5 px-3 py-2.5 border border-ligne rounded-lg cursor-pointer text-sm font-medium bg-white">
								<input type="checkbox" id="hasPre" class="w-4 h-4 cursor-pointer" checked />
								Ajouter un séjour pré-croisière
							</label>
						</div>
						<div class="grid grid-cols-2 gap-3" id="nuitsHotelWrap">
							<div class="mb-3">
                <label for="nuitsHotel" class="block text-xs font-semibold mb-1 text-encre">
                  Nombre de nuits hôtel
                </label>
                <input type="number" id="nuitsHotel" min="0" step="1" value="1" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
              </div>

							<div class="mb-3" id="hotelPreWrap">
                <label for="hotel" class="block text-xs font-semibold mb-1 text-encre">
                  Coût de l'hôtel (chambre/nuit)
                </label>
                <input type="number" id="hotel" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
              </div>
						</div>

            <!--  SECTION HÔTEL POST-CROISIÈRE -->
						<div class="mb-3 mt-3 border-t border-gray-300 pt-3">
							<label class="flex items-center gap-2.5 px-3 py-2.5 border border-ligne rounded-lg cursor-pointer text-sm font-medium bg-white">
								<input type="checkbox" id="hasPost" class="w-4 h-4 cursor-pointer" />
								Ajouter un hôtel post-croisière
							</label>
						</div>
						<div id="postFields" class="mt-3 pt-3 hidden">
							<div class="grid grid-cols-2 gap-3">
								<div class="mb-3">
                  <label for="nuitsHotelPost" class="block text-xs font-semibold mb-1 text-encre">
                    Nombre de nuits d'hôtel
                  </label>
                  <input type="number" id="nuitsHotelPost" min="0" step="1" value="1" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                </div>
								<div class="mb-3">
                  <label for="hotelPost" class="block text-xs font-semibold mb-1 text-encre">
                    Coût de l'hôtel (chambre/nuit)
                  </label>
                  <input type="number" id="hotelPost" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                </div>
							</div>
						</div>
					</div>

					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Infos hôtel et commissions</h2>

            <!--  SECTION HÔTEL PRÉ-CROISIÈRE -->
						<div class="">
							<div class="mb-3">
                <label for="pHotel" class="block text-xs font-semibold mb-1 text-encre">
                  Hôtel pré-croisière
                </label>
                <input type="text" id="pHotel" placeholder="Ex. : Hilton Miami Downtown" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
              </div>
						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3">
                <label for="pHotelDebut" class="block text-xs font-semibold mb-1 text-encre">
                  Date d'arrivée
                </label>
                <input type="date" id="pHotelDebut" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
              </div>
							<div class="mb-3">
                <label for="pHotelFin" class="block text-xs font-semibold mb-1 text-encre">
                  Date de départ
                </label>
                <input type="date" id="pHotelFin" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
              </div>
						</div>

            <!--  SECTION HÔTEL POST-CROISIÈRE -->
            <section id="postHotelFields" >
							<div class="mb-3">
                <label for="pHotelPost" class="block text-xs font-semibold mb-1 text-encre">
                  Hôtel post-croisière
                </label>
                <input type="text" id="pHotelPost" placeholder="Si applicable" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
              </div>
              <div class="grid grid-cols-2 gap-3">
							  <div class="mb-3">
                  <label for="pHotelPostDebut" class="block text-xs font-semibold mb-1 text-encre">
                    Date d'arrivée
                  </label>
                  <input type="date" id="pHotelPostDebut" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                </div>
							  <div class="mb-3">
                  <label for="pHotelPostFin" class="block text-xs font-semibold mb-1 text-encre">
                    Date de départ
                  </label>
                  <input type="date" id="pHotelPostFin" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                </div>
						</div>
            </section>
						</div>

            <!--  COMMISSIONS HÔTEL(S) -->
						<div class="mb-3 mt-2">
							<label for="kHotel" class="block text-xs font-semibold mb-1 text-encre">
                Commission hôtel (pré + post)
              </label>
							<input type="number" id="kHotel" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
						</div>
					</div>
				</div>
			</section>

      
			<!-- ═══ PAGE TRANSFERTS ═══ -->
			<section id="page-transferts" class="page hidden">
				<div class="grid md:grid-cols-2 gap-5">
					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Transferts</h2>
						<p class="text-xs text-sourdine mb-3.5">Segments et couts par segment</p>

						<div class="mb-3">
							<label class="flex items-center gap-2.5 px-3 py-2.5 border border-ligne rounded-lg cursor-pointer text-sm font-medium bg-white">
								<input type="checkbox" id="hasTransferts" class="w-4 h-4 cursor-pointer" checked />
								Ajouter les transferts
							</label>
						</div>

						<div class="grid grid-cols-1 gap-3" id="transfertsFields">
							<div class="mb-3">
                <label for="trA" class="block text-xs font-semibold mb-1 text-encre">Aeroport -> Hotel</label>
                  <div class="relative">
                    <input type="number" id="trA" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                    <select id="trAMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                      <option value="pers">$/pers</option>
                      <option value="tot">$ total</option>
                    </select>
                  </div>
              </div>
							<div class="mb-3">
                <label for="trB" class="block text-xs font-semibold mb-1 text-encre">Hotel -> Port</label>
                <div class="relative">
                  <input type="number" id="trB" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                  <select id="trBMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                    <option value="pers">$/pers</option>
                    <option value="tot">$ total</option>
                  </select>
                </div>
              </div>
							<div class="mb-3">
                <label for="trC" class="block text-xs font-semibold mb-1 text-encre">Port -> Aeroport</label>
                <div class="relative">
                  <input type="number" id="trC" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                  <select id="trCMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                    <option value="pers">$/pers</option>
                    <option value="tot">$ total</option>
                  </select>
                </div>
              </div>
              <div id="postTransferts" class="hidden">
                <div class="mb-3">
                  <label for="trD" class="block text-xs font-semibold mb-1 text-encre">Port -> Hotel post</label>
                <div class="relative">
                  <input type="number" id="trD" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                  <select id="trDMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                    <option value="pers">$/pers</option>
                    <option value="tot">$ total</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label for="trE" class="block text-xs font-semibold mb-1 text-encre">Hotel post -> Aeroport</label>
                <div class="relative">
                  <input type="number" id="trE" min="0" step="0.01" class="w-full px-3 py-2.5 pr-20 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
                  <select id="trEMode" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 mono text-xs border border-ligne rounded-md bg-neige text-sourdine py-1 px-0.5 cursor-pointer">
                    <option value="pers">$/pers</option>
                    <option value="tot">$ total</option>
                  </select>
                </div>
              </div>
              </div>
						</div>
					</div>

					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">References transferts et commission</h2>
						<p class="text-xs text-sourdine mb-3.5">Compagnies utilisees et commission du segment</p>
						<div class="mb-3">
              <label for="pTrA" class="block text-xs font-semibold mb-1 text-encre">Compagnie - Aeroport -> Hotel</label>
              <input type="text" id="pTrA" placeholder="Ex. : SuperShuttle" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
            </div>
						<div class="mb-3">
              <label for="pTrB" class="block text-xs font-semibold mb-1 text-encre">Compagnie - Hotel -> Port</label>
              <input type="text" id="pTrB" placeholder="Ex. : Navette de l'hotel" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
            </div>
						<div class="mb-3">
              <label for="pTrC" class="block text-xs font-semibold mb-1 text-encre">Compagnie - Port -> Aeroport</label>
              <input type="text" id="pTrC" placeholder="Ex. : Transfert de la croisiere" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre text-sm" />
            </div>
						<div class="mb-3 mt-2">
              <label for="kTransferts" class="block text-xs font-semibold mb-1 text-encre">Commission transferts</label>
              <input type="number" id="kTransferts" min="0" step="0.01" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-gray-100 text-encre mono text-sm" />
            </div>
					</div>
				</div>
			</section>

			<!-- ═══ PAGE SOMMAIRE ═══ -->
			<section id="page-sommaire" class="page hidden">
				<div class="grid md:grid-cols-2 gap-5">
					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Depot et echeancier</h2>
						<p class="text-xs text-sourdine mb-3.5">Utilise dans le sommaire Excel et la soumission client</p>
						<div class="mb-3">
							<label for="pDepot" class="block text-xs font-semibold mb-1 text-encre">Depot requis (par personne)</label>
							<div class="relative">
								<input type="number" id="pDepot" min="0" step="0.01" class="w-full px-3 py-2.5 pr-11 border border-ligne rounded-lg bg-white text-encre mono text-sm" />
								<span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-sourdine mono pointer-events-none">$/pers</span>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="mb-3"><label for="pDepotDate" class="block text-xs font-semibold mb-1 text-encre">Date limite - depot</label><input type="date" id="pDepotDate" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" /></div>
							<div class="mb-3"><label for="pSoldeDate" class="block text-xs font-semibold mb-1 text-encre">Date limite - solde</label><input type="date" id="pSoldeDate" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" /></div>
						</div>
						<div class="mb-3 mt-2 border border-ligne rounded-lg bg-neige p-3">
							<div class="text-xs font-semibold text-encre mb-2">Cabines a afficher dans la soumission PDF</div>
							<div class="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-encre">
								<label class="flex items-center gap-2"><input type="checkbox" id="pdfCabInt" class="w-4 h-4" checked />Interieure</label>
								<label class="flex items-center gap-2"><input type="checkbox" id="pdfCabExt" class="w-4 h-4" checked />Exterieure</label>
								<label class="flex items-center gap-2"><input type="checkbox" id="pdfCabBal" class="w-4 h-4" checked />Balcon</label>
								<label class="flex items-center gap-2"><input type="checkbox" id="pdfCabSui" class="w-4 h-4" checked />Suite</label>
							</div>
						</div>
						<div class="mb-3 mt-3.5">
							<label for="pNotes" class="block text-xs font-semibold mb-1 text-encre">Notes intérieureernes (jamais incluses dans la soumission client)</label>
							<textarea id="pNotes" rows="5" placeholder="Ex. : Tarif vols valide 24 h. Client prefere pont superieur." class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre text-sm resize-y leading-relaxed"></textarea>
						</div>
					</div>

					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Validation finale</h2>
						<p class="text-xs text-sourdine mb-3.5">Valider le dossier puis exporter Excel/PDF</p>
						<div class="mt-2 flex items-center flex-wrap gap-2.5">
							<button id="calcGenerate" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce">Valider et preparer le forfait</button>
							<span id="calcGenerateMsg" class="text-sm font-semibold"></span>
						</div>
						<div class="mt-5 flex items-center flex-wrap gap-2.5">
							<button id="genExcel" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce">Sommaire Excel (interne)</button>
							<button id="genPDF" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine">Soumission client (PDF)</button>
							<span id="excelMsg" class="text-sm font-semibold ml-1"></span>
						</div>
					</div>
				</div>

				<div class="bg-white border border-ligne rounded-xl p-5 mt-5">
					<h2 class="font-display font-semibold text-lg text-marine mb-1">Inclusions pour la soumission PDF</h2>
					<p class="text-xs text-sourdine mb-3.5">Cochez les inclusions a afficher. Ajoutez un detail si necessaire: il apparaitra entre parentheses dans la soumission.</p>

					<div class="grid md:grid-cols-3 gap-5">
						<div class="border border-ligne rounded-lg p-3.5 bg-neige">
							<h3 class="text-sm font-semibold text-marine mb-2">Croisiere</h3>
							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisiereBoissons" class="inclusion-toggle w-4 h-4" data-detail="incCroisiereBoissonsDetailsWrap" />Forfait Boissons</label>
							<div id="incCroisiereBoissonsDetailsWrap" class="hidden mb-2"><input type="text" id="incCroisiereBoissonsDetails" placeholder="Ex. : Forfait premium" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisiereWifi" class="inclusion-toggle w-4 h-4" data-detail="incCroisiereWifiDetailsWrap" />Forfait Wifi</label>
							<div id="incCroisiereWifiDetailsWrap" class="hidden mb-2"><input type="text" id="incCroisiereWifiDetails" placeholder="Ex. : 150 minutes par personne" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisiereRestos" class="inclusion-toggle w-4 h-4" data-detail="incCroisiereRestosDetailsWrap" />Restaurants de Specialite</label>
							<div id="incCroisiereRestosDetailsWrap" class="hidden mb-2"><input type="text" id="incCroisiereRestosDetails" placeholder="Ex. : 2 soupers inclus" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisiereCreditBord" class="inclusion-toggle w-4 h-4" data-detail="incCroisiereCreditBordDetailsWrap" />Credit a bords</label>
							<div id="incCroisiereCreditBordDetailsWrap" class="hidden mb-2"><input type="text" id="incCroisiereCreditBordDetails" placeholder="Ex. : 100 $ par cabine" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisiereCreditExcursions" class="inclusion-toggle w-4 h-4" data-detail="incCroisiereCreditExcursionsDetailsWrap" />Credits Excursions</label>
							<div id="incCroisiereCreditExcursionsDetailsWrap" class="hidden mb-2"><input type="text" id="incCroisiereCreditExcursionsDetails" placeholder="Ex. : 50 $ par personne" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisierePourboires" class="inclusion-toggle w-4 h-4" data-detail="incCroisierePourboiresDetailsWrap" />Pourboires prepayes</label>
							<div id="incCroisierePourboiresDetailsWrap" class="hidden mb-2"><input type="text" id="incCroisierePourboiresDetails" placeholder="Ex. : Tous les pourboires a bord" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incCroisiereFraisAdminCredites" class="inclusion-toggle w-4 h-4" data-detail="incCroisiereFraisAdminCreditesDetailsWrap" />Frais administratifs credites</label>
							<div id="incCroisiereFraisAdminCreditesDetailsWrap" class="hidden"><input type="text" id="incCroisiereFraisAdminCreditesDetails" placeholder="Ex. : 150 $/pers credites" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>
						</div>

						<div class="border border-ligne rounded-lg p-3.5 bg-neige">
							<h3 class="text-sm font-semibold text-marine mb-2">Hotel</h3>
							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incHotelDejeuner" class="inclusion-toggle w-4 h-4" data-detail="incHotelDejeunerDetailsWrap" />Dejeuner inclus</label>
							<div id="incHotelDejeunerDetailsWrap" class="hidden mb-2"><input type="text" id="incHotelDejeunerDetails" placeholder="Ex. : Buffet quotidien" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incHotelToutInclus" class="inclusion-toggle w-4 h-4" data-detail="incHotelToutInclusDetailsWrap" />Formule tout-inclus</label>
							<div id="incHotelToutInclusDetailsWrap" class="hidden mb-2"><input type="text" id="incHotelToutInclusDetails" placeholder="Ex. : Repas et boissons" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incHotelNavette" class="inclusion-toggle w-4 h-4" data-detail="incHotelNavetteDetailsWrap" />Navette aeroportuaires</label>
							<div id="incHotelNavetteDetailsWrap" class="hidden mb-2"><input type="text" id="incHotelNavetteDetails" placeholder="Ex. : Aeroport <-> hotel" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incHotelBalcon" class="inclusion-toggle w-4 h-4" data-detail="incHotelBalconDetailsWrap" />Chambre avec balcon</label>
							<div id="incHotelBalconDetailsWrap" class="hidden mb-2"><input type="text" id="incHotelBalconDetails" placeholder="Ex. : Balcon prive" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incHotelVue" class="inclusion-toggle w-4 h-4" data-detail="incHotelVueDetailsWrap" />Chambre avec vue</label>
							<div id="incHotelVueDetailsWrap" class="hidden"><input type="text" id="incHotelVueDetails" placeholder="Ex. : Vue mer" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>
						</div>

						<div class="border border-ligne rounded-lg p-3.5 bg-neige">
							<h3 class="text-sm font-semibold text-marine mb-2">Vols</h3>
							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incVolsBagages" class="inclusion-toggle w-4 h-4" data-detail="incVolsBagagesDetailsWrap" />Bagages enregistres</label>
							<div id="incVolsBagagesDetailsWrap" class="hidden mb-2"><input type="text" id="incVolsBagagesDetails" placeholder="Ex. : 1 bagage de 23 kg" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>

							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incVolsSieges" class="inclusion-toggle w-4 h-4" data-detail="incVolsSiegesDetailsWrap" />Choix de sieges</label>
							<div id="incVolsSiegesDetailsWrap" class="hidden"><input type="text" id="incVolsSiegesDetails" placeholder="Ex. : Siege standard inclus" class="w-full px-3 py-2 border border-ligne rounded-lg bg-white text-encre text-sm" /></div>
						</div>

						<div class="border border-ligne rounded-lg p-3.5 bg-neige">
							<h3 class="text-sm font-semibold text-marine mb-2">Transferts</h3>
							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incTransfAeroHotel" class="inclusion-toggle w-4 h-4" />Transfert Aeroport -> Hotel</label>
							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incTransfHotelPort" class="inclusion-toggle w-4 h-4" />Transfert Hotel -> Port</label>
							<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incTransfPortAero" class="inclusion-toggle w-4 h-4" />Transfert Port -> Aeroport</label>
							<div id="incTransfPostGroup" class="hidden pt-2 mt-2 border-t border-dashed border-ligne">
								<label class="flex items-center gap-2 text-sm mb-2"><input type="checkbox" id="incTransfPortHotelPost" class="inclusion-toggle w-4 h-4" />Transfert Port -> Hotel</label>
								<label class="flex items-center gap-2 text-sm"><input type="checkbox" id="incTransfHotelPostAero" class="inclusion-toggle w-4 h-4" />Transfert Hotel -> Aeroport</label>
							</div>
						</div>
					</div>
				</div>

				<h2 class="font-display font-semibold text-xl text-marine mt-8 mb-1" id="calcStep4">Prix client par categorie</h2>
				<p class="text-xs text-sourdine mb-4" id="resultsSub"></p>
				<div class="grid md:grid-cols-2 gap-5" id="tickets"></div>

				<h2 class="font-display font-semibold text-xl text-marine mt-8 mb-1">Revenus estimes par categorie</h2>
				<p class="text-xs text-sourdine mb-4">Commissions + markup vols recupere + frais administratifs + coussin d'arrondi.</p>
				<div class="grid md:grid-cols-2 gap-5" id="commTickets"></div>
			</section>

			<!-- ═══ PAGE DOSSIERS ═══ -->
			<section id="page-doss" class="page hidden">
				<div class="bg-white border border-ligne rounded-xl p-5 shadow-md">
					<h2 class="font-display font-semibold text-lg text-marine mb-1">Projets</h2>
					<p class="text-xs text-sourdine mb-3.5">Sauvegardez la soumission complète pour la rouvrir plus tard</p>

          <!-- LEGACY CODE HIDDEN -->
          <div class="mb-3">
							<label for="pTitre" class="block text-xs font-semibold mb-1 text-encre">Titre du projet</label>
							<input type="text" id="pTitre" placeholder="Ex. : Caraibes - Famille Tremblay, mars 2027" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre text-sm" />
						</div>
          <!-- END OF LEGACY CODE HIDDEN -->

					<div class="mb-3 hidden">
						<label for="dossierNom" class="block text-xs font-semibold mb-1 text-encre">Nom du projet</label>
						<input type="text" id="dossierNom" placeholder="Ex. : Tremblay - Caraibes mars 2027" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre text-sm" />
					</div>

					<button id="saveDossier" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce mt-1.5 mr-1.5">Enregistrer le projet</button>

					<button id="newDossier" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine mt-1.5">Nouveau projet (tout vider)</button>

					<span id="dossMsg" class="text-sm font-semibold ml-3"></span>

					<div class="mt-3">
						<button id="exportCsv" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine mt-1.5 mr-1.5">Exporter</button>

						<button id="importCsv" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine mt-1.5">Importer</button>
						<input type="file" id="importCsvFile" accept=".csv,text/csv" class="hidden" />
					</div>
					<div class="text-xs text-sourdine mt-3" id="autosaveInfo">Sauvegarde automatique : en attente de modifications...</div>
				</div>

				<h2 class="font-display font-semibold text-xl text-marine mt-8 mb-1">Projets enregistrés</h2>
				<div id="dossierList" class="mt-4"></div>
			</section>

			<!-- ═══ PAGE PARAMETRES ═══ -->
			<section id="page-const" class="page hidden">
				<div class="grid md:grid-cols-2 gap-5">
					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Base de donnees</h2>
						<p class="text-xs text-sourdine mb-3.5">Vos donnees vivent dans un fichier .sqlite sur votre disque</p>
						<div class="mono text-xs text-encre bg-neige border border-ligne rounded-lg px-3 py-2.5 mb-3.5 leading-relaxed" id="dbStatus"></div>
						<div class="mb-2">
							<button id="dbResume" class="appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce mr-1.5 hidden">Reprendre ma base</button>
							<button id="dbOpen2" class="appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine mr-1.5">Connecter une base...</button>
							<button id="dbCreate2" class="appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine">Creer une nouvelle base...</button>
						</div>
						<div class="mb-2">
							<button id="exportSqlite" class="appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine mr-1.5">Exporter une copie (.sqlite)</button>
							<button id="importSqlite" class="appearance-none cursor-pointer font-semibold text-xs px-3.5 py-1.5 rounded-lg border bg-white text-marine border-ligne hover-border-marine">Importer / fusionner (.sqlite)</button>
							<input type="file" id="importSqliteFile" accept=".sqlite,.db,.sqlite3,application/x-sqlite3,application/octet-stream" class="hidden" />
						</div>
						<span id="dbMsg" class="text-sm font-semibold"></span>
					</div>

					<div class="bg-white border border-ligne rounded-xl p-5">
						<h2 class="font-display font-semibold text-lg text-marine mb-1">Constantes de calcul</h2>
						<p class="text-xs text-sourdine mb-3.5">Ces valeurs sont sauvegardees et reutilisees a chaque ouverture</p>

						<div class="mb-3"><label for="cAdmin" class="block text-xs font-semibold mb-1 text-encre">Frais administratifs (par passager)</label><input type="number" id="cAdmin" min="0" step="0.01" value="150" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" /></div>
						<div class="mb-3"><label for="cVols" class="block text-xs font-semibold mb-1 text-encre">Frais de service sur les vols (%)</label><input type="number" id="cVols" min="0" step="0.1" value="10" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" /></div>
						<div class="mb-3"><label for="cMarkup" class="block text-xs font-semibold mb-1 text-encre">Markup maximum sur la nuitee d'hotel (%)</label><input type="number" id="cMarkup" min="0" step="0.1" value="30" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" /></div>
						<div class="mb-3"><label for="cPourboires" class="block text-xs font-semibold mb-1 text-encre">Pourboires prepayes (par nuit, par personne)</label><input type="number" id="cPourboires" min="0" step="0.01" value="25" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm" /></div>
						<div class="mb-3"><label for="cArrondi" class="block text-xs font-semibold mb-1 text-encre">Arrondi prix par personne</label><select id="cArrondi" class="w-full px-3 py-2.5 border border-ligne rounded-lg bg-white text-encre mono text-sm"><option value="0">Aucun arrondi</option><option value="5">Au 5 $ superieur</option><option value="10">Au 10 $ superieur</option><option value="25">Au 25 $ superieur</option><option value="50">Au 50 $ superieur</option></select></div>
						<button id="saveConst" class="appearance-none cursor-pointer font-semibold text-sm px-6 py-2.5 rounded-lg border bg-lagon border-lagon text-white hover-lagon-fonce">Enregistrer les constantes</button>
						<span id="saveMsg" class="text-sm font-semibold ml-3"></span>
					</div>
				</div>
			</section>
		</main>
`;
})();
