const express = require("express");

const controleur = require("../../controllers/installationController");

const routeur = express.Router();

// Cette route est publique techniquement, mais protégée par une clé secrète.
routeur.post("/", controleur.creerPremierAdministrateur);

module.exports = routeur;
