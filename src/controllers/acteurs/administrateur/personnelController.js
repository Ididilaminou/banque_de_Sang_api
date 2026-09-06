const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const utilisateur = require("../../../models/acteurs/commun/utilisateurModel");
const emailService = require("../../../services/emailService");

const rolesPersonnel = new Set(["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"]);

// Crée un mot de passe temporaire que le personnel devra remplacer plus tard.
function genererMotDePasseTemporaire() {
  return crypto.randomBytes(9).toString("base64url");
}

async function creerPersonnel(req, res, next) {
  const { courriel, prenom, nom, telephone, role } = req.body;

  if (
    typeof courriel !== "string" ||
    typeof prenom !== "string" ||
    typeof nom !== "string" ||
    typeof role !== "string"
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

module.exports = { creerPersonnel };
