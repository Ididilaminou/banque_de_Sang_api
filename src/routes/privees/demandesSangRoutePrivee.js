const express = require("express");

const controleur = require("../../controllers/demandesSangController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();

const hopital = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
];

const personnelHabilite = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"),
];

const gestionnaire = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("PERSONNEL_BANQUE", "ADMINISTRATEUR"),
];

// Un hôpital lance une demande de sang.
routeur.post("/", ...hopital, controleur.creer);

// Le personnel habilité consulte les demandes.
routeur.get("/", ...personnelHabilite, controleur.lister);

// La banque ou l'administrateur traite une demande.
routeur.patch("/:identifiant", ...gestionnaire, controleur.modifier);

// La banque recommande des donneurs si son stock est insuffisant.
routeur.post("/:identifiant/recommander-donneurs", ...gestionnaire, controleur.recommanderDonneurs);

module.exports = routeur;
