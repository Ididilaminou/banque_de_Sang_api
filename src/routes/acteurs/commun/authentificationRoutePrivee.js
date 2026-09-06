const express = require("express");
const controleur = require("../../../controllers/authentificationController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");

const routeur = express.Router();
routeur.put("/mot-de-passe", authentifierUtilisateur, controleur.modifierMotDePasse);

module.exports = routeur;
