const express = require("express");

const controleur = require("../../../controllers/acteurs/administrateur/etablissementsController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
const administrateur = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("ADMINISTRATEUR"),
];

routeur.post("/", ...administrateur, controleur.creer);
routeur.get("/", ...administrateur, controleur.lister);
routeur.patch("/:identifiant/statut", ...administrateur, controleur.modifierStatut);
routeur.patch(
  "/:identifiant/banque-interne",
  ...administrateur,
  controleur.modifierBanqueInterne,
);

module.exports = routeur;
