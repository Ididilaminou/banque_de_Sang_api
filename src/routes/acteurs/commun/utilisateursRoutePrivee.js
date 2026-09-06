const express = require("express");
const controleur = require("../../../controllers/utilisateursController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
routeur.get("/moi", authentifierUtilisateur, exigerMotDePasseDefinitif, controleur.consulterProfil);
routeur.put("/moi", authentifierUtilisateur, exigerMotDePasseDefinitif, controleur.modifierProfil);
routeur.get("/", authentifierUtilisateur, exigerMotDePasseDefinitif, autoriserRoles("ADMINISTRATEUR"), controleur.lister);

module.exports = routeur;
