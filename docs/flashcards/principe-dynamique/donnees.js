/* Relecture des flashcards de l'application « Chapitre 6 : Principe fondamental de la dynamique » (principe-dynamique)
   Tour 1 (compétences) : un paquet par cours ou sous-module de cours (le module 5, exercices, n'a pas de cours : pas de paquet).
   Retours de l'enseignant : retirées m1/c3, m1/c4, m1/c5, m1/c6, m2b/c1, m3d/c2, m3d/c4, m4a/c4 ; prérequis inchangés
   (chaque paquet après son cours).
   Tour 2 (cartes) : une carte par compétence gardée.
   Tour 3 : 18 cartes validées ; supprimées pfd-2b-diagramme, pfd-2c-frottements, pfd-2d-masse, pfd-2e-R, pfd-2e-RN,
   pfd-2f-deux, pfd-2f-bilan, pfd-3b-derivee, pfd-4a-resultante (leurs compétences sont retirées de la liste ;
   le paquet m2b n'a plus de carte) ; 12 cartes modifiées ; 6 cartes demandées par l'enseignant (pfd-1-deuxmots,
   pfd-2e-reaction, pfd-2e-sansfrottement, pfd-2f-resultante, pfd-2f-voiture, pfd-2f-livre).
   Préfixe des identifiants de cartes : pfd- (voir docs/flashcards/prompt-generation.md). */
