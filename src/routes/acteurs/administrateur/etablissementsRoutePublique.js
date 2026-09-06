const express = require("express");
const controleur = require("../../../controllers/acteurs/administrateur/etablissementsController");

const routeur = express.Router();

// Les donneurs peuvent choisir un établissement autorisé lors de leur inscription.
routeur.get("/disponibles", controleur.listerDisponibles);

module.exports = routeur;
