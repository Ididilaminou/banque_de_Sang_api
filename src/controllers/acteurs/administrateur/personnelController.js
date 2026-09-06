const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const utilisateur = require("../../../models/acteurs/commun/utilisateurModel");
const emailService = require("../../../services/emailService");
const etablissement = require("../../../models/acteurs/administrateur/etablissementModel");

const rolesPersonnel = new Set(["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"]);

// Crée un mot de passe temporaire que le personnel devra remplacer plus tard.
function genererMotDePasseTemporaire() {
  return crypto.randomBytes(9).toString("base64url");
}

async function creerPersonnel(req, res, next) {
  const { courriel, prenom, nom, telephone, role, etablissementIdentifiant } = req.body;
  const identifiantEtablissement = Number(etablissementIdentifiant);

  if (
    typeof courriel !== "string" ||
    typeof prenom !== "string" ||
    typeof nom !== "string" ||
    typeof role !== "string" ||
    !Number.isInteger(identifiantEtablissement)
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les champs courriel, prenom, nom et role sont obligatoires.",
    });
  }

  const courrielNormalise = courriel.trim().toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courrielNormalise) ||
    !prenom.trim() ||
    !nom.trim() ||
    !rolesPersonnel.has(role)
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les informations du personnel sont invalides.",
    });
  }

  try {
    const etablissementLie = await etablissement.trouverPourRole(
      identifiantEtablissement,
      role,
    );
    if (!etablissementLie) {
      return res.status(400).json({
        ok: false,
        message: "L'établissement est introuvable, non autorisé ou incompatible avec le rôle.",
      });
    }

    if (await utilisateur.trouverParCourriel(courrielNormalise)) {
      return res.status(409).json({
        ok: false,
        message: "Un utilisateur existe déjà avec ce courriel.",
      });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const cree = await utilisateur.creer({
      courriel: courrielNormalise,
      motDePasseHash: await bcrypt.hash(motDePasseTemporaire, 12),
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: typeof telephone === "string" ? telephone.trim() || null : null,
      role,
      estActif: true,
      doitChangerMotDePasse: true,
      etablissementIdentifiant: identifiantEtablissement,
      dossierPersonnel: { create: {} },
    });

    try {
      // L'email contient les accès ; le mot de passe n'est donc plus renvoyé par l'API.
      await emailService.envoyerAccesPersonnel({
        courriel: cree.courriel,
        prenom: cree.prenom,
        motDePasseTemporaire,
      });
    } catch (erreurEmail) {
      // On évite de laisser un compte inutilisable si Gmail refuse l'envoi.
      await utilisateur.supprimer(cree.identifiant);
      return next(erreurEmail);
    }

    return res.status(201).json({
      ok: true,
      message: "Compte du personnel créé. Les accès ont été envoyés par email.",
      utilisateur: cree,
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
}

// Permet de rattacher un ancien compte du personnel à son établissement.
async function rattacherEtablissement(req, res, next) {
  const utilisateurIdentifiant = Number(req.params.identifiant);
  const identifiantEtablissement = Number(req.body.etablissementIdentifiant);

  if (!Number.isInteger(utilisateurIdentifiant) || !Number.isInteger(identifiantEtablissement)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant du personnel ou de l'établissement est invalide.",
    });
  }

  try {
    const compte = await utilisateur.trouverParIdentifiant(utilisateurIdentifiant, {
      identifiant: true,
      role: true,
    });
    if (!compte || !rolesPersonnel.has(compte.role)) {
      return res.status(404).json({
        ok: false,
        message: "Compte du personnel introuvable.",
      });
    }

    if (!await etablissement.trouverPourRole(identifiantEtablissement, compte.role)) {
      return res.status(400).json({
        ok: false,
        message: "L'établissement est incompatible avec le rôle du personnel.",
      });
    }

    const resultat = await utilisateur.modifier(utilisateurIdentifiant, {
      etablissementIdentifiant: identifiantEtablissement,
    });
    return res.json({
      ok: true,
      message: "Compte du personnel rattaché à l'établissement.",
      utilisateur: resultat,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { creerPersonnel, rattacherEtablissement };
