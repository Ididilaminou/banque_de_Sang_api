const express = require("express");

const controleur = require("../../../controllers/acteurs/banque/activationDonneurController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");
const exigerEtablissementPersonnel = require("../../../middlewares/exigerEtablissementPersonnelMiddleware");

const routeur = express.Router();

// Seuls la banque et l'administrateur peuvent vérifier un donneur.
routeur.post(
  "/:identifiant/verifier",
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  exigerEtablissementPersonnel,
  autoriserRoles("PERSONNEL_BANQUE", "ADMINISTRATEUR"),
  controleur.verifierEtGenererCode,
);

module.exports = routeur;
