/* ============================================================
   Exercices du module 3 (application « Rappels de 1ère STI2D ») :
     - exemples 1 à 4 de la fiche de révision « Notions du programme
       de 1ère qui peuvent tomber au bac » : entourer et nommer les
       groupes caractéristiques (dans l'ordre de la fiche) ;
     - extraits de sujets de bac du chapitre 14 (Combustions) :
       A, les pictogrammes du kérosène ; B, le propylène glycol.

   Chaque exercice : { id, groupe, titre, desc, contexte (HTML), parties: [p] } ;
   chaque partie suit le format de RP.PARTIES avec p.q (question) et
   p.solution (correction détaillée, toujours consultable).
   Les corrections reprennent celles de la fiche : chaque groupe est
   entouré et nommé avec sa famille.
   ============================================================ */
(function () {
  'use strict';

  const { MOL, picto, partieEntourer, partiesNommer, partieSens, partiePrecaution, ecrire } = window.RP;

  // formule condensée d'une molécule (description dans la liste) : H₃C–CH(OH)–CH(OH)–CH₃
  const condensee = m => m.chaine.map(it => ecrire(it.t) + [it.haut, it.bas].filter(Boolean).map(s => (s.double ? '(=O)' : `(${ecrire(s.t)})`)).join('')).join('–');
  const entourer = m => [partieEntourer(m)].concat(partiesNommer(m));
  const ENONCE = '<p class="er-contexte">Entourer et nommer les groupes caractéristiques de la molécule suivante. Touche les atomes pour les entourer, puis valide.</p>';

  const GROUPES_EX = [
    { id: 'fiche', titre: 'Les exemples de la fiche : entourer et nommer (exemples 1 à 4)' },
    { id: 'bac', titre: 'Extraits de sujets de bac (A et B)' },
  ];

  // étiquette du kérosène : le pictogramme n° 1 est entouré
  const KEROSENE = ['inflammable', 'nocif-irritant', 'danger-sante', 'danger-environnement'];
  const etiquette = `<div class="rp-pictos-ligne">${KEROSENE.map((id, k) => `<figure class="rp-picto-fig">${k ? picto(id) : `<span class="rp-picto-entoure">${picto(id)}</span>`}<figcaption>n° ${k + 1}</figcaption></figure>`).join('')}</div>`;

  const EXERCICES = [
    { id: '1', groupe: 'fiche', titre: 'Exemple 1', desc: condensee(MOL.diol23), contexte: ENONCE, parties: entourer(MOL.diol23) },
    { id: '2', groupe: 'fiche', titre: 'Exemple 2', desc: condensee(MOL.hydroxy3), contexte: ENONCE, parties: entourer(MOL.hydroxy3) },
    { id: '3', groupe: 'fiche', titre: 'Exemple 3', desc: condensee(MOL.ethanoiqueBas), contexte: ENONCE, parties: entourer(MOL.ethanoiqueBas) },
    { id: '4', groupe: 'fiche', titre: 'Exemple 4', desc: condensee(MOL.hydroxy4), contexte: ENONCE, parties: entourer(MOL.hydroxy4) },

    /* ---------- A : pictogrammes du kérosène (sujet de bac, chapitre 14) ---------- */
    { id: 'A', groupe: 'bac', titre: 'Sujet de bac A : le kérosène', desc: 'Pictogrammes de sécurité du carburant d\'un avion : signification et précautions.',
      contexte: `<p class="er-contexte">Un avion de ligne consomme comme carburant du kérosène, assimilé à ${ecrire('C10H22')}. Voici les pictogrammes de sécurité de son étiquette :</p>${etiquette}
        <p class="er-contexte"><b>1.</b> Donner la signification du pictogramme de sécurité entouré, ainsi que les précautions associées à ce pictogramme qu'il faut prendre lors de l'utilisation du kérosène. <b>2.</b> Que signifient les trois autres pictogrammes ?</p>`,
      parties: [
        partieSens('inflammable', '1. Que signifie le pictogramme entouré (n° 1) ?'),
        partiePrecaution('inflammable', 'Quelles précautions faut-il prendre ?'),
        partieSens('nocif-irritant', '2. Que signifie le pictogramme n° 2 ?'),
        partieSens('danger-sante', 'Que signifie le pictogramme n° 3 ?'),
        partieSens('danger-environnement', 'Que signifie le pictogramme n° 4 ?'),
      ] },

    /* ---------- B : propylène glycol (sujet de bac, chapitre 14) ---------- */
    { id: 'B', groupe: 'bac', titre: 'Sujet de bac B : le propylène glycol', desc: 'Fluide caloporteur d\'un panneau solaire thermique : entourer et nommer ses groupes caractéristiques.',
      contexte: `<p class="er-contexte">Les panneaux solaires thermiques d'un refuge de montagne fonctionnent grâce à un fluide caloporteur (mélange eau-propylène glycol) qui y circule et est chauffé par le rayonnement solaire.</p>
        <p class="er-contexte"><b>3.1.</b> Recopier la formule semi-développée de la molécule de propylène glycol et entourer les groupes caractéristiques. Nommer ce(s) groupe(s).</p>`,
      parties: entourer(MOL.glycol) },
  ];

  Object.assign(window.RP, { EXERCICES, GROUPES_EX });
})();
