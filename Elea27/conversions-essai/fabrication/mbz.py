"""
Fabrication d'une sauvegarde de parcours Moodle (.mbz) contenant des activités « Paquetage SCORM ».

Le .mbz est une archive tar.gz de fichiers XML (format « moodle2 ») plus les fichiers
eux-mêmes, rangés sous files/<2 premiers caractères du sha1>/<sha1>.
Structure relevée sur une sauvegarde faite par Moodle 4.5 ; la sauvegarde se déclare
de Moodle 4.1 (version 2022112800) pour être restaurable sur Éléa en 4.1 comme en 4.5 et après.

Réglages des activités SCORM (Elea27/README.md) :
  - séries : note sur 20, note la plus haute, tentatives illimitées, nouvelle tentative
    quand la précédente est terminée, évaluation de la meilleure tentative ;
  - cours : évalué en « objets d'apprentissage » (1 quand il est terminé), coefficient 0 ;
  - toutes : ouverture directe dans la page (pas de page d'accueil SCORM), sans
    structure ni boutons de navigation SCORM, achèvement quand le statut est « terminé » ;
  - carnet : moyenne pondérée des notes, total sur 20.
"""
import gzip
import hashlib
import io
import tarfile
from xml.sax.saxutils import escape

VERSION = 2022112800          # Moodle 4.1 : version déclarée de la sauvegarde
RELEASE = '4.1'
NUL = '$@NULL@$'              # valeur NULL dans les XML de sauvegarde Moodle
DATE = 1767225600             # 1er janvier 2026 : dates fixes, archive reproductible
CTX_COURS = 2                 # numéros de contexte d'origine (remplacés à la restauration)
CTX_ACTIVITE = 100

TYPES_MIME = {'zip': 'application/zip', 'html': 'text/html', 'css': 'text/css', 'js': 'application/x-javascript',
              'txt': 'text/plain', 'xml': 'application/xml', 'woff2': 'font/woff2', 'svg': 'image/svg+xml',
              'png': 'image/png', 'jpg': 'image/jpeg', 'json': 'application/json'}


def x(v):
    """Valeur d'un élément XML : None → NULL de Moodle, sinon texte échappé."""
    return NUL if v is None else escape(str(v))


def elements(d, retrait):
    """Éléments XML simples à partir d'un dictionnaire (ordre conservé)."""
    return ''.join(f'{retrait}<{k}>{x(v)}</{k}>\n' for k, v in d.items())


ENTETE = '<?xml version="1.0" encoding="UTF-8"?>\n'


