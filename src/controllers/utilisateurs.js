const utilisateur = require("../models/utilisateur");

async function consulterProfil(req, res) {
  return res.json({ ok: true, utilisateur: req.utilisateur });
}

async function modifierProfil(req, res, next) {
  const { courriel, prenom, nom, telephone } = req.body;
  const donnees = {};

  if (courriel !== undefined) {
    if (typeof courriel !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courriel.trim())) {
      return res.status(400).json({ ok: false, message: "Le format du courriel est invalide." });
    }
    donnees.courriel = courriel.trim().toLowerCase();
  }
  if (prenom !== undefined) {
    if (typeof prenom !== "string" || !prenom.trim()) {
      return res.status(400).json({ ok: false, message: "Le prénom ne doit pas être vide." });
    }
    donnees.prenom = prenom.trim();
  }
  if (nom !== undefined) {
    if (typeof nom !== "string" || !nom.trim()) {
      return res.status(400).json({ ok: false, message: "Le nom ne doit pas être vide." });
    }
    donnees.nom = nom.trim();
  }
  if (telephone !== undefined) {
    if (telephone !== null && typeof telephone !== "string") {
      return res.status(400).json({ ok: false, message: "Le téléphone doit être une chaîne de caractères ou null." });
    }
    donnees.telephone = telephone === null ? null : telephone.trim() || null;
  }
  if (Object.keys(donnees).length === 0) {
    return res.status(400).json({ ok: false, message: "Aucune information valide à modifier." });
  }

  try {
    const resultat = await utilisateur.modifier(req.utilisateur.identifiant, donnees);
    return res.json({ ok: true, message: "Profil mis à jour.", utilisateur: resultat });
  } catch (erreur) {
    if (erreur.code === "P2002") {
      return res.status(409).json({ ok: false, message: "Un utilisateur existe déjà avec ce courriel." });
    }
    return next(erreur);
  }
}

async function lister(req, res, next) {
  try {
    return res.json({ ok: true, utilisateurs: await utilisateur.lister() });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { consulterProfil, modifierProfil, lister };
