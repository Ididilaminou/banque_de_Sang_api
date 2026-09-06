const express = require("express");

const controleur = require("../../../controllers/personnelController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();

// Seul un administrateur peut créer un compte du personnel.
routeur.post(
  "/",
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("ADMINISTRATEUR"),
  controleur.creerPersonnel,
);

module.exports = routeur;
