const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const utilisateur = require("../models/utilisateurModel");

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

    return res.status(201).json({
      ok: true,
      message: "Compte du personnel créé. Le mot de passe sera envoyé par email.",
      utilisateur: cree,
      // Temporaire pour les tests locaux avant le branchement Gmail SMTP.
      motDePasseTemporaire,
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