(function () {
  /* ---------- Écriture (charte §7) ---------- */
  const MS2 = 'm·s<sup>−2</sup>';
  const UNITES = '<small>Unités de chaque grandeur</small>';
  const formule = s => `<p class="rev-formule">${s}</p>`;
  const unites = s => `<p class="rev-unites">${s}</p>`;
  const fig = s => `<div class="rev-fig">${s}</div>`;
  // nom de vecteur surmonté d'une flèche (styles en ligne : la page Révisions ne charge pas les styles de l'application)
  const V = (l, i) => `<span style="white-space:nowrap"><span style="position:relative;display:inline-block;padding-top:.42em;line-height:1">${l}` +
    `<span style="position:absolute;left:0;right:0;top:-.12em;text-align:center;font-size:.62em;font-weight:700;line-height:1" aria-hidden="true">→</span></span>${i ? `<sub>${i}</sub>` : ''}</span>`;
  const SF = `Σ ${V('F')}`, SFext = `Σ ${V('F')}<sub>ext</sub>`, NUL = V('0');
  // fraction (styles en ligne)
  const fr = (n, d) => `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;line-height:1.15">` +
    `<span style="border-bottom:.08em solid currentColor;padding:0 .2em">${n}</span><span style="padding:0 .2em">${d}</span></span>`;
  const quoi = s => `<p>Données : ${s}. Que peux-tu calculer ? Avec quelle formule ?</p>`;

  /* ---------- Figures (SVG autonomes : attributs de présentation) ---------- */
  const ENC = '#16181d', ENC2 = '#55585f', PAP3 = '#dfdbd2', ACC = '#5a3fc4', F1C = '#d9480f', F2C = '#1971c2';
  // chronophotographie de l'application (PFD.chrono, curviligne décéléré), styles recopiés
  const CHRONO = '<svg viewBox="0 0 360 150" width="360" height="150" role="img" aria-label="Chronophotographie : positions successives à intervalles de temps égaux"><polyline points="20.0,118.0 23.8,111.2 27.5,104.8 31.3,98.9 35.1,93.4 39.0,88.3 42.8,83.7 46.7,79.4 50.6,75.5 54.5,72.0 58.4,68.9 62.3,66.0 66.2,63.6 70.2,61.4 74.1,59.6 78.1,58.1 82.1,56.8 86.1,55.8 90.1,55.1 94.1,54.7 98.1,54.5 102.2,54.5 106.2,54.7 110.3,55.1 114.3,55.8 118.4,56.6 122.5,57.6 126.5,58.7 130.6,60.0 134.7,61.4 138.8,62.9 142.9,64.6 147.0,66.3 151.2,68.1 155.3,70.0 159.4,72.0 163.5,74.0 167.6,76.0 171.8,78.1 175.9,80.2 180.0,82.3 184.1,84.3 188.2,86.4 192.4,88.4 196.5,90.4 200.6,92.3 204.7,94.1 208.8,95.9 213.0,97.6 217.1,99.1 221.2,100.6 225.3,101.9 229.4,103.0 233.5,104.1 237.5,104.9 241.6,105.6 245.7,106.1 249.7,106.4 253.8,106.4 257.8,106.3 261.9,105.9 265.9,105.3 269.9,104.4 273.9,103.2 277.9,101.7 281.9,100.0 285.9,97.9 289.8,95.5 293.8,92.8 297.7,89.8 301.6,86.4 305.5,82.6 309.4,78.4 313.3,73.9 317.2,68.9 321.0,63.5 324.9,57.7 328.7,51.5 332.5,44.8 336.2,37.6 340.0,30.0" fill="none" stroke="#dfdbd2" stroke-width="2" stroke-dasharray="3, 5" stroke-linecap="round"/><text x="20.0" y="138.0" text-anchor="start" fill="#55585f" font-size="11" font-weight="700">départ</text><circle cx="20.0" cy="118.0" r="5" fill="#5a3fc4"/><circle cx="75.4" cy="59.1" r="5" fill="#5a3fc4"/><circle cx="146.0" cy="65.8" r="5" fill="#5a3fc4"/><circle cx="202.8" cy="93.3" r="5" fill="#5a3fc4"/><circle cx="254.1" cy="106.4" r="5" fill="#5a3fc4"/><circle cx="294.6" cy="92.2" r="5" fill="#5a3fc4"/><circle cx="318.1" cy="67.7" r="5" fill="#5a3fc4"/><circle cx="331.1" cy="47.3" r="5" fill="#5a3fc4"/><circle cx="337.9" cy="34.4" r="5" fill="#5a3fc4"/><circle cx="340.0" cy="30.0" r="5" fill="#5a3fc4"/></svg>';
  const chrono = notes => CHRONO.replace('</svg>', (notes ?
    `<text x="52" y="108" fill="${ACC}" font-size="12" font-weight="700">grands écarts</text>` +
    `<text x="322" y="24" text-anchor="end" fill="${ACC}" font-size="12" font-weight="700">petits écarts</text>` : '') + '</svg>');
  /* dessins de l'application (PFD.scene, PFD.sceneRemplie), styles recopiés :
     livre immobile sur un sol en pente (dessin de la brique sur la planche inclinée), sans puis avec ses forces ;
     réaction du sol sur le livre (R⃗N, f⃗ et leur somme R⃗) ;
     voiture qui démarre, sans puis avec ses forces (P⃗, R⃗N, F⃗m, f⃗, comme l'exercice 5) */
  const LIVRE_Q = '<svg viewBox="20 66 330 164" width="330" height="164" role="img" aria-label="Un livre immobile sur un sol en pente"><polygon points="30,80 330,219.9 30,219.9" fill="#ebe8e1" stroke="#55585f" stroke-width="1.5"/><polygon points="135.1,129 196.8,157.8 213.7,121.5 152,92.8" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><text x="50" y="214" fill="#55585f" font-size="11.5" font-weight="600">sol en pente</text></svg>';
  const LIVRE_R = '<svg viewBox="20 66 330 164" width="330" height="164" role="img" aria-label="Livre immobile sur un sol en pente : bilan des forces"><polygon points="30,80 330,219.9 30,219.9" fill="#ebe8e1" stroke="#55585f" stroke-width="1.5"/><polygon points="135.1,129 196.8,157.8 213.7,121.5 152,92.8" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><text x="50" y="214" fill="#55585f" font-size="11.5" font-weight="600">sol en pente</text><g><line x1="174.4" y1="125.3" x2="174.4" y2="172.3" stroke="#d9480f" stroke-width="3" stroke-linecap="round"/><path d="M174.4,183.3 L168.9,172.3 L179.9,172.3 Z" fill="#d9480f"/></g><g><text x="160.7" y="204.3" fill="#d9480f" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">P</text><path d="M161.7,189.3 H171.2 M168.2,186.7 L171.2,189.3 L168.2,191.9" fill="none" stroke="#d9480f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="165.9" y1="143.4" x2="183.5" y2="105.7" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/><path d="M188.1,95.7 L188.5,108.0 L178.5,103.4 Z" fill="#1971c2"/></g><g><text x="194.6" y="91.9" fill="#1971c2" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">R<tspan dy="4" font-size="10.5" fill="#1971c2" stroke="#ffffff">N</tspan></text><path d="M195.6,76.9 H205.1 M202.1,74.3 L205.1,76.9 L202.1,79.5" fill="none" stroke="#1971c2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="165.9" y1="143.4" x2="153.7" y2="137.7" stroke="#c2255c" stroke-width="3" stroke-linecap="round"/><path d="M143.7,133.0 L156.0,132.7 L151.3,142.7 Z" fill="#c2255c"/></g><g><text x="129.2" y="124.5" fill="#c2255c" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">f</text><path d="M130.2,109.5 H139.7 M136.7,106.9 L139.7,109.5 L136.7,112.1" fill="none" stroke="#c2255c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><circle cx="174.4" cy="125.3" r="4.5" fill="#ffffff" stroke="#16181d" stroke-width="2"/><text x="182.4" y="118.3" fill="#16181d" stroke="#ffffff" stroke-width="3" font-size="12.5" font-weight="800" paint-order="stroke">G</text><circle cx="165.9" cy="143.4" r="4.5" fill="#ffffff" stroke="#16181d" stroke-width="2"/><text x="173.9" y="136.4" fill="#16181d" stroke="#ffffff" stroke-width="3" font-size="12.5" font-weight="800" paint-order="stroke">A</text></svg>';
  const REACTION = '<svg viewBox="20 50 330 180" width="330" height="180" role="img" aria-label="Réaction du support sur un livre posé sur un sol en pente : RN perpendiculaire au support, f parallèle au support vers le haut de la pente, R leur somme"><polygon points="30,80 330,219.9 30,219.9" fill="#ebe8e1" stroke="#55585f" stroke-width="1.5"/><polygon points="135.1,129 196.8,157.8 213.7,121.5 152,92.8" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><text x="50" y="214" fill="#55585f" font-size="11.5" font-weight="600">sol en pente</text><g><line x1="165.9" y1="143.4" x2="183.5" y2="105.7" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/><path d="M188.1,95.7 L188.5,108.0 L178.5,103.4 Z" fill="#1971c2"/></g><g><text x="194.6" y="91.9" fill="#1971c2" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">R<tspan dy="4" font-size="10.5" fill="#1971c2" stroke="#ffffff">N</tspan></text><path d="M195.6,76.9 H205.1 M202.1,74.3 L205.1,76.9 L202.1,79.5" fill="none" stroke="#1971c2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="165.9" y1="143.4" x2="153.7" y2="137.7" stroke="#c2255c" stroke-width="3" stroke-linecap="round"/><path d="M143.7,133.0 L156.0,132.7 L151.3,142.7 Z" fill="#c2255c"/></g><g><text x="129.2" y="124.5" fill="#c2255c" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">f</text><path d="M130.2,109.5 H139.7 M136.7,106.9 L139.7,109.5 L136.7,112.1" fill="none" stroke="#c2255c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="165.9" y1="143.4" x2="165.9" y2="96.4" stroke="#5a3fc4" stroke-width="3" stroke-linecap="round"/><path d="M165.9,85.4 L171.4,96.4 L160.4,96.4 Z" fill="#5a3fc4"/></g><g><text x="170.2" y="76.4" fill="#5a3fc4" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">R</text><path d="M171.2,61.4 H180.7 M177.7,58.8 L180.7,61.4 L177.7,64.0" fill="none" stroke="#5a3fc4" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
  const VOITURE_Q = '<svg viewBox="14 60 346 186" width="346" height="186" role="img" aria-label="Une voiture qui démarre vers la droite"><path d="M58,192 L58,160 Q60,150 74,148 L122,144 L146,120 Q151,115 161,115 L228,115 Q238,115 246,122 L270,145 L296,150 Q306,152 306,165 L306,192 Z" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><path d="M152,124 L194,124 L194,142 L134,142 Z M202,124 L236,124 L254,142 L202,142 Z" fill="#ffffff" stroke="#5a3fc4" stroke-width="1.2"/><circle cx="110" cy="192" r="18" fill="#55585f" stroke="#16181d" stroke-width="2"/><circle cx="250" cy="192" r="18" fill="#55585f" stroke="#16181d" stroke-width="2"/><line x1="20" y1="210" x2="340" y2="210" stroke="#16181d" stroke-width="2"/><line x1="30" y1="211" x2="22" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="42" y1="211" x2="34" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="54" y1="211" x2="46" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="66" y1="211" x2="58" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="78" y1="211" x2="70" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="90" y1="211" x2="82" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="102" y1="211" x2="94" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="114" y1="211" x2="106" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="126" y1="211" x2="118" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="138" y1="211" x2="130" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="150" y1="211" x2="142" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="162" y1="211" x2="154" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="174" y1="211" x2="166" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="186" y1="211" x2="178" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="198" y1="211" x2="190" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="210" y1="211" x2="202" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="222" y1="211" x2="214" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="234" y1="211" x2="226" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="246" y1="211" x2="238" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="258" y1="211" x2="250" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="270" y1="211" x2="262" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="282" y1="211" x2="274" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="294" y1="211" x2="286" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="306" y1="211" x2="298" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="318" y1="211" x2="310" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="330" y1="211" x2="322" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="140" y1="70" x2="222" y2="70" fill="none" stroke="#8d8f94" stroke-width="1.8" stroke-dasharray="5, 4"/><path d="M230,70 L221.0,74.0 L221.0,66.0 Z" fill="#8d8f94"/><text x="234" y="74" fill="#55585f" font-size="11.5" font-weight="600">démarre</text><text x="110" y="234" text-anchor="middle" fill="#55585f" font-size="11.5" font-weight="600">arrière</text><text x="250" y="234" text-anchor="middle" fill="#55585f" font-size="11.5" font-weight="600">avant</text></svg>';
  const VOITURE_R = '<svg viewBox="14 60 346 186" width="346" height="186" role="img" aria-label="Voiture au démarrage (traction avant) : bilan des forces"><path d="M58,192 L58,160 Q60,150 74,148 L122,144 L146,120 Q151,115 161,115 L228,115 Q238,115 246,122 L270,145 L296,150 Q306,152 306,165 L306,192 Z" fill="#ebe7f8" stroke="#5a3fc4" stroke-width="2"/><path d="M152,124 L194,124 L194,142 L134,142 Z M202,124 L236,124 L254,142 L202,142 Z" fill="#ffffff" stroke="#5a3fc4" stroke-width="1.2"/><circle cx="110" cy="192" r="18" fill="#55585f" stroke="#16181d" stroke-width="2"/><circle cx="250" cy="192" r="18" fill="#55585f" stroke="#16181d" stroke-width="2"/><line x1="20" y1="210" x2="340" y2="210" stroke="#16181d" stroke-width="2"/><line x1="30" y1="211" x2="22" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="42" y1="211" x2="34" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="54" y1="211" x2="46" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="66" y1="211" x2="58" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="78" y1="211" x2="70" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="90" y1="211" x2="82" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="102" y1="211" x2="94" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="114" y1="211" x2="106" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="126" y1="211" x2="118" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="138" y1="211" x2="130" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="150" y1="211" x2="142" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="162" y1="211" x2="154" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="174" y1="211" x2="166" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="186" y1="211" x2="178" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="198" y1="211" x2="190" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="210" y1="211" x2="202" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="222" y1="211" x2="214" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="234" y1="211" x2="226" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="246" y1="211" x2="238" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="258" y1="211" x2="250" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="270" y1="211" x2="262" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="282" y1="211" x2="274" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="294" y1="211" x2="286" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="306" y1="211" x2="298" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="318" y1="211" x2="310" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="330" y1="211" x2="322" y2="219" stroke="#8d8f94" stroke-width="1.2"/><line x1="140" y1="70" x2="222" y2="70" fill="none" stroke="#8d8f94" stroke-width="1.8" stroke-dasharray="5, 4"/><path d="M230,70 L221.0,74.0 L221.0,66.0 Z" fill="#8d8f94"/><text x="234" y="74" fill="#55585f" font-size="11.5" font-weight="600">démarre</text><text x="110" y="234" text-anchor="middle" fill="#55585f" font-size="11.5" font-weight="600">arrière</text><text x="250" y="234" text-anchor="middle" fill="#55585f" font-size="11.5" font-weight="600">avant</text><g><line x1="204.0" y1="150.0" x2="204.0" y2="185.0" stroke="#d9480f" stroke-width="3" stroke-linecap="round"/><path d="M204.0,196.0 L198.5,185.0 L209.5,185.0 Z" fill="#d9480f"/></g><g><text x="190.3" y="217.0" fill="#d9480f" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">P</text><path d="M191.3,202.0 H200.8 M197.8,199.4 L200.8,202.0 L197.8,204.6" fill="none" stroke="#d9480f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="250.0" y1="210.0" x2="250.0" y2="175.0" stroke="#1971c2" stroke-width="3" stroke-linecap="round"/><path d="M250.0,164.0 L255.5,175.0 L244.5,175.0 Z" fill="#1971c2"/></g><g><text x="250.9" y="155.0" fill="#1971c2" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">R<tspan dy="4" font-size="10.5" fill="#1971c2" stroke="#ffffff">N</tspan></text><path d="M251.9,140.0 H261.4 M258.4,137.4 L261.4,140.0 L258.4,142.6" fill="none" stroke="#1971c2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="250.0" y1="210.0" x2="291.0" y2="210.0" stroke="#b35c00" stroke-width="3" stroke-linecap="round"/><path d="M302.0,210.0 L291.0,215.5 L291.0,204.5 Z" fill="#b35c00"/></g><g><text x="308.9" y="225.0" fill="#b35c00" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">F<tspan dy="4" font-size="10.5" fill="#b35c00" stroke="#ffffff">m</tspan></text><path d="M309.9,210.0 H319.4 M316.4,207.4 L319.4,210.0 L316.4,212.6" fill="none" stroke="#b35c00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><g><line x1="204.0" y1="150.0" x2="185.0" y2="150.0" stroke="#c2255c" stroke-width="3" stroke-linecap="round"/><path d="M174.0,150.0 L185.0,144.5 L185.0,155.5 Z" fill="#c2255c"/></g><g><text x="154.3" y="147.0" fill="#c2255c" stroke="#ffffff" stroke-width="3" font-size="15" font-weight="800" paint-order="stroke">f</text><path d="M155.3,132.0 H164.8 M161.8,129.4 L164.8,132.0 L161.8,134.6" fill="none" stroke="#c2255c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><circle cx="204" cy="150" r="4.5" fill="#ffffff" stroke="#16181d" stroke-width="2"/><text x="212" y="143" fill="#16181d" stroke="#ffffff" stroke-width="3" font-size="12.5" font-weight="800" paint-order="stroke">G</text><circle cx="250" cy="210" r="4.5" fill="#ffffff" stroke="#16181d" stroke-width="2"/><text x="258" y="203" fill="#16181d" stroke="#ffffff" stroke-width="3" font-size="12.5" font-weight="800" paint-order="stroke">A</text></svg>';

  // flèche de (x1, y1) à (x2, y2)
  function fleche(x1, y1, x2, y2, c, ep) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 11, l = 5.5, ca = Math.cos(a), sa = Math.sin(a);
    const bx = x2 - L * ca, by = y2 - L * sa;
    return `<line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${c}" stroke-width="${ep || 3}" stroke-linecap="round"/>` +
      `<polygon points="${x2},${y2} ${(bx - l * sa).toFixed(1)},${(by + l * ca).toFixed(1)} ${(bx + l * sa).toFixed(1)},${(by - l * ca).toFixed(1)}" fill="${c}"/>`;
  }
  // nom de vecteur en SVG : lettre, indice, petite flèche au-dessus ; (x, y) : début, ligne de base
  function nomSVG(l, i, x, y, c) {
    const w = l.length * 9.5 + (i ? i.length * 6.6 : 0);
    return `<text x="${x}" y="${y}" fill="${c}" font-size="15" font-weight="800">${l}${i ? `<tspan dy="4" font-size="10.5">${i}</tspan>` : ''}</text>` +
      `<path d="M${x + 1},${y - 15} H${x + w} M${x + w - 3},${y - 17.6} L${x + w},${y - 15} L${x + w - 3},${y - 12.4}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  /* Quadrillage (1 carreau = 1 N) : F⃗₁ (3 carreaux vers la droite) et F⃗₂ (2 carreaux vers le haut) depuis G ;
     solution : rectangle en pointillés et Σ F⃗, sa diagonale */
  function resultante(solution) {
    const C = 30, G = [60, 110], P1 = [150, 110], P2 = [60, 50], S = [150, 50];
    let s = '';
    for (let x = 30; x <= 210; x += C) s += `<line x1="${x}" y1="20" x2="${x}" y2="140" stroke="${PAP3}" stroke-width="1"/>`;
    for (let y = 20; y <= 140; y += C) s += `<line x1="30" y1="${y}" x2="210" y2="${y}" stroke="${PAP3}" stroke-width="1"/>`;
    if (solution) s += `<path d="M${P1[0]},${P1[1]} L${S[0]},${S[1]} L${P2[0]},${P2[1]}" fill="none" stroke="${ENC2}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += fleche(G[0], G[1], P1[0], P1[1], F1C) + fleche(G[0], G[1], P2[0], P2[1], F2C);
    if (solution) s += fleche(G[0], G[1], S[0], S[1], ACC, 3.5) + `<text x="74" y="68" fill="${ACC}" font-size="15" font-weight="800">Σ</text>` + nomSVG('F', '', 87, 68, ACC);
    s += `<circle cx="${G[0]}" cy="${G[1]}" r="3.5" fill="${ENC}"/><text x="44" y="127" fill="${ENC}" font-size="13" font-weight="700">G</text>`;
    s += nomSVG('F', '1', 98, 132, F1C) + nomSVG('F', '2', 34, 86, F2C);
    const aria = solution
      ? 'Quadrillage, un carreau pour 1 N : F1, 3 carreaux vers la droite, et F2, 2 carreaux vers le haut, depuis G ; la résultante est la diagonale du rectangle, 3 carreaux à droite et 2 vers le haut'
      : 'Quadrillage, un carreau pour 1 N : F1, 3 carreaux vers la droite, et F2, 2 carreaux vers le haut, depuis le point G';
    return `<svg viewBox="20 10 200 140" width="200" height="140" role="img" aria-label="${aria}">${s}</svg>`;
  }

  RELECTURE({
    dossier: 'principe-dynamique', titre: 'Chapitre 6 : Principe fondamental de la dynamique', court: 'Chapitre 6', matiere: 'physique',
    tour: 3, etape: 'cartes',
    // pages de cours de l'application (prérequis possibles), plus l'atelier du module 2
    cours: [
      { cle: 'module_1_cours', nom: 'Cours (module 1)' },
      { cle: 'module_2a_cours', nom: 'Cours : forces à distance, forces de contact' },
      { cle: 'module_2b_cours', nom: 'Cours : méthode du diagramme objet-action' },
      { cle: 'module_2c_cours', nom: 'Cours : force de l\'air' },
      { cle: 'module_2d_cours', nom: 'Cours : poids' },
      { cle: 'module_2e_cours', nom: 'Cours : réaction du support' },
      { cle: 'module_2f_cours', nom: 'Cours : forces qui se compensent' },
      { cle: 'module_2_simulation', nom: 'Atelier : bilan des forces' },
      { cle: 'module_3a_cours', nom: 'Cours : définition de l\'accélération' },
      { cle: 'module_3b_cours', nom: 'Cours : dériver la vitesse' },
      { cle: 'module_3c_cours', nom: 'Cours : vitesse constante' },
      { cle: 'module_3d_cours', nom: 'Cours : accélération constante' },
      { cle: 'module_3e_cours', nom: 'Cours : accélération et forces' },
      { cle: 'module_4a_cours', nom: 'Cours : principe fondamental de la dynamique' },
      { cle: 'module_4b_cours', nom: 'Cours : principe d\'inertie' },
      { cle: 'module_4c_cours', nom: 'Cours : résultante des forces et accélération' },
      { cle: 'module_4d_cours', nom: 'Cours : méthode type' },
    ],
    paquets: [
      /* ---------- Module 1 · Référentiel et nature du mouvement ---------- */
      { id: 'm1', module: 1, titre: 'Référentiel et nature du mouvement', apres: ['module_1_cours'],
        competences: [
          { id: 'c1', texte: 'Définir le référentiel : solide de référence par rapport auquel on étudie le mouvement du système', types: ['definition'], source: 'fiche_1 · Référentiel ; À retenir' },
          { id: 'c2', texte: 'Choisir le référentiel adapté : terrestre (le plus souvent), géocentrique (satellites, Lune), héliocentrique (planètes)', types: ['savoir'], source: 'fiche_1 · Référentiel ; série 1 · « Quel référentiel est le plus adapté ? »' },
          { id: 'c7', texte: 'Décrire un mouvement en deux mots (trajectoire, puis vitesse) d\'après une chronophotographie', types: ['graphique'], source: 'fiche_1 · Décrire un mouvement ; série 1 ; exercice 7' },
          { id: 'c8', texte: 'Savoir qu\'un mouvement se décrit avec deux mots : la trajectoire (rectiligne, circulaire, curviligne), puis la vitesse (uniforme, accéléré, décéléré)', types: ['savoir'], source: 'demande de l\'enseignant (tour 2) ; fiche_1 · Décrire un mouvement en deux mots' },
        ],
        cartes: [
          { id: 'pfd-1-referentiel', type: 'definition', competence: 'c1', statut: 'modifiee', faces: [
            { q: '<p>Qu\'est-ce que le référentiel ?</p>',
              r: '<p>Le <b>solide de référence</b> par rapport auquel on étudie le mouvement du système.</p>' },
            { q: '<p>Comment s\'appelle le solide de référence par rapport auquel on étudie le mouvement du système ?</p>',
              r: '<p>Le <b>référentiel</b>.</p>' }] },
          { id: 'pfd-1-choix', type: 'savoir', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>Quel référentiel choisir pour étudier une voiture, un satellite, une planète ?</p>',
              r: '<ul><li>Voiture : <b>terrestre</b> (le sol ; le plus souvent).</li><li>Satellite, Lune : <b>géocentrique</b> (centre de la Terre).</li><li>Planète : <b>héliocentrique</b> (centre du Soleil).</li></ul>' }] },
          { id: 'pfd-1-deuxmots', type: 'savoir', competence: 'c8', statut: 'nouvelle', faces: [
            { q: '<p>Quels mots utilise-t-on pour décrire un mouvement ?</p>',
              r: '<p><b>Deux mots</b> : d\'abord la trajectoire, puis la vitesse.</p><ul><li>Trajectoire : <b>rectiligne</b>, <b>circulaire</b> ou <b>curviligne</b>.</li><li>Vitesse : <b>uniforme</b>, <b>accéléré</b> ou <b>décéléré</b> (ralenti).</li></ul><p>Exemple : rectiligne uniforme.</p>' }] },
          { id: 'pfd-1-chrono', type: 'graphique', competence: 'c7', statut: 'modifiee', faces: [
            { q: '<p>Décris ce mouvement.</p>' + fig(chrono(false)) + '<small>Positions à intervalles de temps égaux</small>',
              r: '<p>Mouvement <b>curviligne décéléré</b> (ou ralenti).</p><p>Trajectoire : une courbe quelconque. Positions de moins en moins espacées : la vitesse diminue.</p>' + fig(chrono(true)) }] },
        ] },

      /* ---------- Module 2 · Forces à distance, forces de contact ---------- */
      { id: 'm2a', module: 2, titre: 'Forces à distance, forces de contact', apres: ['module_2a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir une force à distance (les objets ne se touchent pas ; la flèche part du centre G)', types: ['definition'], source: 'cours 2a · étape 1 ; À retenir ; série 2 · « Point de départ »' },
          { id: 'c2', texte: 'Définir une force de contact (chaque objet qui touche le système, l\'air compris ; la flèche part du point de contact)', types: ['definition'], source: 'cours 2a · étape 2 ; À retenir ; série 2 · « À distance ou de contact ? »' },
          { id: 'c3', texte: 'Citer les trois seules forces à distance : poids P⃗ (toujours), force magnétique F⃗mag, force électrique F⃗élec', types: ['savoir'], source: 'cours 2a · Règle ; À retenir' },
        ],
        cartes: [
          { id: 'pfd-2a-distance', type: 'definition', competence: 'c1', statut: 'modifiee', faces: [
            { q: '<p>Qu\'est-ce qu\'une force à distance ? D\'où part sa flèche ?</p>',
              r: '<p>Une force exercée par un objet qui <b>ne touche pas</b> le système.</p><p>Sa flèche part du <b>centre G</b> du système. Diagramme objet-action : trait en pointillés.</p>' }] },
          { id: 'pfd-2a-contact', type: 'definition', competence: 'c2', statut: 'modifiee', faces: [
            { q: '<p>Qu\'est-ce qu\'une force de contact ? D\'où part sa flèche ?</p>',
              r: '<p>Une force exercée par un objet qui <b>touche</b> le système : support, fil, main, liquide… et <b>l\'air</b>, toujours.</p><p>Sa flèche part du <b>point de contact</b>. Diagramme objet-action : trait plein.</p>' }] },
          { id: 'pfd-2a-trois', type: 'savoir', competence: 'c3', statut: 'validee', faces: [
            { q: '<p>Quelles sont les trois seules forces à distance ? Qui les exerce ?</p>',
              r: `<ul><li>Le <b>poids</b> ${V('P')} : la Terre (toujours).</li><li>La <b>force magnétique</b> ${V('F', 'mag')} : un aimant.</li><li>La <b>force électrique</b> ${V('F', 'élec')} : un objet électrisé (frotté, chargé + ou −).</li></ul>` }] },
        ] },

      /* ---------- Module 2 · Méthode du diagramme objet-action (plus de carte : pfd-2b-diagramme supprimée) ---------- */
      { id: 'm2b', module: 2, titre: 'Méthode du diagramme objet-action', apres: ['module_2b_cours'],
        competences: [],
        cartes: [] },

      /* ---------- Module 2 · Force de l'air ---------- */
      { id: 'm2c', module: 2, titre: 'Force de l\'air', apres: ['module_2c_cours'],
        competences: [
          { id: 'c1', texte: 'Savoir quand on ne néglige pas la force de l\'air : frottements importants (grande vitesse, grande surface) ou poussée d\'Archimède importante (système très léger pour son volume)', types: ['savoir'], source: 'fiche_2 · La force de l\'air ; cours 2c · Règle' },
          { id: 'c2', texte: 'Définir la poussée d\'Archimède F⃗archi : force d\'un fluide (air, eau, huile…), verticale, vers le haut', types: ['definition'], source: 'fiche_2 · Poussée d\'Archimède ; cours 2c · Notation' },
        ],
        cartes: [
          { id: 'pfd-2c-air', type: 'savoir', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>Dans quels deux cas ne néglige-t-on pas la force de l\'air ?</p>',
              r: `<ul><li>Ses <b>frottements</b> comptent : grande vitesse, grande surface (parachute, voiture rapide) → ${V('F', 'air')}.</li><li>Sa <b>poussée d'Archimède</b> compte : système très léger pour son volume (montgolfière, ballon d'hélium) → ${V('F', 'archi')}.</li></ul>` }] },
          { id: 'pfd-2c-archi', type: 'definition', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>Qu\'est-ce que la poussée d\'Archimède ? Sa notation, sa direction et son sens ?</p>',
              r: `<p>La force exercée par un <b>fluide</b> (air, eau, huile…) sur le système : ${V('F', 'archi')}.</p><p><b>Verticale, vers le haut.</b></p>` },
            { q: '<p>Comment s\'appelle la force exercée par un fluide sur le système, verticale, vers le haut ? Sa notation ?</p>',
              r: `<p>La <b>poussée d'Archimède</b> ${V('F', 'archi')}.</p>` }] },
        ] },

      /* ---------- Module 2 · Poids ---------- */
      { id: 'm2d', module: 2, titre: 'Poids', apres: ['module_2d_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer le poids : P = m × g (P en N, m en kg, g en N/kg)', types: ['formule'], source: 'fiche_2 · Le poids ; À retenir' },
          { id: 'c3', texte: 'Définir le poids P⃗ : force exercée par la Terre, verticale, vers le bas, depuis le centre G ; dans tous les bilans', types: ['definition'], source: 'fiche_2 · Le poids ; cours 2d' },
          { id: 'c4', texte: 'Définir l\'intensité de la pesanteur g : 9,81 N/kg (10 N/kg si g n\'est pas donné)', types: ['definition'], source: 'fiche_2 · Le poids ; cours 2d' },
          { id: 'c5', texte: 'Réflexe : masse en g, la convertir en kg avant de calculer P', types: ['reflexe'], source: 'série 2 · diagnostic « Convertis la masse en kg » ; cours 2d · « Une masse en grammes »' },
        ],
        cartes: [
          { id: 'pfd-2d-poids', type: 'formule', competence: 'c1', statut: 'modifiee', faces: [
            { q: '<p>La formule qui donne le poids P ?</p>' + UNITES,
              r: formule('P = m × g') + unites('P en N · m en kg · g en N/kg') + '<p>g = 9,81 N/kg (10 N/kg si g n\'est pas donné).</p>' },
            { q: quoi('la masse m, en kg, d\'un système et l\'intensité de la pesanteur g, en N/kg'),
              r: '<p>Son <b>poids</b> P, en N :</p>' + formule('P = m × g') }] },
          { id: 'pfd-2d-def', type: 'definition', competence: 'c3', statut: 'modifiee', faces: [
            { q: `<p>Qu'est-ce que le poids ${V('P')} ? Sa direction, son sens, son point de départ ?</p>`,
              r: '<p>La force exercée <b>par la Terre</b> sur le système, à distance.</p><p><b>Vertical, vers le bas</b>, depuis le centre G. Il est dans tous les bilans.</p>' }] },
          { id: 'pfd-2d-g', type: 'definition', competence: 'c4', statut: 'modifiee', faces: [
            { q: '<p>Qu\'est-ce que g ? Sa valeur, son unité ?</p>',
              r: '<p>L\'<b>intensité de la pesanteur</b> : <b>g = 9,81 N/kg</b>.</p><p>Si g n\'est pas donné, on peut prendre 10 N/kg.</p>' }] },
          { id: 'pfd-2d-kg', type: 'reflexe', competence: 'c5', statut: 'modifiee', faces: [
            { q: '<p>La masse est en grammes et tu dois calculer P = m × g : que fais-tu avant de calculer ?</p>',
              r: '<p>Je <b>convertis la masse en kg</b> : je divise par 1 000.</p><p>Exemple : 400 g = 0,400 kg.</p>' }] },
        ] },

      /* ---------- Module 2 · Réaction du support ---------- */
      { id: 'm2e', module: 2, titre: 'Réaction du support', apres: ['module_2e_cours'],
        competences: [
          { id: 'c1', texte: 'Donner toutes les caractéristiques de la réaction du support : R⃗ = R⃗N + f⃗, avec un dessin', types: ['savoir'], source: 'demande de l\'enseignant (tour 2) ; fiche_2 · La réaction du support ; À retenir' },
          { id: 'c2', texte: 'Savoir que sans frottement, la réaction du support est normale (perpendiculaire) au support · deux sens', types: ['savoir'], source: 'demande de l\'enseignant (tour 2) ; cours 2e · Règle' },
          { id: 'c3', texte: 'Définir les frottements f⃗ : parallèles au support, opposés au glissement qu\'il y aurait sans eux', types: ['definition'], source: 'cours 2e · étape 2 ; fiche_2' },
        ],
        cartes: [
          { id: 'pfd-2e-reaction', type: 'savoir', competence: 'c1', statut: 'nouvelle', faces: [
            { q: '<p>Quelle est la force exercée par un support sur le système ? Donne toutes ses caractéristiques.</p>',
              r: fig(REACTION) + formule(`${V('R')} = ${V('R', 'N')} + ${V('f')}`) + `<ul><li>${V('R', 'N')} : <b>perpendiculaire</b> au support, depuis le point de contact.</li><li>${V('f')} : frottements, <b>parallèles</b> au support, opposés au glissement.</li></ul>` }] },
          { id: 'pfd-2e-sansfrottement', type: 'savoir', competence: 'c2', statut: 'nouvelle', faces: [
            { q: '<p>Comment est la réaction d\'un support quand il n\'y a pas de frottements ?</p>',
              r: `<p><b>Normale au support</b> (perpendiculaire) : ${V('R')} = ${V('R', 'N')}.</p><p>Elle part du point de contact.</p>` },
            { q: '<p>La réaction d\'un support est normale (perpendiculaire) au support. Que peux-tu dire des frottements ?</p>',
              r: `<p>Il n'y a <b>pas de frottements</b> : ${V('f')} = ${NUL}, donc ${V('R')} = ${V('R', 'N')}.</p>` }] },
          { id: 'pfd-2e-f', type: 'definition', competence: 'c3', statut: 'validee', faces: [
            { q: `<p>Que sont les frottements ${V('f')} d'un support ? Leur direction, leur sens ?</p>`,
              r: '<p>La partie de la réaction du support <b>parallèle au support</b>.</p><p>Ils sont <b>opposés au glissement</b> qu\'il y aurait sans eux.</p>' },
            { q: '<p>Comment s\'appelle la force du support parallèle au support, opposée au glissement ? Sa notation ?</p>',
              r: `<p>Les <b>frottements</b> ${V('f')}.</p>` }] },
        ] },

      /* ---------- Module 2 · Forces qui se compensent ---------- */
      { id: 'm2f', module: 2, titre: 'Forces qui se compensent', apres: ['module_2f_cours'],
        competences: [
          { id: 'c1', texte: 'Définir des forces qui se compensent : leur somme vectorielle est nulle, Σ F⃗ = 0⃗', types: ['definition'], source: 'fiche_2 · Forces qui se compensent ; À retenir' },
          { id: 'c4', texte: 'Définir la résultante des forces : la somme des forces', types: ['definition'], source: 'demande de l\'enseignant (tour 2) ; cours 2f · exemple du skieur' },
          { id: 'c5', texte: 'Dessiner les forces qui s\'exercent sur une voiture qui démarre : P⃗, R⃗N, F⃗m, f⃗ · crayon', types: ['schema'], source: 'demande de l\'enseignant (tour 2) ; exercice 5 ; situation « voiture au démarrage »' },
          { id: 'c6', texte: 'Dessiner les forces qui s\'exercent sur un livre immobile sur un sol en pente : P⃗, R⃗N, f⃗ ; R⃗ = R⃗N + f⃗ compense P⃗ · crayon', types: ['schema'], source: 'demande de l\'enseignant (tour 2) ; situation « brique immobile sur une planche inclinée »' },
        ],
        cartes: [
          { id: 'pfd-2f-compensent', type: 'definition', competence: 'c1', statut: 'modifiee', faces: [
            { q: '<p>Que veut dire « des forces se compensent » ?</p>',
              r: '<p>Leur <b>somme vectorielle est nulle</b> :</p>' + formule(`${SF} = ${NUL}`) + `<p>Exemple : palet d'air-hockey, ${V('R', 'N')} et ${V('P')}.</p>` }] },
          { id: 'pfd-2f-resultante', type: 'definition', competence: 'c4', statut: 'nouvelle', faces: [
            { q: '<p>Qu\'est-ce que la résultante des forces ?</p>',
              r: `<p>La <b>somme des forces</b> qui s'exercent sur le système : ${SF}.</p><p>Quand elle est nulle, les forces se compensent.</p>` }] },
          { id: 'pfd-2f-voiture', type: 'schema', competence: 'c5', statut: 'nouvelle', outils: ['crayon'], faces: [
            { q: '<p>Une voiture démarre vers la droite. Dessine les forces qui s\'exercent sur elle.</p>' + fig(VOITURE_Q),
              r: fig(VOITURE_R) + `<p>Poids ${V('P')} depuis G ; réaction normale ${V('R', 'N')} et force motrice ${V('F', 'm')} au contact roue-route ; frottements ${V('f')} vers l'arrière.</p>` }] },
          { id: 'pfd-2f-livre', type: 'schema', competence: 'c6', statut: 'nouvelle', outils: ['crayon'], faces: [
            { q: '<p>Un livre est immobile sur un sol en pente. Dessine les forces qui s\'exercent sur lui.</p>' + fig(LIVRE_Q),
              r: fig(LIVRE_R) + `<p>${V('P')} depuis G ; ${V('R', 'N')} et ${V('f')} depuis le point de contact A.</p><p>La réaction du sol ${V('R')} = ${V('R', 'N')} + ${V('f')} <b>compense</b> ${V('P')} : le livre reste immobile.</p>` }] },
        ] },

      /* ---------- Module 3 · Définition de l'accélération ---------- */
      { id: 'm3a', module: 3, titre: 'Définition de l\'accélération', apres: ['module_3a_cours'],
        competences: [
          { id: 'c1', texte: 'Définir l\'accélération : a = dv/dt, la dérivée de la vitesse par rapport au temps (variation de la vitesse au cours du temps), en m·s−2', types: ['definition'], source: 'fiche_3 · Définition (à connaître) ; À retenir' },
          { id: 'c2', texte: 'Choisir comment calculer a selon ce que l\'on connaît : v(t) → a = v′ ; vitesse constante → a = 0 ; vitesses de départ et d\'arrivée → a = Δv / Δt ; forces → a = Σ F / m', types: ['methode'], source: 'fiche_3 · Quatre façons ; cours 3a · À toi' },
        ],
        cartes: [
          { id: 'pfd-3a-acceleration', type: 'definition', competence: 'c1', statut: 'modifiee', faces: [
            { q: '<p>Qu\'est-ce que l\'accélération a ? Sa formule, son unité ?</p>',
              r: formule('a = ' + fr('dv', 'dt') + ' = v′') + `<p>La <b>dérivée de la vitesse</b> par rapport au temps : la variation de la vitesse au cours du temps, en <b>${MS2}</b>.</p>` }] },
          { id: 'pfd-3a-facons', type: 'methode', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>Comment calculer l\'accélération a selon ce que tu connais ?</p><small>Quatre cas</small>',
              r: '<ul><li>L\'expression de v(t) : <b>a = v′</b>.</li><li>Une vitesse constante : <b>a = 0</b>.</li><li>Une vitesse de départ et d\'arrivée : <b>a = Δv / Δt</b>.</li><li>Les forces et la masse : <b>a = Σ F / m</b>.</li></ul>' }] },
        ] },

      /* ---------- Module 3 · Dériver la vitesse ---------- */
      { id: 'm3b', module: 3, titre: 'Dériver la vitesse', apres: ['module_3b_cours'],
        competences: [
          { id: 'c2', texte: 'Exercice-type : v = k × t + v0 donne a = k (la dérivée d\'une constante est nulle)', types: ['methode'], source: 'fiche_3 · exemple v = 7,25 t ; série 3 · diagnostic « la dérivée d\'une constante est nulle » ; exercice 3' },
        ],
        cartes: [
          { id: 'pfd-3b-exemple', type: 'methode', competence: 'c2', statut: 'validee', faces: [
            { q: '<p>v = 7,25 t + 3 (v en m/s, t en s). Que vaut l\'accélération a ?</p><small>Démarche</small>',
              r: `<ol><li>a = v′ : on dérive v.</li><li>La dérivée de 7,25 t est 7,25.</li><li>La dérivée de la constante 3 est <b>nulle</b>.</li></ol><p><b>a = 7,25 ${MS2}</b>.</p>` }] },
        ] },

      /* ---------- Module 3 · Vitesse constante ---------- */
      { id: 'm3c', module: 3, titre: 'Vitesse constante', apres: ['module_3c_cours'],
        competences: [
          { id: 'c1', texte: 'Savoir qu\'une vitesse constante donne a = 0 (la vitesse ne varie pas) · deux sens', types: ['savoir'], source: 'fiche_3 · Vitesse constante ; À retenir' },
        ],
        cartes: [
          { id: 'pfd-3c-constante', type: 'savoir', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>La vitesse d\'un système est constante. Que vaut son accélération ? Pourquoi ?</p>',
              r: '<p><b>a = 0</b>.</p><p>La vitesse ne varie pas : la dérivée d\'une constante est nulle.</p>' },
            { q: '<p>L\'accélération d\'un système est nulle. Que peux-tu dire de sa vitesse ?</p>',
              r: '<p>Sa vitesse est <b>constante</b> : elle ne varie pas.</p>' }] },
        ] },

      /* ---------- Module 3 · Accélération constante ---------- */
      { id: 'm3d', module: 3, titre: 'Accélération constante', apres: ['module_3d_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer une accélération constante : a = Δv / Δt = (vfin − vdébut) / durée', types: ['formule'], source: 'fiche_3 · Accélération constante ; À retenir' },
          { id: 'c3', texte: 'Convertir une vitesse des km/h aux m/s (on divise par 3,6), et des m/s aux km/h (on multiplie par 3,6)', types: ['formule'], source: 'fiche_3 · km/h → m/s ; cours 3d · étape 2 ; demande de l\'enseignant (tour 2)' },
          { id: 'c5', texte: 'Interpréter un résultat négatif : le système ralentit ; pour la valeur de a, on garde le nombre positif', types: ['savoir'], source: 'fiche_3 ; séries 3 et 4 · diagnostic « Pour la valeur, garde le nombre positif »' },
        ],
        cartes: [
          { id: 'pfd-3d-formule', type: 'formule', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>La formule qui donne a à partir d\'une vitesse de départ et d\'une vitesse d\'arrivée ?</p>' + UNITES,
              r: formule('a = ' + fr('Δv', 'Δt') + ' = ' + fr('v<sub>fin</sub> − v<sub>début</sub>', 'durée')) + unites(`a en ${MS2} · v en m/s · Δt en s`) + '<p>L\'accélération est considérée constante.</p>' },
            { q: quoi('une vitesse de départ et une vitesse d\'arrivée, en m/s, et la durée Δt, en s, entre les deux'),
              r: `<p>L'<b>accélération</b> a (considérée constante), en ${MS2} :</p>` + formule('a = ' + fr('Δv', 'Δt')) }] },
          { id: 'pfd-3d-kmh', type: 'formule', competence: 'c3', statut: 'modifiee', faces: [
            { q: '<p>Comment convertir une vitesse des km/h aux m/s ?</p>',
              r: formule('v (m/s) = ' + fr('v (km/h)', '3,6')) + '<p>On <b>divise par 3,6</b>. Exemple : 100 km/h ≈ 27,8 m/s.</p>' },
            { q: '<p>Comment convertir une vitesse des m/s aux km/h ?</p>',
              r: formule('v (km/h) = v (m/s) × 3,6') + '<p>On <b>multiplie par 3,6</b>. Exemple : 27,8 m/s ≈ 100 km/h.</p>' }] },
          { id: 'pfd-3d-negatif', type: 'savoir', competence: 'c5', statut: 'validee', faces: [
            { q: '<p>Le calcul de Δv / Δt donne un nombre négatif. Que veut dire ce signe ? Quelle est la valeur de l\'accélération ?</p>',
              r: `<p>Le système <b>ralentit</b>.</p><p>Pour la <b>valeur</b> de l'accélération, on garde le <b>nombre positif</b> : Δv / Δt = −2 ${MS2} → a = 2 ${MS2}.</p>` }] },
        ] },

      /* ---------- Module 3 · Accélération et forces ---------- */
      { id: 'm3e', module: 3, titre: 'Accélération et forces', apres: ['module_3e_cours'],
        competences: [
          { id: 'c1', texte: 'Calculer a à partir des forces : a = Σ F / m (Σ F en N, m en kg, a en m·s−2)', types: ['formule'], source: 'fiche_3 · Accélération et forces ; À retenir ; série 4' },
        ],
        cartes: [
          { id: 'pfd-3e-formule', type: 'formule', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>La formule qui donne a en fonction de la résultante des forces Σ F et de la masse m ?</p>' + UNITES,
              r: formule('a = ' + fr('Σ F', 'm')) + unites(`a en ${MS2} · Σ F en N · m en kg`) },
            { q: quoi('la résultante des forces Σ F, en N, sur un système de masse m, en kg'),
              r: `<p>Son <b>accélération</b> a, en ${MS2} :</p>` + formule('a = ' + fr('Σ F', 'm')) }] },
        ] },

      /* ---------- Module 4 · Principe fondamental de la dynamique ---------- */
      { id: 'm4a', module: 4, titre: 'Principe fondamental de la dynamique', apres: ['module_4a_cours'],
        competences: [
          { id: 'c1', texte: 'Énoncer le principe fondamental de la dynamique : dans un référentiel galiléen, m a⃗ = Σ F⃗ext (m en kg, a en m·s−2, Σ F en N)', types: ['formule'], source: 'fiche_4 · Le principe fondamental ; À retenir' },
          { id: 'c3', texte: 'Calculer la résultante : Σ F = m × a', types: ['formule'], source: 'fiche_4 · Direction et valeur ; cours 4a · exemple ; série 4' },
        ],
        cartes: [
          { id: 'pfd-4a-pfd', type: 'formule', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>Énonce le principe fondamental de la dynamique. Dans quel référentiel s\'applique-t-il ?</p>' + UNITES,
              r: formule(`m ${V('a')} = ${SFext}`) + unites(`m en kg · a en ${MS2} · Σ F en N`) + '<p>Dans un <b>référentiel galiléen</b>.</p>' },
            { q: formule(`m ${V('a')} = ${SFext}`) + '<p>Comment s\'appelle cette loi ? Dans quel référentiel s\'applique-t-elle ?</p>',
              r: '<p>Le <b>principe fondamental de la dynamique</b>, dans un <b>référentiel galiléen</b>.</p>' }] },
          { id: 'pfd-4a-ma', type: 'formule', competence: 'c3', statut: 'validee', faces: [
            { q: '<p>La formule qui donne la valeur de la résultante des forces Σ F en fonction de m et de a ?</p>' + UNITES,
              r: formule('Σ F = m × a') + unites(`Σ F en N · m en kg · a en ${MS2}`) + `<p>Exemple : 1 200 kg × 2,0 ${MS2} = 2 400 N.</p>` },
            { q: quoi(`la masse m, en kg, d'un système et son accélération a, en ${MS2}`),
              r: '<p>La valeur de la <b>résultante des forces</b> Σ F, en N :</p>' + formule('Σ F = m × a') }] },
        ] },

      /* ---------- Module 4 · Principe d'inertie ---------- */
      { id: 'm4b', module: 4, titre: 'Principe d\'inertie', apres: ['module_4b_cours'],
        competences: [
          { id: 'c1', texte: 'Énoncer le principe d\'inertie : Σ F⃗ = 0⃗ ⇔ immobile ou mouvement rectiligne uniforme', types: ['definition'], source: 'fiche_4 · Le principe d\'inertie ; À retenir' },
          { id: 'c2', texte: 'Réflexe : un système en mouvement rectiligne uniforme (parachutiste à vitesse constante) : Σ F⃗ = 0⃗, les forces se compensent', types: ['reflexe'], source: 'série 4 · diagnostic « Mouvement rectiligne uniforme : Σ F = 0 » ; cours 4b · exemple ; exercice 19' },
        ],
        cartes: [
          { id: 'pfd-4b-inertie', type: 'definition', competence: 'c1', statut: 'validee', faces: [
            { q: '<p>Énonce le principe d\'inertie.</p>',
              r: `<p><b>${SF} = ${NUL}</b> ⇔ le système est <b>immobile</b> ou en <b>mouvement rectiligne uniforme</b> (a = 0).</p>` },
            { q: `<p>Comment s'appelle le principe : « ${SF} = ${NUL} ⇔ immobile ou mouvement rectiligne uniforme » ?</p>`,
              r: '<p>Le <b>principe d\'inertie</b>.</p>' }] },
          { id: 'pfd-4b-uniforme', type: 'reflexe', competence: 'c2', statut: 'validee', faces: [
            { q: `<p>Un parachutiste descend en ligne droite à vitesse constante. Que vaut ${SF} ? Que dis-tu des forces ?</p>`,
              r: `<p><b>${SF} = ${NUL}</b> : mouvement rectiligne uniforme (principe d'inertie).</p><p>Les forces <b>se compensent</b> : ${V('P')} + ${V('F', 'air')} = ${NUL}. Aucune force n'est nécessaire pour garder la vitesse.</p>` }] },
        ] },

      /* ---------- Module 4 · Résultante des forces et accélération ---------- */
      { id: 'm4c', module: 4, titre: 'Résultante des forces et accélération', apres: ['module_4c_cours'],
        competences: [
          { id: 'c1', texte: 'Savoir que a⃗ et Σ F⃗ ont la même direction et le même sens', types: ['savoir'], source: 'fiche_4 · Direction et valeur ; série 4 · « Direction de a » ; exercices 9, 10' },
          { id: 'c2', texte: 'Construire la résultante sans souci d\'échelle : forces opposées → on soustrait ; perpendiculaires → diagonale du rectangle · crayon', types: ['methode'], source: 'fiche_4 ; cours 4c · À toi ; exercices 9, 11' },
        ],
        cartes: [
          { id: 'pfd-4c-sens', type: 'savoir', competence: 'c1', statut: 'validee', faces: [
            { q: `<p>Que peux-tu dire de la direction et du sens de ${V('a')} et de ${SF} ?</p>`,
              r: `<p>${V('a')} et ${SF} ont <b>la même direction et le même sens</b>.</p><p>Une voiture qui freine : ${V('a')} et ${SF} sont opposés à la vitesse.</p>` }] },
          { id: 'pfd-4c-resultante', type: 'methode', competence: 'c2', statut: 'validee', outils: ['crayon'], faces: [
            { q: `<p>Construis la résultante ${SF} = ${V('F', '1')} + ${V('F', '2')}.</p>` + fig(resultante(false)) + '<small>1 carreau = 1 N</small>',
              r: fig(resultante(true)) + `<p>Forces <b>perpendiculaires</b> : ${SF} est la <b>diagonale du rectangle</b> (flèches bout à bout). Forces <b>opposées</b> : on soustrait.</p>` }] },
        ] },

      /* ---------- Module 4 · Méthode type ---------- */
      { id: 'm4d', module: 4, titre: 'Méthode type', apres: ['module_4d_cours'],
        competences: [
          { id: 'c1', texte: 'Projeter sur la direction du mouvement : m a = Fm − f, puis isoler l\'inconnue (Fm = m a + f ; f = Fm − m a)', types: ['formule'], source: 'fiche_4 · Méthode type ; cours 4d ; série 4 · diagnostic « N\'oublie pas les frottements »' },
          { id: 'c2', texte: 'Exercice-type : voiture de masse m, accélération a, frottements f : trouver la force motrice Fm (démarche : bilan, forces qui se compensent, Σ F, projection) · crayon et calculatrice', types: ['methode'], source: 'fiche_4 · exemple ; cours 4d · À toi ; exercices 1, 2, 5' },
        ],
        cartes: [
          { id: 'pfd-4d-projection', type: 'formule', competence: 'c1', statut: 'modifiee', faces: [
            { q: '<p>Une voiture démarre en ligne droite. D\'après le schéma, la relation qui donne m a sur la direction du mouvement ?</p>' + fig(VOITURE_R) + UNITES,
              r: formule('m a = F<sub>m</sub> − f') + unites(`m en kg · a en ${MS2} · F<sub>m</sub> et f en N`) + `<p>${V('P')} et ${V('R', 'N')} se compensent. Donc F<sub>m</sub> = m a + f et f = F<sub>m</sub> − m a.</p>` }] },
          { id: 'pfd-4d-type', type: 'methode', competence: 'c2', statut: 'validee', outils: ['crayon', 'calculatrice'], faces: [
            { q: `<p>Une voiture de 850 kg démarre avec a = 2,50 ${MS2}, frottements f = 250 N. Comment trouver la force motrice F<sub>m</sub> ?</p><small>Démarche</small>`,
              r: `<ol><li>Bilan des forces : ${V('P')}, ${V('R', 'N')}, ${V('F', 'm')}, ${V('f')}.</li><li>${V('P')} et ${V('R', 'N')} se compensent.</li><li>Il reste ${V('F', 'm')} et ${V('f')} : c'est ${SFext}.</li><li>Projection : m a = F<sub>m</sub> − f.</li><li>F<sub>m</sub> = m a + f ≈ 2,4 × 10<sup>3</sup> N.</li></ol>` }] },
        ] },
    ],
  });
})();
