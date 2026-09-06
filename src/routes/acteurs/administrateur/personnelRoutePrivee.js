const express = require("express");

const controleur = require("../../../controllers/acteurs/administrateur/personnelController");
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

// Rattache un compte ancien à un établissement autorisé.
routeur.patch(
  "/:identifiant/etablissement",
  authentifierUtilisateur,
  exigerMotDePasseDefinitif,
  autoriserRoles("ADMINISTRATEUR"),
  controleur.rattacherEtablissement,
);

module.exports = routeur;
