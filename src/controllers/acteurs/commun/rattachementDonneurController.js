const crypto = require("crypto");

const rattachementDonneur = require("../../../models/acteurs/commun/rattachementDonneurModel");
const activationCompte = require("../../../models/acteurs/commun/activationCompteModel");

const envoyerEmailActivation = require("../../../services/emailService");

// ============================================================
// Générer un code d'activation
// Format : AID-XXXXXX
// Validité : 15 minutes
// ============================================================
function genererCodeActivation() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    const index = crypto.randomInt(0, caracteres.length);
    code += caracteres[index];
  }

  return `AID-${code}`;
}

// ============================================================
// Hasher le code d'activation
// ============================================================
function hashCodeActivation(code) {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

// ============================================================
// Générer la date d'expiration
// 15 minutes
// ============================================================
function calculerExpirationCode() {
  return new Date(Date.now() + 15 * 60 * 1000);
}

// ============================================================
// CONFIRMER UNE DEMANDE DE RATTACHEMENT
//
// Processus :
// Banque vérifie le donneur dans son registre
//              ↓
// Banque confirme
//              ↓
// Rattachement confirmé
//              ↓
// Donneur rattaché à la banque
//              ↓
// Génération du code d'activation
//              ↓
// Envoi du code par email
//              ↓
// Donneur active son compte
// ============================================================
async function confirmer(req, res, next) {
  const { identifiant } = req.params;
  const { motif } = req.body;

  try {
    // ==========================================================
    // 1. Vérifier que l'identifiant est valide
    // ==========================================================
    const rattachementIdentifiant = Number(identifiant);

    if (
      !Number.isInteger(rattachementIdentifiant) ||
      rattachementIdentifiant <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message: "L'identifiant du rattachement est invalide.",
      });
    }

    // ==========================================================
    // 2. Rechercher la demande
    // ==========================================================
    const rattachement =
      await rattachementDonneur.trouverParIdentifiant(
        rattachementIdentifiant
      );

    if (!rattachement) {
      return res.status(404).json({
        ok: false,
        message: "Demande de rattachement introuvable.",
      });
    }

    // ==========================================================
    // 3. Vérifier que la demande est encore en attente
    // ==========================================================
    if (rattachement.statut !== "EN_ATTENTE") {
      return res.status(400).json({
        ok: false,
        message:
          "Cette demande de rattachement a déjà été traitée.",
      });
    }

    // ==========================================================
    // 4. Vérifier que le donneur existe
    // ==========================================================
    if (!rattachement.donneur) {
      return res.status(404).json({
        ok: false,
        message:
          "Le donneur associé à cette demande est introuvable.",
      });
    }

    // ==========================================================
    // 5. Vérifier que l'utilisateur existe
    // ==========================================================
    if (!rattachement.donneur.utilisateur) {
      return res.status(404).json({
        ok: false,
        message:
          "Le compte utilisateur du donneur est introuvable.",
      });
    }

    const utilisateur = rattachement.donneur.utilisateur;

    // ==========================================================
    // 6. Vérifier que l'établissement est une banque autorisée
    // ==========================================================
    const banque =
      await rattachementDonneur.trouverBanqueAutorisee(
        rattachement.etablissementIdentifiant
      );

    if (!banque) {
      return res.status(400).json({
        ok: false,
        message:
          "Cette banque de sang n'existe pas ou n'est pas autorisée.",
      });
    }

    // ==========================================================
    // 7. Confirmer le rattachement
    //
    // IMPORTANT :
    // Cette opération :
    // - passe le rattachement à CONFIRME
    // - rattache l'utilisateur à la banque
    //
    // MAIS elle n'active PAS encore le compte.
    // ==========================================================
    const rattachementConfirme =
      await rattachementDonneur.confirmer(
        rattachementIdentifiant,
        motif || null
      );

    // ==========================================================
    // 8. Générer le code d'activation
    // ==========================================================
    const codeActivation =
      genererCodeActivation();

    // ==========================================================
    // 9. Hasher le code
    //
    // On ne stocke jamais le code en clair dans la BD.
    // ==========================================================
    const codeHash =
      hashCodeActivation(codeActivation);

    // ==========================================================
    // 10. Date d'expiration
    // ==========================================================
    const dateExpiration =
      calculerExpirationCode();

    // ==========================================================
    // 11. Enregistrer le code dans la BD
    //
    // Si un ancien code existe, il est remplacé.
    // ==========================================================
    await activationCompte.creerOuRemplacer(
      utilisateur.identifiant,
      codeHash,
      dateExpiration
    );

    // ==========================================================
    // 12. Envoyer le code par email
    // ==========================================================
    try {
      await envoyerEmailActivation({
        destinataire: utilisateur.courriel,
        prenom: utilisateur.prenom,
        codeActivation,
        dateExpiration,
      });
    } catch (erreurEmail) {
      console.error(
        "Erreur envoi email activation :",
        erreurEmail
      );

      // --------------------------------------------------------
      // IMPORTANT :
      // Le rattachement a déjà été confirmé.
      //
      // On ne considère donc pas que le rattachement a échoué.
      // Le donneur pourra utiliser "Renvoyer le code".
      // --------------------------------------------------------

      return res.status(200).json({
        ok: true,
        emailEnvoye: false,
        message:
          "Le rattachement a été confirmé, mais l'envoi du code d'activation par email a échoué. Le donneur pourra demander un nouveau code.",
        rattachement: {
          identifiant:
            rattachementConfirme.identifiant,
          statut:
            rattachementConfirme.statut,
        },
      });
    }

    // ==========================================================
    // 13. Réponse
    //
    // NE JAMAIS retourner le code d'activation dans la réponse
    // en production.
    // ==========================================================
    return res.status(200).json({
      ok: true,
      emailEnvoye: true,
      message:
        "Le rattachement a été confirmé. Un code d'activation a été envoyé au courriel du donneur.",
      rattachement: {
        identifiant:
          rattachementConfirme.identifiant,
        statut:
          rattachementConfirme.statut,
      },
      dateExpiration,
    });
  } catch (erreur) {
    console.error(
      "Erreur confirmation rattachement :",
      erreur
    );

    if (
      erreur.message ===
      "RATTACHEMENT_INTROUVABLE"
    ) {
      return res.status(404).json({
        ok: false,
        message:
          "Demande de rattachement introuvable.",
      });
    }

    if (
      erreur.message ===
      "RATTACHEMENT_NON_EN_ATTENTE"
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Cette demande de rattachement a déjà été traitée.",
      });
    }

    return next(erreur);
  }
}

