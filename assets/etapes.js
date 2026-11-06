/* ============================================================
   ETAPES : moteur de gestes à faire dans l'ordre (sans dessin)
   Sert aux montages électriques (assets/montage.js) et aux gestes
   de laboratoire (dissolution, dilution, tests, synthèse…).

   Un « geste » est un objet quelconque décrit par l'outil qui l'émet
   ({ type: 'fil', a, b }, { type: 'etat' }, { type: 'verser', … }).
   Chaque étape dit si elle accepte le geste, ou pourquoi elle le refuse.

   ETAPES.creer({
     etapes: [{ id, accepte(geste) → vrai | faux, refus(geste) → message | null }],
     ordreStrict: true,      vrai : seule l'étape en cours peut être faite ;
                             faux : n'importe quelle étape pas encore faite
     onAvance(etape),        une étape vient d'être faite
     onRefus(message, geste, etape),
     onFin(),                toutes les étapes sont faites
   })
   → {
     proposer(geste)  → { accepte: bool, refus: message | null, etape }
                       geste refusé : l'étape n'avance pas, le compteur de refus augmente ;
                       geste ni accepté ni refusé (refus() renvoie null) : ignoré.
                       Après une étape faite, les étapes suivantes qui acceptent { type: 'etat' }
                       sont faites aussitôt (un réglage déjà correct n'est pas à refaire).
     verifier()       propose { type: 'etat' } (à appeler après un changement d'état)
     courante()       étape en cours (null à la fin)
     faites()         identifiants des étapes faites
     refus            nombre de refus (lecture seule)
     fini()           vrai quand tout est fait
     reculer(id)      revient à l'étape id (elle et les suivantes redeviennent à faire)
     recommencer()    tout redevient à faire, refus = 0
   }
   Plusieurs moteurs peuvent exister dans la même page (aucun état global).
   ============================================================ */
(function () {
  'use strict';

  function creer(o) {
    const etapes = o.etapes || [];
    const strict = o.ordreStrict !== false;
    const faites = new Set();
    let refus = 0;

    const courante = () => etapes.find(e => !faites.has(e.id)) || null;
    const fini = () => etapes.every(e => faites.has(e.id));

    function faire(e) {
      faites.add(e.id);
      if (o.onAvance) o.onAvance(e);
      if (fini() && o.onFin) o.onFin();
    }
    // étapes suivantes déjà satisfaites par l'état
    function enchainer() {
      let e;
      while ((e = strict ? courante() : null) && e.accepte({ type: 'etat' })) faire(e);
      if (!strict) etapes.forEach(x => { if (!faites.has(x.id) && x.accepte({ type: 'etat' })) faire(x); });
    }

    function proposer(geste) {
      if (fini()) return { accepte: false, refus: null, etape: null };
      const candidates = strict ? [courante()] : etapes.filter(e => !faites.has(e.id));
      const e = candidates.find(x => x.accepte(geste));
      if (e) { faire(e); enchainer(); return { accepte: true, refus: null, etape: e }; }
      const c = candidates[0];
      const m = c.refus ? c.refus(geste) : null;
      if (m) { refus++; if (o.onRefus) o.onRefus(m, geste, c); }
      return { accepte: false, refus: m || null, etape: c };
    }

    return {
      proposer,
      verifier() { if (!fini()) enchainer(); },
      courante,
      faites: () => etapes.filter(e => faites.has(e.id)).map(e => e.id),
      get refus() { return refus; },
      fini,
      reculer(id) {
        const i = etapes.findIndex(e => e.id === id);
        if (i < 0) return;
        etapes.slice(i).forEach(e => faites.delete(e.id));
      },
      recommencer() { faites.clear(); refus = 0; },
    };
  }

  window.ETAPES = { creer };
})();
