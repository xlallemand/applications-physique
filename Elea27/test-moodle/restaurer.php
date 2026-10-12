<?php
// Test local : restaure un .mbz en le fusionnant dans un parcours vide neuf (comme sur Éléa), en tant qu'enseignant.
// Crée au besoin l'enseignant « prof » (Prof1234!) et l'élève « eleve » (Eleve1234!), inscrits au parcours.
// Lancement : MOODLE=/chemin/du/moodle php restaurer.php fichier.mbz   (affiche l'id du parcours créé)
define('CLI_SCRIPT', true);
$mbz = realpath($argv[1]);              // avant config.php, qui change de dossier courant
require(getenv('MOODLE') . '/config.php');
require_once($CFG->dirroot . '/backup/util/includes/restore_includes.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/user/lib.php');
// enseignant et élève
foreach (['prof' => 'editingteacher', 'eleve' => 'student'] as $login => $role) {
    if (!$DB->record_exists('user', ['username' => $login])) {
        user_create_user((object)['username' => $login, 'password' => ucfirst($login) . '1234!', 'firstname' => ucfirst($login), 'lastname' => 'Test',
            'email' => "$login@example.com", 'auth' => 'manual', 'confirmed' => 1, 'mnethostid' => $CFG->mnet_localhost_id]);
    }
}
// parcours vide
$c = create_course((object)['fullname' => 'Parcours vide', 'shortname' => 'vide' . time(), 'category' => 1, 'format' => 'topics', 'numsections' => 4, 'enablecompletion' => 1]);
$enrol = enrol_get_plugin('manual');
$inst = $DB->get_record('enrol', ['courseid' => $c->id, 'enrol' => 'manual']);
foreach (['prof' => 'editingteacher', 'eleve' => 'student'] as $login => $role) {
    $enrol->enrol_user($inst, $DB->get_field('user', 'id', ['username' => $login]), $DB->get_field('role', 'id', ['shortname' => $role]));
}
$prof = $DB->get_record('user', ['username' => 'prof']);
\core\session\manager::set_user($prof);
// extraction puis restauration en fusion
$dossier = 'essai' . time();
$fp = get_file_packer('application/vnd.moodle.backup');
$fp->extract_to_pathname($mbz, make_backup_temp_directory($dossier));
$rc = new restore_controller($dossier, $c->id, backup::INTERACTIVE_NO, backup::MODE_GENERAL, $prof->id, backup::TARGET_CURRENT_ADDING);
if (!$rc->execute_precheck()) { print_r($rc->get_precheck_results()); }
else { $r = $rc->get_precheck_results(); if ($r) print_r($r); }
$rc->execute_plan();
$rc->destroy();
echo "course {$c->id}\n";
