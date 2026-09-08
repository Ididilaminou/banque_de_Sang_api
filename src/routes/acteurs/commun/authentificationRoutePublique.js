const express = require("express");

const controleur = require(
  "../../../controllers/acteurs/commun/authentificationController"
);

const routeur = express.Router();

// ============================================================
// Routes d'authentification
// ============================================================

// Inscription
routeur.post(
  "/inscription",
  controleur.inscrire
);

// Connexion
routeur.post(
  "/connexion",
  controleur.connecter
);

// Activation du compte
routeur.post(
  "/activation",
  controleur.activerCompte
);

// Demande d'un nouveau code d'activation
routeur.post(
  "/renvoyer-activation",
  controleur.renvoyerCodeActivation
);

module.exports = routeur;