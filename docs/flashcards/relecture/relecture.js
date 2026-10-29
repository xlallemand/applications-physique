/* ============================================================
   Outil de relecture des flashcards, pour l'enseignant
   (voir docs/flashcards/prompt-generation.md ; maquette validée : docs/flashcards/maquettes/relecture.html)

   Page d'une application : docs/flashcards/<dossier>/relecture.html (copie de modele.html),
   qui charge le thème, assets/revisions.js et revisions.css (les cartes s'affichent
   exactement comme pour l'élève), puis ce fichier, puis donnees.js du même dossier :

   RELECTURE({
     dossier: 'changements-etat', titre: 'Chapitre 11 : …', court, matiere,   (court, matiere : facultatifs)
     tour: 2, etape: 'cartes',                       'competences' (tour 1) ou 'cartes'
     cours: [{ cle: 'module_1_cours', nom: 'Cours (module 1)' }, …],          pages de cours de l'application
     paquets: [{ id: 'm1', module: 1, titre: '…', apres: ['module_1_cours'],
                 competences: [{ id: 'c1', texte: '…', types: ['schema'], source: 'fiche_1 · …' }],
                 cartes: [{ …carte au format de REV.paquets…, competence: 'c1', statut: 'nouvelle' }] }],
                                                    statut : nouvelle | modifiee | validee
   });

   Onglet 1 « Compétences et paquets » : prérequis (« Disponible après »), compétences
   (garder, remarque ✎), compétences à ajouter et cartes demandées (autant que voulu).
   Onglet 2 « Cartes » : filtres, « Tout valider », chaque carte dans les deux sens,
   Valider / Modifier (remarque) / Supprimer ; cartes validées à un tour précédent repliées.
   « Copier mes retours » : texte Markdown à coller dans la conversation (format du §9 du
   prompt de génération) ; si la copie est refusée, le texte est sélectionné dans une zone de texte.
   Les choix sont gardés dans le navigateur (relecture-<dossier>-<tour>) : on peut s'arrêter et reprendre.
   ============================================================ */
