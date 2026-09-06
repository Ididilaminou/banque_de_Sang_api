const etablissement = require("../../../models/acteurs/administrateur/etablissementModel");

const typesAutorises = new Set(["BANQUE_SANG", "HOPITAL"]);
const statutsAutorises = new Set(["EN_ATTENTE", "AUTORISE", "SUSPENDU"]);

async function creer(req, res, next) {
  const { nom, type, adresse, ville, telephone, courriel } = req.body;

  if (
    typeof nom !== "string" ||
    typeof type !== "string" ||
    typeof adresse !== "string" ||
    typeof ville !== "string" ||
    typeof courriel !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les champs nom, type, adresse, ville et courriel sont obligatoires.",
    });
  }

  if (
    !nom.trim() ||
    !adresse.trim() ||
    !ville.trim() ||
    !typesAutorises.has(type) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courriel.trim())
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les informations de l'établissement sont invalides.",
    });
  }

  try {
    const resultat = await etablissement.creer({
      nom: nom.trim(),
      type,
      adresse: adresse.trim(),
      ville: ville.trim(),
      telephone: typeof telephone === "string" ? telephone.trim() || null : null,
      courriel: courriel.trim().toLowerCase(),
    });

    return res.status(201).json({
      ok: true,
      message: "Établissement créé et placé en attente de validation.",
      etablissement: resultat,
    });
  } catch (erreur) {
    if (erreur.code === "P2002") {
      return res.status(409).json({
        ok: false,
        message: "Un établissement existe déjà avec ce courriel.",
      });
    }

    return next(erreur);
  }
}

async function lister(req, res, next) {
  try {
    return res.json({
      ok: true,
      etablissements: await etablissement.lister(),
    });
  } catch (erreur) {
    return next(erreur);
  }
}

async function modifierStatut(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  const { statut } = req.body;

  if (!Number.isInteger(identifiant) || !statutsAutorises.has(statut)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant ou le statut est invalide.",
    });
  }

  try {
    return res.json({
      ok: true,
      message: "Statut de l'établissement mis à jour.",
      etablissement: await etablissement.modifierStatut(identifiant, statut),
    });
  } catch (erreur) {
    if (erreur.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Établissement introuvable.",
      });
    }

    return next(erreur);
  }
}

module.exports = { creer, lister, modifierStatut };
