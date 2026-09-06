const express = require("express");

const authentifierUtilisateur = require("../middlewares/authentification");

const routeur = express.Router();

routeur.get("/moi", authentifierUtilisateur, (req, res) => {
  return res.json({
    ok: true,
    utilisateur: req.utilisateur,
  });
});

module.exports = routeur;