(function () {
  'use strict';

  const TYPES = () => (window.REV ? REV.TYPES : {});
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

  function RELECTURE(D) {
    const racine = document.getElementById('relecture') || document.body;
    if (D.matiere) document.documentElement.dataset.matiere = D.matiere;
    const etapeCartes = D.etape === 'cartes';
    // cartes reliées à leur paquet et à l'application (pour REV.face), sans rien enregistrer
    REV.lier({ dossier: D.dossier, titre: D.titre, court: D.court, matiere: D.matiere }, D.paquets);
    const cartes = D.paquets.reduce((l, p) => l.concat(p.cartes || []), []);
    const comp = (p, c) => (p.competences || []).find(x => x.id === c.competence);

    /* ---------- Choix de l'enseignant, gardés dans le navigateur ---------- */
    const CLE = `relecture-${D.dossier}-${D.tour}`;
    const vierge = () => ({ dec: {}, notes: {}, garder: {}, remarques: {}, ouvertes: {}, apres: {}, demandes: { comp: {}, carte: {} }, onglet: etapeCartes ? 'cartes' : 'comp', filtre: 'tout' });
    let E = vierge();
    try { const v = JSON.parse(localStorage.getItem(CLE)); if (v && typeof v === 'object') E = Object.assign(vierge(), v); } catch (e) { /* rien de gardé */ }
    E.demandes = Object.assign({ comp: {}, carte: {} }, E.demandes);
    // une carte validée à un tour précédent reste validée, sauf décision contraire
    cartes.forEach(c => { if (c.statut === 'validee' && !(c.id in E.dec)) E.dec[c.id] = 'ok'; });
    D.paquets.forEach(p => { if (!E.apres[p.id]) E.apres[p.id] = (p.apres || []).slice(); });
    const garder = () => { try { localStorage.setItem(CLE, JSON.stringify(E)); } catch (e) { /* stockage indisponible : la page marche pour la visite */ } };
    const dec = id => E.dec[id] || '';

    /* ---------- Squelette de la page ---------- */
    const titreCourt = D.court || (/^(Chapitre \d+)/.exec(D.titre || '') || [])[1] || D.titre;
    const nom = (D.titre || '').replace(/^Chapitre \d+\s*:\s*/, '');
    racine.innerHTML = `
      <div class="er-card">
        <span class="er-badge">RELECTURE · ${esc(titreCourt).toUpperCase()}</span>
        <h2 class="er-titre">Flashcards de « ${esc(nom)} »</h2>
        <p class="er-contexte">Tour ${D.tour}. Étape 1 : valide les <b>compétences</b> et les <b>cours à faire</b> avant chaque paquet. Étape 2 : valide chaque <b>carte</b>. Puis <b>Copier mes retours</b> et colle-les dans la conversation.</p>
        <div class="rl-bilan" data-z="bilan"></div>
      </div>
      <div class="rl-onglets">
        <button type="button" class="btn-small" data-o="comp">1. Compétences et paquets</button><button type="button" class="btn-small" data-o="cartes">2. Cartes (${cartes.length})</button>
        <span class="rl-esp"></span>
        <button type="button" class="btn-small" data-f="tout">Toutes</button><button type="button" class="btn-small" data-f="voir">À voir</button><button type="button" class="btn-small" data-f="mod">À modifier</button><button type="button" class="btn-small" data-f="ok">Validées</button>
      </div>
      <div data-z="zone"></div>
      <div class="rl-bas"><p data-z="resume" aria-live="polite"></p><button type="button" class="btn-primary" data-a="copier">Copier mes retours</button></div>
      <div class="er-card" data-z="sortie" hidden><h3 class="rev-h">Mes retours <small>à coller dans la conversation</small></h3><p class="rl-copie" data-z="copie"></p><textarea class="rl-sortie" readonly aria-label="Retours à copier"></textarea></div>`;
    const Z = n => racine.querySelector(`[data-z="${n}"]`);

    function bilan() {
      const n = k => cartes.filter(c => dec(c.id) === k).length;
      Z('bilan').innerHTML = cartes.length
        ? `<span><b>${cartes.length}</b> cartes</span><span><b>${n('ok')}</b> validée${n('ok') > 1 ? 's' : ''}</span><span><b>${n('mod')}</b> à modifier</span><span><b>${n('sup')}</b> supprimée${n('sup') > 1 ? 's' : ''}</span><span><b>${n('')}</b> à voir</span>`
        : `<span><b>${D.paquets.length}</b> paquets</span><span><b>${D.paquets.reduce((t, p) => t + (p.competences || []).length, 0)}</b> compétences</span>`;
      const r = n('mod') + n('sup') + nbRetoursComp();
      Z('resume').textContent = `${pluriel(r, 'retour')}${cartes.length ? ` · ${n('')} carte${n('') > 1 ? 's' : ''} encore à voir` : ''}`;
      racine.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-pressed', b.dataset.o === E.onglet));
      racine.querySelectorAll('[data-f]').forEach(b => { b.hidden = E.onglet !== 'cartes'; b.setAttribute('aria-pressed', b.dataset.f === E.filtre); });
    }
    // retours de l'onglet 1 : prérequis changés, compétences retirées, modifiées, ajoutées, cartes demandées
    function nbRetoursComp() {
      let n = 0;
      D.paquets.forEach(p => {
        if (prerequisChanges(p)) n++;
        (p.competences || []).forEach(c => { const k = p.id + '/' + c.id; if (E.garder[k] === false || (E.remarques[k] || '').trim()) n++; });
        ['comp', 'carte'].forEach(g => { n += (E.demandes[g][p.id] || []).filter(t => t.trim()).length; });
      });
      return n;
    }
    const prerequisChanges = p => { const a = (p.apres || []).slice().sort().join(','), b = (E.apres[p.id] || []).slice().sort().join(','); return a !== b; };

    /* ---------- Demandes : plusieurs par paquet (compétences à ajouter, nouvelles cartes) ---------- */
    function blocDemandes(genre, pid) {
      const l = E.demandes[genre][pid] || [], quoi = genre === 'comp' ? 'la compétence' : 'la carte';
      return `<div class="rl-demandes"><b>${genre === 'comp' ? 'Compétences à ajouter' : 'Nouvelles cartes demandées'}${l.length ? ' (' + l.length + ')' : ''}</b>` +
        l.map((t, k) => `<div class="rl-dem"><textarea class="rl-note" data-g="${genre}" data-p="${pid}" data-k="${k}" placeholder="Décris ${quoi}" aria-label="Décris ${quoi}">${esc(t)}</textarea><button type="button" class="btn-small" data-suppr="${genre}|${pid}|${k}" aria-label="Retirer cette demande">✕</button></div>`).join('') +
        `<button type="button" class="btn-small" data-ajout="${genre}|${pid}">+ ${genre === 'comp' ? 'Ajouter une compétence' : 'Demander une carte'}</button></div>`;
    }
    function brancherDemandes(z) {
      z.querySelectorAll('[data-ajout]').forEach(b => b.addEventListener('click', () => {
        const [g, pid] = b.dataset.ajout.split('|');
        (E.demandes[g][pid] = E.demandes[g][pid] || []).push('');
        garder(); rendre();
        const t = z.querySelectorAll(`textarea[data-g="${g}"][data-p="${pid}"]`);
        if (t.length) t[t.length - 1].focus();
      }));
      z.querySelectorAll('[data-suppr]').forEach(b => b.addEventListener('click', () => {
        const [g, pid, k] = b.dataset.suppr.split('|');
        E.demandes[g][pid].splice(+k, 1);
        garder(); rendre(); bilan();
      }));
      z.querySelectorAll('textarea[data-g]').forEach(t => t.addEventListener('input', () => { E.demandes[t.dataset.g][t.dataset.p][+t.dataset.k] = t.value; garder(); bilan(); }));
    }

    /* ---------- Onglet 1 : compétences et paquets ---------- */
    function ongletCompetences(z) {
      z.innerHTML = D.paquets.map(p => {
        const nb = (p.cartes || []).length;
        const pre = (D.cours || []).map(c => `<label><input type="checkbox" data-pre="${p.id}" value="${esc(c.cle)}"${(E.apres[p.id] || []).indexOf(c.cle) >= 0 ? ' checked' : ''}> ${esc(c.nom)}</label>`).join('');
        const comps = (p.competences || []).map(c => {
          const k = p.id + '/' + c.id, garde = E.garder[k] !== false, rq = E.remarques[k] || '', ouverte = !!E.ouvertes[k] || !!rq;
          const types = (c.types || []).map(t => (TYPES()[t] || t) + (t === 'definition' || t === 'formule' ? ' ⇄ (deux sens)' : '')).join(', ');
          return `<div class="rl-comp${garde ? '' : ' retiree'}"><input type="checkbox" data-garde="${k}"${garde ? ' checked' : ''} aria-label="Garder : ${esc(c.texte)}">` +
            `<span class="t">${esc(c.texte)}<small>${esc(c.id)}${types ? ' · ' + esc(types) : ''}${c.source ? ' · ' + esc(c.source) : ''}</small></span>` +
            `<button type="button" class="btn-small" data-rq="${k}" aria-expanded="${ouverte}" aria-label="Remarque sur cette compétence">✎</button>` +
            (ouverte ? `<textarea class="rl-note" data-rqt="${k}" placeholder="Ce qu'il faut changer" aria-label="Remarque sur cette compétence">${esc(rq)}</textarea>` : '') + '</div>';
        }).join('');
        return `<section class="er-card"><h3 class="rev-h">Module ${p.module} · ${esc(p.titre)} <small>paquet « ${esc(p.id)} »${nb ? ' · ' + pluriel(nb, 'carte') : ''}</small></h3>
          <div class="rl-pre" role="group" aria-label="Disponible après"><b>Disponible après :</b>${pre || '<span class="rl-vide">(aucune page de cours)</span>'}</div>
          ${comps || '<p class="rl-vide">Aucune compétence.</p>'}${blocDemandes('comp', p.id)}${blocDemandes('carte', p.id)}</section>`;
      }).join('');
      z.querySelectorAll('[data-pre]').forEach(i => i.addEventListener('change', () => {
        const pid = i.dataset.pre;
        E.apres[pid] = Array.from(z.querySelectorAll(`[data-pre="${pid}"]:checked`)).map(x => x.value);
        garder(); bilan();
      }));
      z.querySelectorAll('[data-garde]').forEach(i => i.addEventListener('change', () => {
        E.garder[i.dataset.garde] = i.checked;
        i.closest('.rl-comp').classList.toggle('retiree', !i.checked);
        garder(); bilan();
      }));
      z.querySelectorAll('[data-rq]').forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.rq;
        E.ouvertes[k] = !(E.ouvertes[k] || (E.remarques[k] || '').trim());
        if (!E.ouvertes[k]) delete E.remarques[k];
        garder(); rendre(); bilan();
        const t = z.querySelector(`[data-rqt="${k}"]`);
        if (t) t.focus();
      }));
      z.querySelectorAll('[data-rqt]').forEach(t => t.addEventListener('input', () => { E.remarques[t.dataset.rqt] = t.value; garder(); bilan(); }));
      brancherDemandes(z);
    }

    /* ---------- Onglet 2 : les cartes ---------- */
    const DECISIONS = [['ok', '✓ Valider'], ['mod', '✎ Modifier'], ['sup', '✕ Supprimer']];
    function ongletCartes(z) {
      if (!cartes.length) {
        z.innerHTML = '<div class="er-card"><p class="rl-vide">Pas encore de cartes : elles seront écrites après la validation des compétences (onglet 1).</p></div>';
        return;
      }
      const garde = c => E.filtre === 'tout' || (E.filtre === 'voir' ? !dec(c.id) : dec(c.id) === E.filtre);
      z.innerHTML = D.paquets.map(p => {
        const l = (p.cartes || []).filter(garde);
        if (!l.length && E.filtre !== 'tout') return '';
        return `<section class="er-card"><div class="rl-carte-h"><h3 class="rev-h" style="flex:1;margin:0">Module ${p.module} · ${esc(p.titre)}</h3><button type="button" class="btn-small" data-tout="${p.id}">✓ Tout valider</button></div>` +
          l.map(c => carte(p, c)).join('') + `<div class="rl-carte">${blocDemandes('carte', p.id)}</div></section>`;
      }).join('') || '<div class="er-card"><p class="rl-vide">Aucune carte pour ce filtre.</p></div>';
      z.querySelectorAll('.rl-dec button').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.id;
        E.dec[id] = dec(id) === b.dataset.d ? '' : b.dataset.d;
        garder(); rendre(); bilan();
        const t = z.querySelector(`[data-note="${id}"]`);
        if (t && E.dec[id] === 'mod') t.focus();
      }));
      z.querySelectorAll('[data-tout]').forEach(b => b.addEventListener('click', () => {
        D.paquets.find(p => p.id === b.dataset.tout).cartes.forEach(c => { if (!dec(c.id)) E.dec[c.id] = 'ok'; });
        garder(); rendre(); bilan();
      }));
      z.querySelectorAll('[data-note]').forEach(t => t.addEventListener('input', () => { E.notes[t.dataset.note] = t.value; garder(); }));
      brancherDemandes(z);
    }
    function carte(p, c) {
      const cp = comp(p, c), d = dec(c.id);
      const statut = c.statut === 'modifiee' ? '<span class="rl-statut">modifiée</span>' : c.statut === 'nouvelle' ? '<span class="rl-statut">nouvelle</span>' : c.statut === 'validee' ? '<span class="rl-statut validee">validée</span>' : '';
      const tete = `<span class="id"><b>${esc(cp ? cp.texte : c.competence || '')}</b> · ${esc(c.id)}${statut}</span>`;
      const boutons = `<span class="rl-dec">${DECISIONS.map(([k, t]) => `<button type="button" data-id="${c.id}" data-d="${k}" class="${d === k ? 'on' : ''}" aria-pressed="${d === k}">${t}</button>`).join('')}</span>`;
      const faces = c.faces.map((f, s) => `<div class="rev-apercu">${c.faces.length > 1 ? `<p class="rev-sens-lab">Sens ${s + 1}${s ? ' : la révision suivante' : ''}</p>` : ''}${REV.face(c, s, 'recto', { pied: false })}${REV.face(c, s, 'verso', { pied: false })}</div>`).join('');
      const note = d === 'mod' ? `<textarea class="rl-note" data-note="${c.id}" placeholder="Ce qu'il faut changer" aria-label="Ce qu'il faut changer sur ${c.id}">${esc(E.notes[c.id] || '')}</textarea>` : '';
      const cls = `rl-carte${d === 'sup' ? ' sup' : ''}`;
      // carte validée à un tour précédent (et toujours validée) : repliée
      if (c.statut === 'validee' && d === 'ok') {
        return `<details class="${cls} rl-pliee"><summary class="rl-carte-h">${tete}${boutons}</summary>${faces}</details>`;
      }
      return `<div class="${cls}"><div class="rl-carte-h">${tete}${boutons}</div>${faces}${note}</div>`;
    }

    function rendre() {
      const z = Z('zone');
      if (E.onglet === 'cartes') ongletCartes(z); else ongletCompetences(z);
    }

    /* ---------- Les retours, en Markdown (format du §9 du prompt de génération) ---------- */
    function texteRetours() {
      const L = [`# Retours flashcards — ${D.dossier} — tour ${D.tour} (${etapeCartes ? 'cartes' : 'compétences'})`, ''];
      const section = (titre, lignes, vide) => { L.push('## ' + titre, ...(lignes.length ? lignes : [vide || '(aucune)']), ''); };
      section('Prérequis', D.paquets.filter(prerequisChanges).map(p => `- ${p.id} : ${(E.apres[p.id] || []).join(', ') || '(aucun cours)'}`), '(inchangés)');
      const comps = [];
      D.paquets.forEach(p => {
        (p.competences || []).forEach(c => {
          const k = p.id + '/' + c.id, rq = (E.remarques[k] || '').trim();
          if (E.garder[k] === false) comps.push(`- retirée : ${k}`);
          else if (rq) comps.push(`- modifiée : ${k} : « ${rq} »`);
        });
        (E.demandes.comp[p.id] || []).filter(t => t.trim()).forEach(t => comps.push(`- ajoutée : ${p.id} : « ${t.trim()} »`));
      });
      section('Compétences retirées / modifiées / ajoutées', comps);
      const dem = [];
      D.paquets.forEach(p => (E.demandes.carte[p.id] || []).filter(t => t.trim()).forEach(t => dem.push(`- ${p.id} : ${t.trim()}`)));
      section('Nouvelles cartes demandées', dem);
      if (cartes.length) {
        const ids = k => cartes.filter(c => dec(c.id) === k).map(c => c.id);
        section('À modifier', ids('mod').map(id => `- ${id} : ${(E.notes[id] || '').trim() || '(à préciser)'}`));
        section('À supprimer', ids('sup').map(id => '- ' + id));
        L.push(`## Validées (${ids('ok').length})`, ids('ok').join(', ') || '(aucune)', '');
        L.push(`## Encore à voir (${ids('').length})`, ids('').join(', ') || '(aucune)', '');
      }
      return L.join('\n');
    }
    function copier() {
      const txt = texteRetours(), sortie = Z('sortie'), zt = sortie.querySelector('textarea'), msg = Z('copie');
      zt.value = txt;
      sortie.hidden = false;
      const refus = () => { msg.classList.add('refus'); msg.textContent = 'La copie automatique a été refusée : le texte est sélectionné, copie-le (Ctrl+C ou appui long).'; zt.focus(); zt.select(); };
      try {
        navigator.clipboard.writeText(txt).then(() => { msg.classList.remove('refus'); msg.textContent = '✓ Copié : colle-le dans la conversation.'; }, refus);
      } catch (e) { refus(); }
      sortie.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    racine.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { E.onglet = b.dataset.o; garder(); rendre(); bilan(); }));
    racine.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { E.filtre = b.dataset.f; E.onglet = 'cartes'; garder(); rendre(); bilan(); }));
    racine.querySelector('[data-a="copier"]').addEventListener('click', copier);
    rendre();
    bilan();
    window.RELECTURE.texte = texteRetours;          // (vérifications)
  }

  window.RELECTURE = RELECTURE;
})();