def fabriquer(sortie, nom_cours, court, sections, activites):
    """Écrit le .mbz : sections = [{n, titre, resume}],
    activites = [{section, type, titre, ident, lancement, zip, fichiers}] (lancement : page ouverte dans le zip)."""
    xmls = {}                 # chemin dans l'archive → texte XML
    blobs = {}                # sha1 → octets (fichiers sous files/)
    fichiers_xml = []         # entrées de files.xml
    ids_fichier = iter(range(1, 100000))

    def fichier(ctx, aire, chemin, nom, octets):
        """Déclare un fichier (ou un dossier si octets est None) dans files.xml ; renvoie son id."""
        i = next(ids_fichier)
        if octets is None:
            h, taille, mime = hashlib.sha1(b'').hexdigest(), 0, None
        else:
            h, taille = hashlib.sha1(octets).hexdigest(), len(octets)
            blobs[h] = octets
            mime = TYPES_MIME.get(nom.rsplit('.', 1)[-1].lower(), 'application/octet-stream')
        fichiers_xml.append(f'''  <file id="{i}">
{elements({'contenthash': h, 'contextid': ctx, 'component': 'mod_scorm', 'filearea': aire, 'itemid': 0,
           'filepath': chemin, 'filename': nom, 'userid': None, 'filesize': taille, 'mimetype': mime,
           'status': 0, 'timecreated': DATE, 'timemodified': DATE, 'source': None, 'author': None,
           'license': None, 'sortorder': 0, 'repositorytype': None, 'repositoryid': None,
           'reference': None}, '    ')}  </file>
''')
        return i

    # ---------- numérotation d'origine (Moodle renumérote à la restauration) ----------
    # sections : id 1 = section 0 (en-tête du parcours), puis une par module
    id_section = {0: 1}
    for k, s in enumerate(sections, 2):
        id_section[s['n']] = k
    for k, a in enumerate(activites, 1):
        a['cmid'], a['instance'], a['ctx'], a['item'] = k, k, CTX_ACTIVITE + k, k + 1   # item 1 = total du cours
        a['sco_org'], a['sco'] = 2 * k - 1, 2 * k

    # ---------- activités ----------
    for a in activites:
        rep = f'activities/scorm_{a["cmid"]}'
        serie = a['type'] == 'serie'
        zip_octets = a['zip'].read_bytes()
        sha_zip = hashlib.sha1(zip_octets).hexdigest()

        # fichiers : le zip (aire « package ») et son contenu décompressé (aire « content »)
        ids = [fichier(a['ctx'], 'package', '/', a['zip'].name, zip_octets), fichier(a['ctx'], 'package', '/', '.', None)]
        dossiers = {'/'}
        for chemin in sorted(a['fichiers']):
            parties = chemin.split('/')
            for j in range(1, len(parties)):
                dossiers.add('/' + '/'.join(parties[:j]) + '/')
            ids.append(fichier(a['ctx'], 'content', '/' + '/'.join(parties[:-1]) + ('/' if len(parties) > 1 else ''),
                               parties[-1], a['fichiers'][chemin]))
        for d in sorted(dossiers):
            ids.append(fichier(a['ctx'], 'content', d, '.', None))

        i = f'{a["ident"]}'
        reglages = {
            'name': a['titre'], 'scormtype': 'local', 'reference': a['zip'].name, 'intro': '', 'introformat': 1,
            'version': 'SCORM_1.2', 'maxgrade': 20 if serie else 0,
            'grademethod': 1 if serie else 0,          # 1 : note la plus haute ; 0 : objets d'apprentissage
            'whatgrade': 0,                            # meilleure tentative
            'maxattempt': 0, 'forcecompleted': 0,
            'forcenewattempt': 1,                      # nouvelle tentative quand la précédente est terminée
            'lastattemptlock': 0, 'masteryoverride': 1, 'displayattemptstatus': 0, 'displaycoursestructure': 0,
            'updatefreq': 0, 'sha1hash': sha_zip, 'md5hash': '', 'revision': 1, 'launch': a['sco'],
            'skipview': 2,                             # toujours ouvrir directement le contenu
            'hidebrowse': 1, 'hidetoc': 3,             # pas de structure du paquet
            'nav': 0, 'navpositionleft': -100, 'navpositiontop': -100,   # pas de boutons de navigation SCORM
            'auto': 0, 'popup': 0, 'options': '', 'width': 100, 'height': 600, 'timeopen': 0, 'timeclose': 0,
            'timemodified': DATE,
            'completionstatusrequired': 4,             # achevée quand le statut est « terminé »
            'completionscorerequired': None, 'completionstatusallscos': 0, 'autocommit': 0,
        }
        xmls[f'{rep}/scorm.xml'] = f'''{ENTETE}<activity id="{a['instance']}" moduleid="{a['cmid']}" modulename="scorm" contextid="{a['ctx']}">
  <scorm id="{a['instance']}">
{elements(reglages, '    ')}    <scoes>
      <sco id="{a['sco_org']}">
{elements({'manifest': 'MANIFEST-' + i, 'organization': '', 'parent': '/', 'identifier': 'ORG-' + i, 'launch': '',
           'scormtype': '', 'title': a['titre'], 'sortorder': 1}, '        ')}        <sco_datas>
        </sco_datas>
        <seq_ruleconds>
        </seq_ruleconds>
        <seq_rolluprules>
        </seq_rolluprules>
        <seq_objectives>
        </seq_objectives>
        <sco_tracks>
        </sco_tracks>
      </sco>
      <sco id="{a['sco']}">
{elements({'manifest': 'MANIFEST-' + i, 'organization': 'ORG-' + i, 'parent': 'ORG-' + i, 'identifier': 'ITEM-' + i,
           'launch': a['lancement'], 'scormtype': 'sco', 'title': a['titre'], 'sortorder': 2}, '        ')}        <sco_datas>
          <sco_data id="{2 * a['sco'] - 1}">
            <name>isvisible</name>
            <value>true</value>
          </sco_data>
          <sco_data id="{2 * a['sco']}">
            <name>parameters</name>
            <value></value>
          </sco_data>
        </sco_datas>
        <seq_ruleconds>
        </seq_ruleconds>
        <seq_rolluprules>
        </seq_rolluprules>
        <seq_objectives>
        </seq_objectives>
        <sco_tracks>
        </sco_tracks>
      </sco>
    </scoes>
  </scorm>
</activity>'''
        xmls[f'{rep}/module.xml'] = f'''{ENTETE}<module id="{a['cmid']}" version="{VERSION}">
{elements({'modulename': 'scorm', 'sectionid': id_section[a['section']], 'sectionnumber': a['section'], 'idnumber': '',
           'added': DATE, 'score': 0, 'indent': 0, 'visible': 1, 'visibleoncoursepage': 1, 'visibleold': 1,
           'groupmode': 0, 'groupingid': 0,
           'completion': 2,                            # achèvement automatique
           'completiongradeitemnumber': None, 'completionpassgrade': 0, 'completionview': 0, 'completionexpected': 0,
           'availability': None, 'showdescription': 0, 'downloadcontent': 1, 'lang': None}, '  ')}  <tags>
  </tags>
</module>'''
        xmls[f'{rep}/grades.xml'] = f'''{ENTETE}<activity_gradebook>
  <grade_items>
{element_note(a['item'], 1, a['titre'], 'mod', 'scorm', a['instance'], 0, 20 if serie else 1, 1 if serie else 0, a['item'])}  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>'''
        refs = ''.join(f'    <file>\n      <id>{n}</id>\n    </file>\n' for n in ids)
        xmls[f'{rep}/inforef.xml'] = f'''{ENTETE}<inforef>
  <fileref>
{refs}  </fileref>
  <grade_itemref>
    <grade_item>
      <id>{a['item']}</id>
    </grade_item>
  </grade_itemref>
</inforef>'''
        xmls[f'{rep}/grade_history.xml'] = f'{ENTETE}<grade_history>\n  <grade_grades>\n  </grade_grades>\n</grade_history>'
        xmls[f'{rep}/roles.xml'] = f'{ENTETE}<roles>\n  <role_overrides>\n  </role_overrides>\n  <role_assignments>\n  </role_assignments>\n</roles>'
        xmls[f'{rep}/filters.xml'] = f'{ENTETE}<filters>\n  <filter_actives>\n  </filter_actives>\n  <filter_configs>\n  </filter_configs>\n</filters>'
        xmls[f'{rep}/comments.xml'] = f'{ENTETE}<comments>\n</comments>'
        xmls[f'{rep}/calendar.xml'] = f'{ENTETE}<events>\n</events>'
        xmls[f'{rep}/completion.xml'] = f'{ENTETE}<completions>\n  <completionviews>\n  </completionviews>\n</completions>'
        xmls[f'{rep}/competencies.xml'] = f'{ENTETE}<course_module_competencies>\n  <competencies>\n  </competencies>\n</course_module_competencies>'
        xmls[f'{rep}/xapistate.xml'] = f'{ENTETE}<states>\n</states>'

    # ---------- sections ----------
    toutes = [{'n': 0, 'titre': None, 'resume': ''}] + sections
    for s in toutes:
        rep = f'sections/section_{id_section[s["n"]]}'
        seq = ','.join(str(a['cmid']) for a in activites if a['section'] == s['n'])
        xmls[f'{rep}/section.xml'] = f'''{ENTETE}<section id="{id_section[s['n']]}">
{elements({'number': s['n'], 'name': s['titre'], 'summary': s['resume'], 'summaryformat': 1, 'sequence': seq,
           'visible': 1, 'availabilityjson': None, 'component': None, 'itemid': None, 'timemodified': DATE}, '  ')}</section>'''
        xmls[f'{rep}/inforef.xml'] = f'{ENTETE}<inforef>\n</inforef>'

    # ---------- parcours ----------
    xmls['course/course.xml'] = f'''{ENTETE}<course id="1" contextid="{CTX_COURS}">
{elements({'shortname': court, 'fullname': nom_cours, 'idnumber': '', 'summary': '', 'summaryformat': 1,
           'format': 'topics', 'showgrades': 1, 'newsitems': 0, 'startdate': 0, 'enddate': 0, 'marker': 0,
           'maxbytes': 0, 'legacyfiles': 0, 'showreports': 0, 'visible': 1, 'groupmode': 0, 'groupmodeforce': 0,
           'defaultgroupingid': 0, 'lang': '', 'theme': '', 'timecreated': DATE, 'timemodified': DATE,
           'requested': 0, 'showactivitydates': 0, 'showcompletionconditions': 1, 'pdfexportfont': None,
           'enablecompletion': 1, 'completionnotify': 0}, '  ')}  <category id="1">
    <name>Parcours</name>
    <description>{NUL}</description>
  </category>
  <tags>
  </tags>
  <customfields>
  </customfields>
  <courseformatoptions>
    <courseformatoption>
      <format>topics</format>
      <sectionid>0</sectionid>
      <name>hiddensections</name>
      <value>1</value>
    </courseformatoption>
    <courseformatoption>
      <format>topics</format>
      <sectionid>0</sectionid>
      <name>coursedisplay</name>
      <value>0</value>
    </courseformatoption>
  </courseformatoptions>
</course>'''
    xmls['course/inforef.xml'] = f'{ENTETE}<inforef>\n</inforef>'
    xmls['course/roles.xml'] = f'{ENTETE}<roles>\n  <role_overrides>\n  </role_overrides>\n  <role_assignments>\n  </role_assignments>\n</roles>'
    xmls['course/enrolments.xml'] = f'{ENTETE}<enrolments>\n  <enrols>\n  </enrols>\n</enrolments>'
    xmls['course/filters.xml'] = f'{ENTETE}<filters>\n  <filter_actives>\n  </filter_actives>\n  <filter_configs>\n  </filter_configs>\n</filters>'
    xmls['course/comments.xml'] = f'{ENTETE}<comments>\n</comments>'
    xmls['course/calendar.xml'] = f'{ENTETE}<events>\n</events>'
    xmls['course/competencies.xml'] = f'{ENTETE}<course_competencies>\n  <competencies>\n  </competencies>\n  <user_competencies>\n  </user_competencies>\n</course_competencies>'
    xmls['course/completiondefaults.xml'] = f'{ENTETE}<course_completion_defaults>\n</course_completion_defaults>'
    xmls['course/contentbank.xml'] = f'{ENTETE}<contents>\n</contents>'

    # ---------- carnet de notes : moyenne pondérée, total sur 20 ----------
    xmls['gradebook.xml'] = f'''{ENTETE}<gradebook>
  <attributes>
  </attributes>
  <grade_categories>
    <grade_category id="1">
{elements({'parent': None, 'depth': 1, 'path': '/1/', 'fullname': '?',
           'aggregation': 10,                          # moyenne pondérée des notes
           'keephigh': 0, 'droplow': 0,
           'aggregateonlygraded': 1,                   # seules les séries faites comptent
           'aggregateoutcomes': 0, 'timecreated': DATE, 'timemodified': DATE, 'hidden': 0}, '      ')}    </grade_category>
  </grade_categories>
  <grade_items>
{element_note(1, None, None, 'course', None, 1, None, 20, 0, 1)}  </grade_items>
  <grade_letters>
  </grade_letters>
  <grade_settings>
    <grade_setting id="">
      <name>minmaxtouse</name>
      <value>1</value>
    </grade_setting>
  </grade_settings>
</gradebook>'''

    # ---------- fichiers généraux ----------
    xmls['files.xml'] = f'{ENTETE}<files>\n{"".join(fichiers_xml)}</files>'
    xmls['grade_history.xml'] = f'{ENTETE}<grade_history>\n  <grade_grades>\n  </grade_grades>\n</grade_history>'
    xmls['completion.xml'] = f'{ENTETE}<course_completion>\n</course_completion>'
    xmls['groups.xml'] = f'{ENTETE}<groups>\n  <groupcustomfields>\n  </groupcustomfields>\n  <groupings>\n    <groupingcustomfields>\n    </groupingcustomfields>\n  </groupings>\n</groups>'
    xmls['outcomes.xml'] = f'{ENTETE}<outcomes_definition>\n</outcomes_definition>'
    xmls['questions.xml'] = f'{ENTETE}<question_categories>\n</question_categories>'
    xmls['roles.xml'] = f'{ENTETE}<roles_definition>\n</roles_definition>'
    xmls['scales.xml'] = f'{ENTETE}<scales_definition>\n</scales_definition>'
    xmls['badges.xml'] = f'{ENTETE}<badges>\n</badges>'
    xmls['users.xml'] = f'{ENTETE}<users>\n</users>'
    xmls['moodle_backup.xml'] = description(sortie.name, nom_cours, court, toutes, id_section, activites)

    ecrire_archive(sortie, xmls, blobs)


