const express = require("express");
const controleur = require("../../controllers/authentification");
const authentifierUtilisateur = require("../../middlewares/authentification");

const routeur = express.Router();
routeur.put("/mot-de-passe", authentifierUtilisateur, controleur.modifierMotDePasse);

module.exports = routeur;
