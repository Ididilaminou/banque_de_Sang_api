const express = require("express");

const authentifierUtilisateur = require("../middlewares/authentification");
const autoriserRoles = require("../middlewares/autorisation");
const prisma = require("../config/prisma");

const routeur = express.Router();

routeur.get("/moi", authentifierUtilisateur, (req, res) => {
  return res.json({
    ok: true,
    utilisateur: req.utilisateur,
  });
});

routeur.put("/moi", authentifierUtilisateur, async (req, res, next) => {
  const { courriel, prenom, nom, telephone } = req.body;
  const donnees = {};

  if (courriel !== undefined) {
    if (
      typeof courriel !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courriel.trim())
    ) {
      return res.status(400).json({
        ok: false,
        message: "Le format du courriel est invalide.",
      });
    }

    donnees.courriel = courriel.trim().toLowerCase();
  }

  if (prenom !== undefined) {
    if (typeof prenom !== "string" || !prenom.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Le prénom ne doit pas être vide.",
      });
    }

    donnees.prenom = prenom.trim();
  }

  if (nom !== undefined) {
    if (typeof nom !== "string" || !nom.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Le nom ne doit pas être vide.",
      });
    }

    donnees.nom = nom.trim();
  }

  if (telephone !== undefined) {
    if (telephone !== null && typeof telephone !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Le téléphone doit être une chaîne de caractères ou null.",
      });
    }

    donnees.telephone = telephone === null ? null : telephone.trim() || null;
  }

  if (Object.keys(donnees).length === 0) {
    return res.status(400).json({
      ok: false,
      message: "Aucune information valide à modifier.",
    });
  }

  try {
    const utilisateur = await prisma.utilisateur.update({
      where: { identifiant: req.utilisateur.identifiant },
      data: donnees,
      select: {
        identifiant: true,
        courriel: true,
        prenom: true,
        nom: true,
        telephone: true,
        role: true,
        estActif: true,
        dateCreation: true,
        dateModification: true,
      },
    });

    return res.json({
      ok: true,
      message: "Profil mis à jour.",
      utilisateur,
    });
  } catch (erreur) {
    if (erreur.code === "P2002") {
      return res.status(409).json({
        ok: false,
        message: "Un utilisateur existe déjà avec ce courriel.",
      });
    }

    return next(erreur);
  }
});

routeur.get(
  "/",
  authentifierUtilisateur,
  autoriserRoles("ADMINISTRATEUR"),
  async (req, res, next) => {
    try {
      const utilisateurs = await prisma.utilisateur.findMany({
        select: {
          identifiant: true,
          courriel: true,
          prenom: true,
          nom: true,
          telephone: true,
          role: true,
          estActif: true,
          dateCreation: true,
        },
        orderBy: { dateCreation: "desc" },
      });

      return res.json({
        ok: true,
        utilisateurs,
      });
    } catch (erreur) {
      return next(erreur);
    }
  },
);

module.exports = routeur;
