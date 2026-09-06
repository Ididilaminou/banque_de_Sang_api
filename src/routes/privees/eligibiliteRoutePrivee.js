const express = require("express");

const controleur = require("../../controllers/eligibiliteController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
const donneurConnecte = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("DONNEUR"),
];

// Le donneur remplit le questionnaire préliminaire.
routeur.post("/", ...donneurConnecte, controleur.tester);

// Le donneur consulte ses résultats précédents.
routeur.get("/historique", ...donneurConnecte, controleur.historique);

module.exports = routeur;
