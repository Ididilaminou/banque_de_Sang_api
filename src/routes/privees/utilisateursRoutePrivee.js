const express = require("express");
const controleur = require("../../controllers/utilisateursController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");

const routeur = express.Router();
routeur.get("/moi", authentifierUtilisateur, controleur.consulterProfil);
routeur.put("/moi", authentifierUtilisateur, controleur.modifierProfil);
routeur.get("/", authentifierUtilisateur, autoriserRoles("ADMINISTRATEUR"), controleur.lister);

module.exports = routeur;
