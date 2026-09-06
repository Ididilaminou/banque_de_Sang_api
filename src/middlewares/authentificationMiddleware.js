const jwt = require("jsonwebtoken");

const prisma = require("../config/prismaConfig");
const env = require("../config/envConfig");

async function authentifierUtilisateur(req, res, next) {
  const enTeteAutorisation = req.get("Authorization");

  if (!enTeteAutorisation || !enTeteAutorisation.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Un jeton d'authentification est requis.",
    });
  }

  const jeton = enTeteAutorisation.slice("Bearer ".length).trim();

  if (!jeton) {
    return res.status(401).json({
      ok: false,
      message: "Le jeton d'authentification est vide.",
    });
  }

  if (!env.jwtSecret) {
    return next(new Error("JWT_SECRET est obligatoire pour vérifier un jeton."));
  }

  let contenuJeton;

  try {
    contenuJeton = jwt.verify(jeton, env.jwtSecret);
  } catch (erreur) {
    return res.status(401).json({
      ok: false,
      message: "Le jeton d'authentification est invalide ou expiré.",
    });
  }

  if (
    typeof contenuJeton !== "object" ||
    contenuJeton === null ||
    typeof contenuJeton.identifiant !== "number"
  ) {
    return res.status(401).json({
      ok: false,
      message: "Le contenu du jeton est invalide.",
    });
  }

  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { identifiant: contenuJeton.identifiant },
      select: {
        identifiant: true,
        courriel: true,
        prenom: true,
        nom: true,
        telephone: true,
        role: true,
        estActif: true,
        doitChangerMotDePasse: true,
      },
    });

    if (!utilisateur || !utilisateur.estActif) {
      return res.status(401).json({
        ok: false,
        message: "Ce compte n'est pas autorisé à accéder à la plateforme.",
      });
    }

    req.utilisateur = utilisateur;
    return next();
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = authentifierUtilisateur;
