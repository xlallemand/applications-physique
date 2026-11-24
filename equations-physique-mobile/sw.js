/* ============================================================
   Équations en physique (smartphone) — service worker de l'application installée (PWA)
   (même fonctionnement que sw.js de l'application Équations du 1er degré)
   ------------------------------------------------------------
   Rôle : l'application « Équations en physique » s'installe sur un téléphone (ou un
   ordinateur) et fonctionne sans réseau. Seule cette application est
   concernée : la portée (scope) est le dossier equations-physique-mobile/.
     - à l'installation : toutes les pages et ressources de l'application
       (y compris les fichiers communs de assets/) sont mises en cache ;
     - ensuite : chaque fichier est servi depuis le cache d'abord (rapide, hors ligne)
       puis mis à jour en arrière-plan quand le réseau est là (la nouvelle
       version s'affiche au lancement suivant) ; contrairement à l'application
       Orthographe (réseau d'abord), on n'attend jamais le réseau ;
     - police Google Fonts : gardée en cache au premier chargement ;
     - ne touche jamais à la progression de l'élève (localStorage).
   Inscrit par modules/sauvegarde.js, seulement quand la page est servie par un
   site (http ou https) : rien ne change quand on ouvre les fichiers
   depuis l'ordinateur (file://).
   À la modification de la liste FICHIERS (fichier ajouté ou renommé),
   changer VERSION pour que l'ancien cache soit remplacé.
   ============================================================ */
'use strict';
const VERSION = 'eqphys-v1.4';      // pas « equations-… » : le service worker d'Équations du 1er degré efface ces caches-là
const FICHIERS = [
  './', './index.html', './manifest.webmanifest',
  './modules/decouverte.html', './modules/seance.html', './modules/suivi.html', './modules/fiches.html',
  './modules/sauvegarde.js', './modules/tuiles.js', './modules/fiches.js', './modules/aide-rules.js', './modules/editeur.js',
  './modules/ecriture.js', './modules/equations.js', './modules/competences.js', './modules/epm.js', './modules/question.js',
  './modules/decouverte.js', './modules/seance.js', './modules/mes-succes.js',
  './modules/editeur.css', './modules/tuiles.css', './modules/fiches.css', './modules/epm.css',
  './icones/apple-touch-icon.png', './icones/favicon-32.png', './icones/icone-192.png', './icones/icone-512.png', './icones/icone-maskable-512.png',
  '../assets/theme.css', '../assets/sommaire.css', '../assets/sommaire.js', '../assets/hero.js', '../assets/dragdrop.js',
  '../assets/succes.js', '../assets/succes.css',
  '../equilibrer-reactions/modules/er.css'
];
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

// installation : tout est mis en cache d'un coup
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
// activation : les caches des versions précédentes sont supprimés
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k.startsWith('eqphys-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// réponse : le cache d'abord, mise à jour en arrière-plan
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  const local = url.origin === self.location.origin;
  if (!local && !POLICES.test(r.url)) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const cle = local ? url.origin + url.pathname : r;          // une page avec une ancre (#comp=…, #3) est la même page
    const enCache = await c.match(cle);
    const reseau = fetch(r).then(rep => {
      if (rep && (rep.ok || rep.type === 'opaque')) c.put(cle, rep.clone());
      return rep;
    }).catch(() => null);
    if (enCache) { e.waitUntil(reseau); return enCache; }
    const rep = await reseau;
    if (rep) return rep;
    // hors ligne, page jamais vue : l'accueil de l'application
    if (r.mode === 'navigate') { const a = await c.match(new URL('./index.html', self.location).href); if (a) return a; }
    return Response.error();
  }));
});
