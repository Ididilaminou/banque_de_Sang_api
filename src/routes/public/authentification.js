const express = require("express");
const controleur = require("../../controllers/authentification");

const routeur = express.Router();
routeur.post("/inscription", controleur.inscrire);
routeur.post("/connexion", controleur.connecter);

module.exports = routeur;
