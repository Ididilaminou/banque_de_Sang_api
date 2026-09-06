const express = require("express");

const controleur = require("../../../controllers/eligibiliteController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
const donneurConnecte = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("DONNEUR"),
];
const professionnel = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("PERSONNEL_BANQUE", "ADMINISTRATEUR"),
];

// Le donneur remplit le questionnaire préliminaire.
routeur.post("/", ...donneurConnecte, controleur.tester);

// Le donneur consulte ses résultats précédents.
routeur.get("/historique", ...donneurConnecte, controleur.historique);

// Validation humaine obligatoire après l'analyse IA.
routeur.patch("/:identifiant/validation", ...professionnel, controleur.validerParProfessionnel);

module.exports = routeur;
