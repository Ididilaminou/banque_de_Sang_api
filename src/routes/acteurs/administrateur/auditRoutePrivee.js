const express = require("express");

const controleur = require("../../../controllers/acteurs/administrateur/auditController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();

// Le journal d'audit contient des informations sensibles.
routeur.get(
  "/",
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("ADMINISTRATEUR"),
  controleur.lister,
);

module.exports = routeur;
