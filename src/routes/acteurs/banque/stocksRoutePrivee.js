const express = require("express");

const controleur = require("../../../controllers/acteurs/banque/stocksController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");
const exigerEtablissementPersonnel = require("../../../middlewares/exigerEtablissementPersonnelMiddleware");
const exigerBanqueAutorisee = require("../../../middlewares/exigerBanqueAutoriseeMiddleware");

const routeur = express.Router();

const personnelAutorise = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  exigerEtablissementPersonnel,
  autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
];

const gestionnaireStock = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  exigerEtablissementPersonnel,
  exigerBanqueAutorisee,
  autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
];

// Le personnel de banque enregistre ou met à jour les stocks.
routeur.post("/", ...gestionnaireStock, controleur.enregistrer);
routeur.patch("/:identifiant/quantite", ...gestionnaireStock, controleur.modifierQuantite);
routeur.get("/:identifiant/mouvements", ...personnelAutorise, controleur.historique);

// Le personnel hospitalier peut consulter les stocks autorisés.
routeur.get("/", ...personnelAutorise, controleur.rechercher);

module.exports = routeur;
