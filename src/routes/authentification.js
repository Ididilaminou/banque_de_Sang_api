const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const env = require("../config/env");
const authentifierUtilisateur = require("../middlewares/authentification");

const routeur = express.Router();

routeur.post("/inscription", async (req, res, next) => {
  const {
    courriel,
    motDePasse,
    prenom,
    nom,
    telephone,
  } = req.body;

  if (
    typeof courriel !== "string" ||
    typeof motDePasse !== "string" ||
    typeof prenom !== "string" ||
    typeof nom !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les champs courriel, motDePasse, prenom et nom sont obligatoires.",
    });
  }

  const courrielNormalise = courriel.trim().toLowerCase();
  const prenomNormalise = prenom.trim();
  const nomNormalise = nom.trim();

  if (
    !courrielNormalise ||
    !prenomNormalise ||
    !nomNormalise ||
    motDePasse.length < 8
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Le courriel, le prénom et le nom ne doivent pas être vides. Le mot de passe doit contenir au moins 8 caractères.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courrielNormalise)) {
    return res.status(400).json({
      ok: false,
      message: "Le format du courriel est invalide.",
    });
  }

  try {
    const utilisateurExistant = await prisma.utilisateur.findUnique({
      where: { courriel: courrielNormalise },
      select: { identifiant: true },
    });

    if (utilisateurExistant) {
      return res.status(409).json({
        ok: false,
        message: "Un utilisateur existe déjà avec ce courriel.",
      });
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, 12);
    const utilisateur = await prisma.utilisateur.create({
      data: {
        courriel: courrielNormalise,
        motDePasseHash,
        prenom: prenomNormalise,
        nom: nomNormalise,
        telephone: typeof telephone === "string" ? telephone.trim() || null : null,
      },
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
    });

    return res.status(201).json({
      ok: true,
      message: "Inscription réussie.",
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

routeur.post("/connexion", async (req, res, next) => {
  const { courriel, motDePasse } = req.body;

  if (typeof courriel !== "string" || typeof motDePasse !== "string") {
    return res.status(400).json({
      ok: false,
      message: "Les champs courriel et motDePasse sont obligatoires.",
    });
  }

  const courrielNormalise = courriel.trim().toLowerCase();

  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { courriel: courrielNormalise },
    });

    if (
      !utilisateur ||
      !utilisateur.estActif ||
      !(await bcrypt.compare(motDePasse, utilisateur.motDePasseHash))
    ) {
      return res.status(401).json({
        ok: false,
        message: "Courriel ou mot de passe incorrect.",
      });
    }

    if (!env.jwtSecret) {
      return next(new Error("JWT_SECRET est obligatoire pour générer un jeton."));
    }

    const jeton = jwt.sign(
      {
        identifiant: utilisateur.identifiant,
        role: utilisateur.role,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn },
    );

    return res.json({
      ok: true,
      message: "Connexion réussie.",
      jeton,
      utilisateur: {
        identifiant: utilisateur.identifiant,
        courriel: utilisateur.courriel,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
        estActif: utilisateur.estActif,
      },
    });
  } catch (erreur) {
    return next(erreur);
  }
});

routeur.put(
  "/mot-de-passe",
  authentifierUtilisateur,
  async (req, res, next) => {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (
      typeof ancienMotDePasse !== "string" ||
      typeof nouveauMotDePasse !== "string"
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Les champs ancienMotDePasse et nouveauMotDePasse sont obligatoires.",
      });
    }

    if (nouveauMotDePasse.length < 8) {
      return res.status(400).json({
        ok: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
    }

    try {
      const utilisateur = await prisma.utilisateur.findUnique({
        where: { identifiant: req.utilisateur.identifiant },
        select: { motDePasseHash: true },
      });

      if (
        !utilisateur ||
        !(await bcrypt.compare(
          ancienMotDePasse,
          utilisateur.motDePasseHash,
        ))
      ) {
        return res.status(401).json({
          ok: false,
          message: "L'ancien mot de passe est incorrect.",
        });
      }

      const motDePasseHash = await bcrypt.hash(nouveauMotDePasse, 12);

      await prisma.utilisateur.update({
        where: { identifiant: req.utilisateur.identifiant },
        data: { motDePasseHash },
      });

      return res.json({
        ok: true,
        message: "Mot de passe modifié avec succès.",
      });
    } catch (erreur) {
      return next(erreur);
    }
  },
);

module.exports = routeur;
