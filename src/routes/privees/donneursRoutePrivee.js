const express = require("express");
const controleur = require("../../controllers/donneursController");
const authentifierUtilisateur = require("../../middlewares/authentificationMiddleware");
const autoriserRoles = require("../../middlewares/autorisationMiddleware");
const exigerMotDePasseDefinitif = require("../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
const protegerDonneur = [
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("DONNEUR"),
];

routeur.get("/recherche", authentifierUtilisateur, exigerMotDePasseDefinitif, autoriserRoles("PERSONNEL_BANQUE", "PERSONNEL_HOPITAL", "ADMINISTRATEUR"), controleur.rechercher);
routeur.get("/moi", ...protegerDonneur, controleur.consulterProfil);
routeur.put("/moi", ...protegerDonneur, controleur.enregistrerProfil);
routeur.patch("/moi/disponibilite", ...protegerDonneur, controleur.modifierDisponibilite);

module.exports = routeur;
