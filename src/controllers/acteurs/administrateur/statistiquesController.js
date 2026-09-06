const statistiques = require("../../../models/acteurs/administrateur/statistiquesModel");

async function globales(req, res, next) {
  try {
    return res.json({
      ok: true,
      statistiques: await statistiques.statistiquesGlobales(),
    });
  } catch (erreur) {
    return next(erreur);
  }
}

async function parEtablissement(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  if (!Number.isInteger(identifiant)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant de l'établissement est invalide.",
    });
  }

  if (
    req.utilisateur.role !== "ADMINISTRATEUR" &&
    req.utilisateur.etablissementIdentifiant !== identifiant
  ) {
    return res.status(403).json({
      ok: false,
      message: "Vous ne pouvez consulter que les statistiques de votre établissement.",
    });
  }

  try {
    const resultat = await statistiques.statistiquesEtablissement(identifiant);
    if (!resultat.etablissement) {
      return res.status(404).json({
        ok: false,
        message: "Établissement introuvable.",
      });
    }

    return res.json({ ok: true, statistiques: resultat });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { globales, parEtablissement };
