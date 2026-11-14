/* ============================================================
   Fractions — installation de l'application sur un téléphone (PWA)
   ------------------------------------------------------------
   Rôle :
     - quand la page vient d'un site (http/https, pas file://) : ajoute le
       manifeste (manifest.webmanifest) et inscrit le service worker (sw.js,
       fonctionnement hors ligne) ;
     - sur l'accueil (FRA.installer(zone), appelé par FRA.accueil) : carte
       « Installer l'application » :
         Android / Chrome / Edge : bouton qui ouvre la fenêtre d'installation du navigateur ;
         iPhone / iPad (Safari) : la marche à suivre (Partager › Sur l'écran d'accueil) ;
       rien quand l'application est déjà installée (ouverte depuis son icône)
       ou que le navigateur ne sait pas l'installer.
   Stockage : fractions-college-installation { masque: true } quand l'élève a fermé la carte.
   Dépend de : fra.js (FRA). Chemins : la page est soit l'accueil, soit une page de modules/.
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA = window.FRA || {};
  const site = /^https?:$/.test(location.protocol);
  const racine = /\/modules\/[^/]*$/.test(location.pathname) ? '../' : './';
  const installee = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const CLE = 'fractions-college-installation';
  let invite = null;                 // événement « beforeinstallprompt » gardé pour le bouton
  const zones = [];

  if (site) {
    // manifeste ajouté ici (et non dans le HTML) : ouvert depuis l'ordinateur (file://), le navigateur refuserait de le lire
    const m = document.createElement('link');
    m.rel = 'manifest';
    m.href = racine + 'manifest.webmanifest';
    document.head.appendChild(m);
    if ('serviceWorker' in navigator) addEventListener('load', () => { navigator.serviceWorker.register(racine + 'sw.js', { scope: racine }).catch(() => { /* hors ligne ou refusé : l'application marche quand même */ }); });
  }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); invite = e; zones.forEach(dessiner); });
  addEventListener('appinstalled', () => { invite = null; zones.forEach(dessiner); });

  function masquee() { try { return !!(JSON.parse(localStorage.getItem(CLE)) || {}).masque; } catch (e) { return false; } }
  function dessiner(z) {
    z.innerHTML = '';
    z.hidden = true;
    if (!site || installee() || masquee() || (!invite && !ios)) return;
    z.hidden = false;
    const t = document.createElement('div');
    t.innerHTML = '<p><b>📲 Installer l’application</b></p><p class="fra-petit">' + (invite
      ? 'Ajoute « Fractions » à ton écran d’accueil : elle s’ouvre comme une application et marche même sans connexion.'
      : 'Sur iPhone ou iPad, dans Safari : touche le bouton <b>Partager</b> (le carré avec une flèche vers le haut), puis <b>Sur l’écran d’accueil</b>. L’application installée garde sa propre progression, séparée de celle de Safari.') + '</p>';
    z.appendChild(t);
    const a = document.createElement('div');
    a.className = 'fra-rangee';
    if (invite) {
      const b = FRA.bouton('btn-primary fra-pt', 'Installer', () => { const i = invite; invite = null; i.prompt(); i.userChoice.finally(() => zones.forEach(dessiner)); });
      a.appendChild(b);
    }
    a.appendChild(FRA.bouton('btn-small', 'Plus tard ✕', () => { try { localStorage.setItem(CLE, JSON.stringify({ masque: true })); } catch (e) { /* stockage indisponible */ } dessiner(z); }));
    z.appendChild(a);
  }
  // carte sur l'accueil de l'application
  FRA.installer = function (zone) {
    const z = document.createElement('div');
    z.className = 'fra-installer';
    zone.appendChild(z);
    zones.push(z);
    dessiner(z);
  };
})();
