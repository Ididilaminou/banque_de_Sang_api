const express = require("express");

const controleur = require("../../../controllers/acteurs/banque/donsController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");
const exigerEtablissementPersonnel = require("../../../middlewares/exigerEtablissementPersonnelMiddleware");

const routeur = express.Router();
const personnelBanque = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  exigerEtablissementPersonnel,
  autoriserRoles("PERSONNEL_BANQUE", "ADMINISTRATEUR"),
];

const personnelHabilite = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  exigerEtablissementPersonnel,
  autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
];

// La banque ou l'administrateur enregistre un don.
routeur.post("/", ...personnelBanque, controleur.enregistrer);

// Le donneur consulte son propre historique.
routeur.get(
  "/moi",
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("DONNEUR"),
  controleur.consulterMonHistorique,
);

// Le personnel autorisé consulte l'historique d'un donneur.
routeur.get(
  "/donneur/:identifiant",
  ...personnelHabilite,
  controleur.consulterHistoriqueDonneur,
);

// Seul le personnel de banque ou l'administrateur modifie un statut.
routeur.patch(
  "/:identifiant/statut",
  ...personnelBanque,
  controleur.modifierStatut,
);

module.exports = routeur;