// ============================================================
// REFUSER UNE DEMANDE DE RATTACHEMENT
// ============================================================
async function refuser(req, res, next) {
  const { identifiant } = req.params;
  const { motif } = req.body;

  try {
    const rattachementIdentifiant =
      Number(identifiant);

    if (
      !Number.isInteger(rattachementIdentifiant) ||
      rattachementIdentifiant <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "L'identifiant du rattachement est invalide.",
      });
    }

    // ========================================================
    // Vérifier que le rattachement existe
    // ========================================================
    const rattachement =
      await rattachementDonneur.trouverParIdentifiant(
        rattachementIdentifiant
      );

    if (!rattachement) {
      return res.status(404).json({
        ok: false,
        message:
          "Demande de rattachement introuvable.",
      });
    }

    // ========================================================
    // Vérifier le statut
    // ========================================================
    if (rattachement.statut !== "EN_ATTENTE") {
      return res.status(400).json({
        ok: false,
        message:
          "Cette demande a déjà été traitée.",
      });
    }

    // ========================================================
    // Motif obligatoire pour un refus
    // ========================================================
    if (
      typeof motif !== "string" ||
      !motif.trim()
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Le motif du refus est obligatoire.",
      });
    }

    // ========================================================
    // Refuser
    // ========================================================
    const rattachementRefuse =
      await rattachementDonneur.refuser(
        rattachementIdentifiant,
        motif.trim()
      );

    return res.status(200).json({
      ok: true,
      message:
        "La demande de rattachement a été refusée.",
      rattachement: {
        identifiant:
          rattachementRefuse.identifiant,
        statut:
          rattachementRefuse.statut,
        motif:
          rattachementRefuse.motif,
      },
    });
  } catch (erreur) {
    console.error(
      "Erreur refus rattachement :",
      erreur
    );

    return next(erreur);
  }
}

