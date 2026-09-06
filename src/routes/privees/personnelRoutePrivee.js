const express = require("express");

const controleur = require("../../controllers/personnelController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");

const routeur = express.Router();

// Seul un administrateur peut créer un compte du personnel.
routeur.post(
  "/",
  authentifierUtilisateur,
  autoriserRoles("ADMINISTRATEUR"),
  controleur.creerPersonnel,
);

module.exports = routeur;
