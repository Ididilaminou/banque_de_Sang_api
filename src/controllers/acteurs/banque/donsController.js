const don = require("../../../models/acteurs/banque/donModel");
const donneur = require("../../../models/acteurs/donneur/donneurModel");

const statutsAutorises = new Set(["ENREGISTRE", "VALIDE", "ANNULE"]);

// La banque utilise cette opération pour enregistrer un don réalisé.
async function enregistrer(req, res, next) {
  const { donneurIdentifiant, dateDon, volumeMillilitres, commentaire } =
    req.body;

  const identifiantDonneur = Number(donneurIdentifiant);
  const date = new Date(dateDon);

  if (
    !Number.isInteger(identifiantDonneur) ||
    !dateDon ||
    Number.isNaN(date.getTime()) ||
    !Number.isInteger(volumeMillilitres) ||
    volumeMillilitres <= 0 ||
    volumeMillilitres > 1000
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Le donneur, la date et le volume du don sont invalides. Le volume doit être compris entre 1 et 1000 ml.",
    });
  }

  try {
    const profilDonneur = await donneur.trouverParIdentifiantInterne(
      identifiantDonneur,
    );

    if (!profilDonneur) {
      return res.status(404).json({
        ok: false,
        message: "Profil donneur introuvable.",
      });
    }

    const resultat = await don.creer({
      donneurIdentifiant: identifiantDonneur,
      dateDon: date,
      volumeMillilitres,
      commentaire:
        typeof commentaire === "string" ? commentaire.trim() || null : null,
    });

    return res.status(201).json({
      ok: true,
      message: "Don enregistré.",
      don: resultat,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

// Le donneur consulte uniquement les dons liés à son propre profil.
async function consulterMonHistorique(req, res, next) {
  try {
    const profilDonneur = await donneur.trouverParUtilisateur(
      req.utilisateur.identifiant,
    );

    if (!profilDonneur) {
      return res.status(404).json({
        ok: false,
        message: "Le profil donneur n'est pas encore créé.",
      });
    }

    return res.json({
      ok: true,
      dons: await don.listerParDonneur(profilDonneur.identifiant),
    });
  } catch (erreur) {
    return next(erreur);
  }
}

// Le personnel habilité peut consulter l'historique d'un donneur.
async function consulterHistoriqueDonneur(req, res, next) {
  const identifiantDonneur = Number(req.params.identifiant);

  if (!Number.isInteger(identifiantDonneur)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant du donneur est invalide.",
    });
  }

  try {
    const profilDonneur = await donneur.trouverParIdentifiantInterne(
      identifiantDonneur,
    );

    if (!profilDonneur) {
      return res.status(404).json({
        ok: false,
        message: "Profil donneur introuvable.",
      });
    }

    return res.json({
      ok: true,
      dons: await don.listerParDonneur(identifiantDonneur),
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
      message: "L'identifiant du don ou le statut est invalide.",
    });
  }

  try {
    return res.json({
      ok: true,
      message: "Statut du don mis à jour.",
      don: await don.modifierStatut(identifiant, statut),
    });
  } catch (erreur) {
    if (erreur.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Don introuvable.",
      });
    }

    return next(erreur);
  }
}

module.exports = {
  enregistrer,
  consulterMonHistorique,
  consulterHistoriqueDonneur,
  modifierStatut,
};
