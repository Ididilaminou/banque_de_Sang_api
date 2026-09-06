const express = require("express");

const controleur = require("../../../controllers/acteurs/banque/stocksController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();

const personnelAutorise = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
];

const gestionnaireStock = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("PERSONNEL_BANQUE", "ADMINISTRATEUR"),
];

// Le personnel de banque enregistre ou met à jour les stocks.
routeur.post("/", ...gestionnaireStock, controleur.enregistrer);
routeur.patch("/:identifiant/quantite", ...gestionnaireStock, controleur.modifierQuantite);

// Le personnel hospitalier peut consulter les stocks autorisés.
routeur.get("/", ...personnelAutorise, controleur.rechercher);

module.exports = routeur;
