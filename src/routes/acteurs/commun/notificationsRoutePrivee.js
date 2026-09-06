const express = require("express");

const controleur = require("../../../controllers/notificationsController");
const authentifierUtilisateur = require("../../../middlewares/authentificationMiddleware");
const exigerMotDePasseDefinitif = require("../../../middlewares/motDePasseDefinitifMiddleware");

const routeur = express.Router();
const utilisateurConnecte = [authentifierUtilisateur, exigerMotDePasseDefinitif];

// Consulte les notifications du compte connecté.
routeur.get("/", ...utilisateurConnecte, controleur.lister);

// Marque une notification appartenant au compte connecté comme lue.
routeur.patch("/:identifiant/lue", ...utilisateurConnecte, controleur.marquerCommeLue);

module.exports = routeur;
