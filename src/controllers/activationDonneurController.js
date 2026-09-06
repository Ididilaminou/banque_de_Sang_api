const crypto = require("crypto");

const utilisateur = require("../models/utilisateurModel");
const activationCompte = require("../models/activationCompteModel");

// Génère un code lisible avec un préfixe qui identifie une activation.
function genererCodeActivation() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffixe = "";

  for (let index = 0; index < 6; index += 1) {
    suffixe += caracteres[crypto.randomInt(0, caracteres.length)];
  }

  return `AID-${suffixe}`;
}

async function verifierEtGenererCode(req, res, next) {
  const utilisateurIdentifiant = Number(req.params.identifiant);

  if (!Number.isInteger(utilisateurIdentifiant)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant du donneur est invalide.",
    });
  }

  try {
    const donneur = await utilisateur.trouverParIdentifiant(
      utilisateurIdentifiant,
      {
        identifiant: true,
        courriel: true,
        role: true,
        estActif: true,
      },
    );

    if (!donneur || donneur.role !== "DONNEUR") {
      return res.status(404).json({
        ok: false,
        message: "Donneur introuvable.",
      });
    }

    if (donneur.estActif) {
      return res.status(409).json({
        ok: false,
        message: "Ce compte donneur est déjà actif.",
      });
    }

    // Le code complet est communiqué au donneur, mais seul son hash est stocké.
    const codeActivation = genererCodeActivation();
    const codeHash = crypto
      .createHash("sha256")
      .update(codeActivation)
      .digest("hex");
    const dateExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await activationCompte.creerOuRemplacer(
      donneur.identifiant,
      codeHash,
      dateExpiration,
    );

    return res.json({
      ok: true,
      message: "Donneur vérifié. Le code doit maintenant être transmis au donneur.",
      codeActivation,
      dateExpiration,
      courriel: donneur.courriel,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { verifierEtGenererCode };