def element_note(id_, categorie, nom, type_, module, instance, numero, maxi, coef, ordre):
    """Un élément de note (grade_item) au format de sauvegarde."""
    return f'''    <grade_item id="{id_}">
{elements({'categoryid': categorie, 'itemname': nom, 'itemtype': type_, 'itemmodule': module, 'iteminstance': instance,
           'itemnumber': numero, 'iteminfo': None, 'idnumber': '' if type_ == 'mod' else None, 'calculation': None,
           'gradetype': 1, 'grademax': f'{maxi:.5f}', 'grademin': '0.00000', 'scaleid': None, 'outcomeid': None,
           'gradepass': '0.00000', 'multfactor': '1.00000', 'plusfactor': '0.00000',
           'aggregationcoef': f'{coef:.5f}',                 # coefficient dans la moyenne pondérée
           'aggregationcoef2': '0.00000', 'weightoverride': 0, 'sortorder': ordre, 'display': 0, 'decimals': None,
           'hidden': 0, 'locked': 0, 'locktime': 0, 'needsupdate': 1, 'timecreated': DATE, 'timemodified': DATE},
          '      ')}      <grade_grades>
      </grade_grades>
    </grade_item>
'''


def description(nom_fichier, nom_cours, court, sections, id_section, activites):
    """moodle_backup.xml : informations générales, contenu et réglages de la sauvegarde."""
    acts = ''.join(f'''        <activity>
          <moduleid>{a['cmid']}</moduleid>
          <sectionid>{id_section[a['section']]}</sectionid>
          <modulename>scorm</modulename>
          <title>{x(a['titre'])}</title>
          <directory>activities/scorm_{a['cmid']}</directory>
          <insubsection></insubsection>
        </activity>
''' for a in activites)
    secs = ''.join(f'''        <section>
          <sectionid>{id_section[s['n']]}</sectionid>
          <title>{x(s['titre'] if s['titre'] is not None else s['n'])}</title>
          <directory>sections/section_{id_section[s['n']]}</directory>
          <parentcmid></parentcmid>
          <modname></modname>
        </section>
''' for s in sections)

    def reglage(niveau, nom, valeur, cle=None):
        cible = f'\n        <{niveau}>{cle}</{niveau}>' if cle else ''
        return f'''      <setting>
        <level>{niveau}</level>{cible}
        <name>{nom}</name>
        <value>{valeur}</value>
      </setting>
'''
    racine = {'filename': nom_fichier, 'imscc11': 0, 'users': 0, 'anonymize': 0, 'role_assignments': 0,
              'activities': 1, 'blocks': 0, 'files': 1, 'filters': 0, 'comments': 0, 'badges': 0,
              'calendarevents': 0, 'userscompletion': 0, 'logs': 0, 'grade_histories': 0, 'questionbank': 0,
              'groups': 0, 'competencies': 0, 'customfield': 0, 'contentbankcontent': 0, 'xapistate': 0,
              'legacyfiles': 0}
    regl = ''.join(reglage('root', k, v) for k, v in racine.items())
    for s in sections:
        c = f'section_{id_section[s["n"]]}'
        regl += reglage('section', f'{c}_included', 1, c) + reglage('section', f'{c}_userinfo', 0, c)
        for a in activites:
            if a['section'] == s['n']:
                c2 = f'scorm_{a["cmid"]}'
                regl += reglage('activity', f'{c2}_included', 1, c2) + reglage('activity', f'{c2}_userinfo', 0, c2)
    return f'''{ENTETE}<moodle_backup>
  <information>
    <name>{x(nom_fichier)}</name>
    <moodle_version>{VERSION}</moodle_version>
    <moodle_release>4.1 (Build: 20221128)</moodle_release>
    <backup_version>{VERSION}</backup_version>
    <backup_release>{RELEASE}</backup_release>
    <backup_date>{DATE}</backup_date>
    <mnet_remoteusers>0</mnet_remoteusers>
    <include_files>1</include_files>
    <include_file_references_to_external_content>0</include_file_references_to_external_content>
    <original_wwwroot>https://elea27.invalid</original_wwwroot>
    <original_site_identifier_hash>{hashlib.md5(b'Elea27').hexdigest()}</original_site_identifier_hash>
    <original_course_id>1</original_course_id>
    <original_course_format>topics</original_course_format>
    <original_course_fullname>{x(nom_cours)}</original_course_fullname>
    <original_course_shortname>{x(court)}</original_course_shortname>
    <original_course_startdate>0</original_course_startdate>
    <original_course_enddate>0</original_course_enddate>
    <original_course_contextid>{CTX_COURS}</original_course_contextid>
    <original_system_contextid>1</original_system_contextid>
    <details>
      <detail backup_id="{hashlib.md5(court.encode()).hexdigest()}">
        <type>course</type>
        <format>moodle2</format>
        <interactive>1</interactive>
        <mode>10</mode>
        <execution>1</execution>
        <executiontime>0</executiontime>
      </detail>
    </details>
    <contents>
      <activities>
{acts}      </activities>
      <sections>
{secs}      </sections>
      <course>
        <courseid>1</courseid>
        <title>{x(court)}</title>
        <directory>course</directory>
      </course>
    </contents>
    <settings>
{regl}    </settings>
  </information>
</moodle_backup>'''


