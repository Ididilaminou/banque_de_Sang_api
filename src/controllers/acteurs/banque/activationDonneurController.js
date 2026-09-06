const crypto = require("crypto");

const utilisateur = require("../../../models/acteurs/commun/utilisateurModel");
const activationCompte = require("../../../models/acteurs/commun/activationCompteModel");
const emailService = require("../../../services/emailService");

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
        prenom: true,
        etablissementIdentifiant: true,
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
    if (req.utilisateur.role === "PERSONNEL_BANQUE" && donneur.etablissementIdentifiant !== req.utilisateur.etablissementIdentifiant) {
      return res.status(403).json({ ok: false, message: "Ce donneur n'est pas rattaché à votre établissement." });
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

    try {
      // Le code est envoyé par email et ne sera pas exposé dans la réponse HTTP.
      await emailService.envoyerCodeActivation({
        courriel: donneur.courriel,
        prenom: donneur.prenom,
        codeActivation,
        dateExpiration,
      });
    } catch (erreurEmail) {
      // L'activation est supprimée pour éviter de garder un code jamais reçu.
      const activation = await activationCompte.trouverParUtilisateur(
        donneur.identifiant,
      );
      if (activation) {
        await activationCompte.supprimer(activation.identifiant);
      }
      return next(erreurEmail);
    }

    return res.json({
      ok: true,
      message: "Donneur vérifié. Le code d'activation a été envoyé par email.",
      dateExpiration,
      courriel: donneur.courriel,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { verifierEtGenererCode };
