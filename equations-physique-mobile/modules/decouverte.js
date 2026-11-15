/* ============================================================
   Équations en physique (smartphone) — module Découverte des méthodes (EPM.decouverte)
   ------------------------------------------------------------
   Les équations de EPM.DECOUVERTE (equations.js), toujours dans le même
   ordre : chacune fait travailler une seule règle nouvelle. Une équation
   par écran (adresse decouverte.html#3), avec :
     - la carte « La règle » de sa compétence (règle et calcul illustré) ;
     - l'équation dans son contexte physique, résolue dans l'éditeur à
       tuiles, avec les aides (indices, exemple, solution : EPM.Q) ;
     - « Équation suivante → » ; à la fin, le lien vers les séances.
   Rien n'est noté : chaque équation résolue est cochée (✓) et compte dans
   le suivi de sa compétence. La page est marquée faite quand tout est résolu.
   API : EPM.decouverte(zone)
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM, C = EPM.C;
  const el = EPM.el, bouton = EPM.bouton;
  const D = EPM.DECOUVERTE, N = D.length;

  function decouverte(zone) {
    // numéro de l'équation demandée (1 à N) ; sans numéro : la première pas encore résolue
    function numero() {
      const n = parseInt(location.hash.slice(1), 10);
      if (n >= 1 && n <= N) return n - 1;
      const f = EPM.decouverteFaits();
      for (let k = 0; k < N; k++) if (f.indexOf(k) < 0) return k;
      return 0;
    }
    function aller(k) {
      if (k < 0 || k >= N) return;
      if (location.hash !== '#' + (k + 1)) location.hash = '#' + (k + 1); else afficher(k);
    }

    function afficher(k) {
      const p = D[k], q = EPM.B.question(p.cle), comp = C.R[p.comp];
      const faits = EPM.decouverteFaits();
      zone.innerHTML = '';
      // en-tête : numéro, titre, niveau, progression, pastilles de toutes les équations
      const t = el('div', 'er-card pm-dec-tete');
      t.innerHTML = '<span class="er-badge">DÉCOUVERTE · ÉQUATION ' + (k + 1) + '/' + N + '</span>' +
        '<h2 class="er-titre">' + p.titre + '</h2>' +
        '<p class="pm-petit">' + (p.niveau ? '<span class="pm-tag pm-tag-niv">' + p.niveau + '</span> ' : '') + (faits.indexOf(k) >= 0 ? '<span class="pm-ok">✓ déjà faite</span> · ' : '') +
        faits.length + (faits.length > 1 ? ' équations faites' : ' équation faite') + ' sur ' + N + '</p>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + (100 * faits.length / N) + '%"></div></div>';
      const nav = el('nav', 'pm-dec-nav');
      nav.setAttribute('aria-label', 'Équations de la découverte');
      D.forEach((x, i) => {
        const a = el('a', 'pm-dec-pt' + (faits.indexOf(i) >= 0 ? ' fait' : '') + (i === k ? ' ici' : ''), faits.indexOf(i) >= 0 && i !== k ? '✓' : String(i + 1));
        a.href = '#' + (i + 1);
        a.setAttribute('aria-label', 'Équation ' + (i + 1) + ' : ' + x.titre.replace(/<[^>]+>/g, '') + (faits.indexOf(i) >= 0 ? ' (faite)' : ''));
        if (i === k) a.setAttribute('aria-current', 'page');
        nav.appendChild(a);
      });
      t.appendChild(nav);
      const fl = el('div', 'pm-rangee pm-entre pm-dec-fl');
      const pre = bouton('btn-small', '← Précédente', () => aller(k - 1));
      pre.disabled = k === 0;
      const sui = bouton('btn-small', 'Suivante →', () => aller(k + 1));
      sui.disabled = k === N - 1;
      fl.appendChild(pre); fl.appendChild(sui);
      t.appendChild(fl);
      zone.appendChild(t);
      // la règle de la compétence
      const r = el('div', 'er-card pm-regle');
      r.innerHTML = '<h3 class="cours-titre">La règle</h3><p>' + comp.regle + '</p>' + comp.illus +
        '<div class="cle"><b class="cle-titre">Méthode.</b> ' + comp.methode + '</div>' +
        '<p class="pm-petit"><a class="pm-lien-fiche" href="fiches.html#' + comp.id + '" target="_blank" rel="noopener">Fiche : ' + comp.titre + ' ↗</a></p>';
      zone.appendChild(r);
      EPM.monterCalc(r);
      // l'équation à résoudre
      const c = el('div', 'er-card pm-q');
      c.appendChild(el('p', 'er-q-nom', 'À toi'));
      zone.appendChild(c);
      EPM.Q.monter(c, q, {
        rappel: false,
        surFin: (pts, act) => {
          const f = EPM.marquerDecouverte(k);
          EPM.enregistrer([{ r: p.comp, ok: pts / 2 }], null);
          if (f.length >= N) SOM.marquer({ fait: true });
          if (k < N - 1) {
            const b = bouton('btn-primary', 'Équation suivante →', () => {
              zone.style.pointerEvents = 'none';
              setTimeout(() => { zone.style.pointerEvents = ''; }, 350);
              aller(k + 1);
            });
            act.appendChild(b);
          } else {
            const a = el('a', 'btn-primary', 'S’entraîner : séance de résolution →');
            a.href = 'seance.html';
            act.appendChild(a);
            act.appendChild(el('p', 'pm-petit pm-fin-dec', f.length >= N ? 'Tu as fait toute la découverte : entraîne-toi maintenant avec les séances, l’application choisit ce que tu dois travailler.'
              : 'Il te reste des équations à résoudre : les pastilles sans ✓, en haut de la page.'));
          }
          act.appendChild(bouton('btn-small', '↺ Refaire cette équation', () => afficher(k)));
        },
      });
    }

    addEventListener('hashchange', () => { afficher(numero()); EPM.versVue(zone.firstChild, 'start'); });
    afficher(numero());
  }

  EPM.decouverte = decouverte;
})();
