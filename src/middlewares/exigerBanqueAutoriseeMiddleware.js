const etablissement = require("../models/acteurs/administrateur/etablissementModel");

// Seuls une banque autorisée ou un hôpital possédant sa banque interne
// peuvent manipuler un stock sanguin.
async function exigerBanqueAutorisee(req, res, next) {
  if (
    !["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"].includes(
      req.utilisateur.role,
    )
  ) {
    return next();
  }

  try {
    const gestionnaire = await etablissement.trouverGestionnaireStockAutorise(
      req.utilisateur.etablissementIdentifiant,
    );

    if (!gestionnaire) {
      return res.status(403).json({
        ok: false,
        message:
          "Cet établissement n'est pas autorisé à gérer un stock sanguin.",
      });
    }

    return next();
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = exigerBanqueAutorisee;
