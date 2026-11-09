#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Espaces insécables avant  : ; ? !  et à l'intérieur des guillemets « ».

Usage :
    python3 docs/outils/typo.py DOSSIER_OU_FICHIER...            # signale seulement
    python3 docs/outils/typo.py --corriger DOSSIER_OU_FICHIER... # corrige

Ne touche qu'au TEXTE :
  - fichiers .html : nœuds texte et valeurs d'attributs ; les <script> en ligne
    sont traités comme du JavaScript, les <style> sont ignorés ;
  - fichiers .js : uniquement le contenu des chaînes ('…', "…", `…`), jamais le
    code (opérateurs ternaires  a ? b : c , objets, expressions ${…}), ni les
    commentaires, ni les expressions régulières.
Une espace ordinaire (ou tabulation) avant la ponctuation est remplacée par
l'espace insécable U+00A0. Les cas sans espace (« mot: ») sont seulement
signalés : à vérifier à la main.
Code de sortie 1 s'il reste un problème (utilisable avant chaque livraison).
"""
import re
import sys
import os

NBSP = ' '
# espace ordinaire avant : ; ? !  (pas « :// », pas « ?= » ni « != »…)
R_AVANT = re.compile(r'[ \t]+([:;?!])(?![=/:])')
R_OUV = re.compile(r'«[ \t]+')
R_FERM = re.compile(r'[ \t]+»')
# signalements seulement : lettre collée à la ponctuation, suivie d'une espace ou fin
R_COLLE = re.compile(r'[A-Za-zÀ-ÿ0-9)][;?!](?=\s|$|<)|[A-Za-zÀ-ÿ][:](?=\s)|«(?=[^\s  ])|(?<=[^\s  ])»')


def corriger_texte(t):
    """Remplace les espaces ordinaires fautives dans un morceau de texte."""
    t = R_AVANT.sub(NBSP + r'\1', t)
    t = R_OUV.sub('«' + NBSP, t)
    t = R_FERM.sub(NBSP + '»', t)
    return t


def segments_js(src):
    """Découpe du JavaScript : liste de (debut, fin) du contenu des chaînes."""
    res = []
    i, n = 0, len(src)
    pile = []          # profondeur d'accolades pour chaque ${ ouvert
    dernier = ''       # dernier caractère significatif (détection des regex)
    while i < n:
        c = src[i]
        # retour dans un gabarit après ${ … }
        if pile and c == '}' and pile[-1] == 0:
            pile.pop()
            i = lire_gabarit(src, i + 1, res, pile)
            dernier = '`'
            continue
        if pile and c == '{':
            pile[-1] += 1
        elif pile and c == '}':
            pile[-1] -= 1
        if c == '/' and src.startswith('//', i):
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and src.startswith('/*', i):
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c == '/' and (dernier == '' or dernier in '(,=:[!&|?{};+-*%<>~^' or
                         re.search(r'(return|typeof|case|in|of)\s*$', src[max(0, i - 8):i])):
            # expression régulière littérale
            j = i + 1
            classe = False
            while j < n:
                if src[j] == '\\':
                    j += 2
                    continue
                if src[j] == '[':
                    classe = True
                elif src[j] == ']':
                    classe = False
                elif src[j] == '/' and not classe:
                    break
                elif src[j] == '\n':
                    break
                j += 1
            i = j + 1
            dernier = '/'
            continue
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == '\\':
                    j += 1
                elif src[j] == '\n':
                    break
                j += 1
            res.append((i + 1, j))
            i = j + 1
            dernier = c
            continue
        if c == '`':
            i = lire_gabarit(src, i + 1, res, pile)
            dernier = '`'
            continue
        if not c.isspace():
            dernier = c
        i += 1
    return res


def lire_gabarit(src, i, res, pile):
    """Lit un gabarit `…` à partir de i ; s'arrête à ` ou à ${ (empile)."""
    debut, n = i, len(src)
    while i < n:
        if src[i] == '\\':
            i += 2
            continue
        if src[i] == '`':
            res.append((debut, i))
            return i + 1
        if src.startswith('${', i):
            res.append((debut, i))
            pile.append(0)
            return i + 2
        i += 1
    res.append((debut, n))
    return n