def ecrire_archive(sortie, xmls, blobs):
    """Archive tar.gz reproductible : index .ARCHIVE_INDEX, XML puis fichiers sous files/."""
    entrees = {}
    for chemin, texte in xmls.items():
        entrees[chemin] = texte.encode('utf-8')
    for h, octets in blobs.items():
        entrees[f'files/{h[:2]}/{h}'] = octets
    dossiers = set()
    for chemin in entrees:
        parties = chemin.split('/')
        for j in range(1, len(parties)):
            dossiers.add('/'.join(parties[:j]) + '/')
    liste = sorted(list(entrees) + list(dossiers))
    index = f'Moodle archive file index. Count: {len(liste)}\n' + ''.join(
        f'{c}\td\t0\t?\n' if c.endswith('/') else f'{c}\tf\t{len(entrees[c])}\t{DATE}\n' for c in liste)

    tampon = io.BytesIO()
    with tarfile.open(fileobj=tampon, mode='w', format=tarfile.USTAR_FORMAT) as tar:
        def ajouter(nom, octets=None):
            info = tarfile.TarInfo(nom)
            info.mtime = DATE
            if octets is None:
                info.type, info.mode = tarfile.DIRTYPE, 0o755
                tar.addfile(info)
            else:
                info.size, info.mode = len(octets), 0o644
                tar.addfile(info, io.BytesIO(octets))
        ajouter('.ARCHIVE_INDEX', index.encode('utf-8'))
        for c in liste:
            ajouter(c, None if c.endswith('/') else entrees[c])
    with open(sortie, 'wb') as f, gzip.GzipFile(fileobj=f, mode='wb', mtime=DATE, filename='') as gz:
        gz.write(tampon.getvalue())
