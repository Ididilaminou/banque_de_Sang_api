const express = require("express");

const controleur = require("../../controllers/etablissementsController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
const administrateur = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("ADMINISTRATEUR"),
];

routeur.post("/", ...administrateur, controleur.creer);
routeur.get("/", ...administrateur, controleur.lister);
routeur.patch("/:identifiant/statut", ...administrateur, controleur.modifierStatut);

module.exports = routeur;