def traiter_js(src):
    """Corrige le contenu des chaînes d'un source JavaScript."""
    morceaux, k = [], 0
    for a, b in segments_js(src):
        morceaux.append(src[k:a])
        morceaux.append(corriger_texte(src[a:b]))
        k = b
    morceaux.append(src[k:])
    return ''.join(morceaux)


def traiter_html(src):
    """Corrige le texte d'une page HTML (scripts en ligne compris)."""
    sortie, k = [], 0
    for m in re.finditer(r'<script\b[^>]*>(.*?)</script>|<style\b[^>]*>.*?</style>|<!--.*?-->|<[^>]+>', src, re.S):
        sortie.append(corriger_texte(src[k:m.start()]))
        bloc = m.group(0)
        if bloc.startswith('<script') and m.group(1) is not None:
            a = m.start(1) - m.start()
            b = m.end(1) - m.start()
            bloc = bloc[:a] + traiter_js(bloc[a:b]) + bloc[b:]
        elif bloc.startswith('<') and not bloc.startswith(('<style', '<!--')):
            # valeurs d'attributs (title, aria-label, alt, placeholder…)
            bloc = re.sub(r'((?:title|aria-label|alt|placeholder|data-aide)=")([^"]*)(")',
                          lambda a: a.group(1) + corriger_texte(a.group(2)) + a.group(3), bloc)
        sortie.append(bloc)
        k = m.end()
    sortie.append(corriger_texte(src[k:]))
    return ''.join(sortie)


def fichiers(chemins):
    for c in chemins:
        if os.path.isdir(c):
            for rac, _, noms in os.walk(c):
                for nom in sorted(noms):
                    if nom.endswith(('.html', '.js')):
                        yield os.path.join(rac, nom)
        else:
            yield c


def signaler_colles(chemin, texte, traiter):
    """Signale la ponctuation collée au mot (à corriger à la main)."""
    nb = 0
    marque = '\u0001'
    # on réutilise le découpage : seules les parties « texte » sont examinées
    if chemin.endswith('.js'):
        parts = [texte[a:b] for a, b in segments_js(texte)]
    else:
        parts = re.split(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->|<[^>]+>', texte, flags=re.S)
    for p in parts:
        for m in R_COLLE.finditer(p):
            extrait = p[max(0, m.start() - 25):m.end() + 10].replace('\n', ' ')
            if re.search(r'https?:|\.html|\$\{|=>|&&|\|\|', extrait) or \
               re.search(r'&#?\w+;$', p[max(0, m.start() - 10):m.end()]) or \
               re.search(r'\([\w-]+:$', p[max(0, m.start() - 30):m.end()]):
                continue
            print(f'  ? {chemin} : « {extrait.strip()} »')
            nb += 1
    return nb


def main():
    args = sys.argv[1:]
    corr = '--corriger' in args
    args = [a for a in args if a != '--corriger']
    if not args:
        print(__doc__)
        sys.exit(2)
    reste = 0
    for f in fichiers(args):
        src = open(f, encoding='utf-8').read()
        neuf = traiter_js(src) if f.endswith('.js') else traiter_html(src)
        if neuf != src:
            nb = sum(1 for x, y in zip(src, neuf) if x != y)
            if corr:
                open(f, 'w', encoding='utf-8').write(neuf)
                print(f'corrigé  {f} ({nb} espaces)')
            else:
                print(f'à corriger {f} ({nb} espaces)')
                reste += nb
        reste += signaler_colles(f, neuf if corr else src, None)
    sys.exit(1 if reste else 0)


if __name__ == '__main__':
    main()