// ============================================================
// ANNULER UNE DEMANDE DE RATTACHEMENT
// ============================================================
async function annuler(req, res, next) {
  const { identifiant } = req.params;

  try {
    const rattachementIdentifiant =
      Number(identifiant);

    if (
      !Number.isInteger(rattachementIdentifiant) ||
      rattachementIdentifiant <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "L'identifiant du rattachement est invalide.",
      });
    }

    // ========================================================
    // Vérifier que le rattachement existe
    // ========================================================
    const rattachement =
      await rattachementDonneur.trouverParIdentifiant(
        rattachementIdentifiant
      );

    if (!rattachement) {
      return res.status(404).json({
        ok: false,
        message:
          "Demande de rattachement introuvable.",
      });
    }

    // ========================================================
    // Vérifier le statut
    // ========================================================
    if (rattachement.statut !== "EN_ATTENTE") {
      return res.status(400).json({
        ok: false,
        message:
          "Cette demande ne peut plus être annulée.",
      });
    }

    // ========================================================
    // Annuler
    // ========================================================
    const rattachementAnnule =
      await rattachementDonneur.annuler(
        rattachementIdentifiant
      );

    return res.status(200).json({
      ok: true,
      message:
        "La demande de rattachement a été annulée.",
      rattachement: {
        identifiant:
          rattachementAnnule.identifiant,
        statut:
          rattachementAnnule.statut,
      },
    });
  } catch (erreur) {
    console.error(
      "Erreur annulation rattachement :",
      erreur
    );

    return next(erreur);
  }
}

// ============================================================
// CONSULTER UNE DEMANDE
// ============================================================
async function obtenir(req, res, next) {
  const { identifiant } = req.params;

  try {
    const rattachementIdentifiant =
      Number(identifiant);

    if (
      !Number.isInteger(rattachementIdentifiant) ||
      rattachementIdentifiant <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "L'identifiant du rattachement est invalide.",
      });
    }

    const rattachement =
      await rattachementDonneur.trouverParIdentifiant(
        rattachementIdentifiant
      );

    if (!rattachement) {
      return res.status(404).json({
        ok: false,
        message:
          "Demande de rattachement introuvable.",
      });
    }

    return res.status(200).json({
      ok: true,
      rattachement,
    });
  } catch (erreur) {
    console.error(
      "Erreur récupération rattachement :",
      erreur
    );

    return next(erreur);
  }
}

// ============================================================
// LISTE DES DEMANDES EN ATTENTE D'UNE BANQUE
// ============================================================
async function demandesEnAttente(
  req,
  res,
  next
) {
  const { etablissementIdentifiant } =
    req.params;

  try {
    const idBanque =
      Number(etablissementIdentifiant);

    if (
      !Number.isInteger(idBanque) ||
      idBanque <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "L'identifiant de la banque est invalide.",
      });
    }

    // ========================================================
    // Vérifier que la banque est autorisée
    // ========================================================
    const banque =
      await rattachementDonneur.trouverBanqueAutorisee(
        idBanque
      );

    if (!banque) {
      return res.status(404).json({
        ok: false,
        message:
          "Banque de sang introuvable ou non autorisée.",
      });
    }

    // ========================================================
    // Récupérer les demandes
    // ========================================================
    const demandes =
      await rattachementDonneur.trouverDemandesEnAttente(
        idBanque
      );

    return res.status(200).json({
      ok: true,
      nombre: demandes.length,
      demandes,
    });
  } catch (erreur) {
    console.error(
      "Erreur récupération demandes rattachement :",
      erreur
    );

    return next(erreur);
  }
}

// ============================================================
// DEMANDE ACTIVE D'UN DONNEUR
// ============================================================
async function demandeActive(req, res, next) {
  const { donneurIdentifiant } = req.params;

  try {
    const idDonneur =
      Number(donneurIdentifiant);

    if (
      !Number.isInteger(idDonneur) ||
      idDonneur <= 0
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "L'identifiant du donneur est invalide.",
      });
    }

    const demande =
      await rattachementDonneur.trouverDemandeActive(
        idDonneur
      );

    return res.status(200).json({
      ok: true,
      demande: demande || null,
    });
  } catch (erreur) {
    console.error(
      "Erreur récupération demande active :",
      erreur
    );

    return next(erreur);
  }
}

// ============================================================
// EXPORT
// ============================================================
module.exports = {
  confirmer,
  refuser,
  annuler,
  obtenir,
  demandesEnAttente,
  demandeActive,
};