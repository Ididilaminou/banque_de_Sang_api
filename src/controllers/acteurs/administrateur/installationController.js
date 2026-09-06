const bcrypt = require("bcryptjs");

const env = require("../../../config/envConfig");
const utilisateur = require("../../../models/acteurs/commun/utilisateurModel");

// Cette fonction crée le premier administrateur lors de l'installation.
async function creerPremierAdministrateur(req, res, next) {
  // La clé n'est pas envoyée dans le corps JSON pour éviter de la mélanger
  // avec les informations métier du compte.
  const cleEnvoyee = req.get("X-Cle-Installation");

  if (!env.cleInstallation || cleEnvoyee !== env.cleInstallation) {
    return res.status(401).json({
      ok: false,
      message: "Clé d'installation invalide.",
    });
  }

  const { courriel, motDePasse, prenom, nom, telephone } = req.body;

  if (
    typeof courriel !== "string" ||
    typeof motDePasse !== "string" ||
    typeof prenom !== "string" ||
    typeof nom !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les champs courriel, motDePasse, prenom et nom sont obligatoires.",
    });
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courriel.trim()) ||
    !courriel.trim() ||
    !prenom.trim() ||
    !nom.trim() ||
    motDePasse.length < 8
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les informations de l'administrateur sont invalides.",
    });
  }

  try {
    // Cette vérification rend la route utilisable une seule fois.
    if ((await utilisateur.compterAdministrateurs()) > 0) {
      return res.status(409).json({
        ok: false,
        message: "Un administrateur existe déjà. Utilisez la connexion normale.",
      });
    }

    const courrielNormalise = courriel.trim().toLowerCase();
    if (await utilisateur.trouverParCourriel(courrielNormalise)) {
      return res.status(409).json({
        ok: false,
        message: "Un utilisateur existe déjà avec ce courriel.",
      });
    }

    const administrateur = await utilisateur.creer({
      courriel: courrielNormalise,
      motDePasseHash: await bcrypt.hash(motDePasse, 12),
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: typeof telephone === "string" ? telephone.trim() || null : null,
      role: "ADMINISTRATEUR",
      estActif: true,
      doitChangerMotDePasse: false,
    });

    return res.status(201).json({
      ok: true,
      message: "Premier administrateur créé avec succès.",
      utilisateur: administrateur,
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

module.exports = { creerPremierAdministrateur };
