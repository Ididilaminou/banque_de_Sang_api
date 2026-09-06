const express = require("express");
const controleur = require("../../../controllers/acteurs/administrateur/statistiquesController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");
const exigerEtablissementPersonnel = require("../../../middlewares/exigerEtablissementPersonnelMiddleware");

const routeur = express.Router();
const securite = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
];

routeur.get(
  "/",
  ...securite,
  autoriserRoles("ADMINISTRATEUR"),
  controleur.globales,
);

routeur.get(
  "/etablissement/:identifiant",
  ...securite,
  exigerEtablissementPersonnel,
  autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
  controleur.parEtablissement,
);

module.exports = routeur;
