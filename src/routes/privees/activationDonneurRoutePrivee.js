const express = require("express");

const controleur = require("../../controllers/activationDonneurController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");

const routeur = express.Router();

// Seuls la banque et l'administrateur peuvent vérifier un donneur.
routeur.post(
  "/:identifiant/verifier",
  authentifierUtilisateur,
  autoriserRoles("PERSONNEL_BANQUE", "ADMINISTRATEUR"),
  controleur.verifierEtGenererCode,
);

module.exports = routeur;
