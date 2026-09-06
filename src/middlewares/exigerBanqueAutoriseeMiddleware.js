const etablissement = require("../models/acteurs/administrateur/etablissementModel");

// Un compte banque ne peut manipuler que le stock de sa banque autorisée.
async function exigerBanqueAutorisee(req, res, next) {
  if (req.utilisateur.role !== "PERSONNEL_BANQUE") {
    return next();
  }

  try {
    const banque = await etablissement.trouverBanqueAutorisee(
      req.utilisateur.etablissementIdentifiant,
    );

    if (!banque) {
      return res.status(403).json({
        ok: false,
        message: "Ce compte n'est pas rattaché à une banque de sang autorisée.",
      });
    }

    return next();
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = exigerBanqueAutorisee;
