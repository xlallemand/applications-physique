/* ============================================================
   Règles de validation des déplacements — spécifiques à l'application
   "Équations en Physique (avec aide)".

   Un chemin ("path") désigne l'emplacement d'un élément dans l'équation,
   ex. "left", "left.num", "right.0.den". Le dernier segment indique le
   niveau : ".num" (numérateur), ".den" (dénominateur), ou aucun des deux
   ("flat" : élément multiplié directement, sans fraction autour, ou
   membre entier considéré comme un numérateur implicite sur 1).

   Ce fichier ne fait aucune hypothèse sur la structure interne de
   l'équation (kind 'simple'/'frac'/'seq'/'sum'/'func') : il raisonne
   uniquement sur ces chemins, ce qui permet de l'utiliser à l'identique
   dans tous les modules.
   ============================================================ */

(function () {
    'use strict';

    function side(path) { return path.split('.')[0]; }
    function level(path) {
        if (path.endsWith('.num')) return 'num';
        if (path.endsWith('.den')) return 'den';
        return 'flat';
    }
    // au niveau "flat" ou "num", un terme se comporte comme un numérateur
    // (implicitement sur 1 s'il n'est pas dans une fraction)
    function isNumeratorLevel(lvl) { return lvl !== 'den'; }

    // déplacement d'une tuile multiplicative (type 'move') :
    // - toujours autorisé si la case d'arrivée est la même que le départ
    // - du même côté de l'équation : autorisé seulement entre deux positions
    //   de même niveau (numérateur/flat entre eux, ou dénominateur entre eux) —
    //   ex. faire entrer/sortir un facteur du numérateur d'une fraction
    //   voisine, ou faire passer un terme d'un dénominateur à un autre
    //   dénominateur multiplié sur le même côté
    // - de l'autre côté de l'équation : autorisé seulement en changeant de
    //   niveau (numérateur <-> dénominateur), ce qui revient à multiplier ou
    //   diviser les deux côtés de l'équation par ce terme
    function isLegalMove(fromPath, toPath) {
        if (fromPath === toPath) return true;
        const fs = side(fromPath), ts = side(toPath);
        const fNum = isNumeratorLevel(level(fromPath));
        const tNum = isNumeratorLevel(level(toPath));
        return fs === ts ? fNum === tNum : fNum !== tNum;
    }

    // sortie d'un terme hors d'une fraction pour devenir un facteur
    // multiplié à côté (zone d'insertion) : seul le numérateur peut sortir,
    // et cela reste du même côté de l'équation
    function isLegalInsert(fromPath, destSidePath) {
        if (side(fromPath) !== side(destSidePath)) return false;
        return level(fromPath) !== 'den';
    }

    // déplacement d'un terme additif (+ ou -) : toujours de l'autre côté
    function isLegalSumTerm(fromPath, destSidePath) {
        return side(fromPath) !== side(destSidePath);
    }

    // dépôt de l'outil fraction (icône "···/···") : uniquement sur un
    // emplacement "flat" (jamais à l'intérieur d'un numérateur ou d'un
    // dénominateur déjà existant)
    function isLegalFracTool(destPath) {
        return level(destPath) === 'flat';
    }

    const MSG_MOVE = "Déplacement non autorisé. Règle à suivre : un terme multiplicatif ne peut passer que de l'autre côté de l'équation, en changeant de position (du numérateur vers le dénominateur, ou du dénominateur vers le numérateur) — cela revient à multiplier ou diviser les deux côtés de l'équation par ce terme.";
    const MSG_MOVE_FRAC = "Déplacement non autorisé. Règle à suivre : un terme multiplicatif peut rejoindre un numérateur (ou une position à côté d'une fraction) ou un dénominateur déjà présent du même côté ; il ne peut passer d'un numérateur à un dénominateur (ou inversement) qu'en changeant de côté de l'équation.";
    const MSG_INSERT = "Déplacement non autorisé. Règle à suivre : seul un terme placé au numérateur d'une fraction peut en sortir pour devenir un facteur multiplié à côté d'elle, et il doit rester du même côté de l'équation.";
    const MSG_SUMTERM = "Déplacement non autorisé. Règle à suivre : un terme précédé de + ou − ne peut que passer de l'autre côté de l'équation ; il change alors de signe (+ devient −, et inversement).";
    const MSG_FRAC = "Déplacement non autorisé. Règle à suivre : l'outil fraction ne peut être utilisé que sur un emplacement qui n'est pas déjà le numérateur ou le dénominateur d'une fraction.";
    const MSG_FRACDEN = "Déplacement non autorisé. Règle à suivre : le dénominateur ne peut rejoindre que l'autre côté de l'équation (cela revient à multiplier les deux côtés par ce dénominateur, ce qui le supprime d'un côté et l'ajoute comme facteur de l'autre).";

    window.AideRules = {
        side, level, isLegalMove, isLegalInsert, isLegalSumTerm, isLegalFracTool,
        MSG_MOVE, MSG_MOVE_FRAC, MSG_INSERT, MSG_SUMTERM, MSG_FRAC, MSG_FRACDEN,
    };
})();
