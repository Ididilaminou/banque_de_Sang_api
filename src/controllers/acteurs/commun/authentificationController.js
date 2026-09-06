const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const utilisateur = require("../../../models/acteurs/commun/utilisateurModel");
const activationCompte = require("../../../models/acteurs/commun/activationCompteModel");
const env = require("../../../config/envConfig");
const etablissement = require("../../../models/acteurs/administrateur/etablissementModel");

function reponseUtilisateur(utilisateurConnecte) {
  return {
    identifiant: utilisateurConnecte.identifiant,
    courriel: utilisateurConnecte.courriel,
    prenom: utilisateurConnecte.prenom,
    nom: utilisateurConnecte.nom,
    telephone: utilisateurConnecte.telephone,
    role: utilisateurConnecte.role,
    estActif: utilisateurConnecte.estActif,
    doitChangerMotDePasse: utilisateurConnecte.doitChangerMotDePasse,
  };
}

async function inscrire(req, res, next) {
  const { courriel, motDePasse, prenom, nom, telephone, groupeSanguin, rhesus, etablissementIdentifiant } = req.body;

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

  const courrielNormalise = courriel.trim().toLowerCase();
  const prenomNormalise = prenom.trim();
  const nomNormalise = nom.trim();

  if (
    !courrielNormalise ||
    !prenomNormalise ||
    !nomNormalise ||
    motDePasse.length < 8
  ) {
    return res.status(400).json({
      ok: false,
      message: "Le courriel, le prénom et le nom ne doivent pas être vides. Le mot de passe doit contenir au moins 8 caractères.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courrielNormalise)) {
    return res.status(400).json({ ok: false, message: "Le format du courriel est invalide." });
  }

  const groupesAutorises = new Set(["A", "B", "AB", "O"]);
  const rhesusAutorises = new Set(["POSITIF", "NEGATIF"]);
  if ((groupeSanguin !== undefined || rhesus !== undefined) && (!groupesAutorises.has(groupeSanguin) || !rhesusAutorises.has(rhesus))) {
    return res.status(400).json({ ok: false, message: "Le groupe sanguin et le rhésus sont obligatoires pour créer le profil donneur." });
  }

  let rattachement = null;
  if (etablissementIdentifiant !== undefined) {
    rattachement = await etablissement.trouverGestionnaireStockAutorise(Number(etablissementIdentifiant));
    if (!rattachement) return res.status(400).json({ ok: false, message: "La banque ou l'hôpital choisi n'est pas autorisé à recevoir des donneurs." });
  }

  try {
    if (await utilisateur.trouverParCourriel(courrielNormalise)) {
      return res.status(409).json({ ok: false, message: "Un utilisateur existe déjà avec ce courriel." });
    }

    // Un donneur doit être vérifié par la banque avant de pouvoir se connecter.
    const cree = await utilisateur.creer({
      courriel: courrielNormalise,
      motDePasseHash: await bcrypt.hash(motDePasse, 12),
      prenom: prenomNormalise,
      nom: nomNormalise,
      telephone: typeof telephone === "string" ? telephone.trim() || null : null,
      estActif: false,
      etablissementIdentifiant: rattachement ? rattachement.identifiant : null,
      ...(groupeSanguin && rhesus ? {
        donneur: {
          create: {
            groupeSanguin,
            rhesus,
            dossier: { create: {} },
          },
        },
      } : {}),
    });

    return res.status(201).json({ ok: true, message: "Inscription réussie.", utilisateur: cree });
  } catch (erreur) {
    if (erreur.code === "P2002") {
      return res.status(409).json({ ok: false, message: "Un utilisateur existe déjà avec ce courriel." });
    }

    return next(erreur);
  }
}

async function activerCompte(req, res, next) {
  const { courriel, codeActivation } = req.body;

  if (
    typeof courriel !== "string" ||
    typeof codeActivation !== "string" ||
    !/^AID-[A-Z0-9]{6}$/.test(codeActivation.trim())
  ) {
    return res.status(400).json({
      ok: false,
      message: "Le courriel est obligatoire et le code doit respecter le format AID-XXXXXX.",
    });
  }

  try {
    const trouve = await utilisateur.trouverParCourriel(courriel.trim().toLowerCase());
    const activation = trouve
      ? await activationCompte.trouverParUtilisateur(trouve.identifiant)
      : null;

    // On compare le code reçu avec son hash stocké, jamais avec un code en clair.
    const codeValide =
      activation &&
      !activation.estUtilise &&
      activation.dateExpiration > new Date() &&
      crypto
        .createHash("sha256")
        .update(codeActivation.trim())
        .digest("hex") === activation.codeHash;

    if (!trouve || !activation || !codeValide) {
      return res.status(400).json({
        ok: false,
        message: "Le code d'activation est invalide ou expiré.",
      });
    }

    await utilisateur.modifier(trouve.identifiant, { estActif: true });
    await activationCompte.marquerCommeUtilise(activation.identifiant);

    return res.json({
      ok: true,
      message: "Compte activé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (erreur) {
    return next(erreur);
  }
}

async function connecter(req, res, next) {
  const { courriel, motDePasse } = req.body;
  if (typeof courriel !== "string" || typeof motDePasse !== "string") {
    return res.status(400).json({ ok: false, message: "Les champs courriel et motDePasse sont obligatoires." });
  }

  try {
    const trouve = await utilisateur.trouverParCourriel(courriel.trim().toLowerCase());
    if (!trouve || !(await bcrypt.compare(motDePasse, trouve.motDePasseHash))) {
      return res.status(401).json({ ok: false, message: "Courriel ou mot de passe incorrect." });
    }
    if (!trouve.estActif) {
      return res.status(403).json({
        ok: false,
        activationNecessaire: true,
        message: "Votre compte n'est pas encore activé. Demandez votre code à une banque de sang, puis activez votre compte.",
      });
    }
    if (!env.jwtSecret) return next(new Error("JWT_SECRET est obligatoire pour générer un jeton."));

    const jeton = jwt.sign(
      { identifiant: trouve.identifiant, role: trouve.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn },
    );
    return res.json({ ok: true, message: "Connexion réussie.", jeton, utilisateur: reponseUtilisateur(trouve) });
  } catch (erreur) {
    return next(erreur);
  }
}

async function modifierMotDePasse(req, res, next) {
  const { ancienMotDePasse, nouveauMotDePasse } = req.body;
  if (typeof ancienMotDePasse !== "string" || typeof nouveauMotDePasse !== "string") {
    return res.status(400).json({ ok: false, message: "Les champs ancienMotDePasse et nouveauMotDePasse sont obligatoires." });
  }
  if (nouveauMotDePasse.length < 8) {
    return res.status(400).json({ ok: false, message: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
  }

  try {
    const trouve = await utilisateur.trouverParIdentifiant(req.utilisateur.identifiant, { motDePasseHash: true });
    if (!trouve || !(await bcrypt.compare(ancienMotDePasse, trouve.motDePasseHash))) {
      return res.status(401).json({ ok: false, message: "L'ancien mot de passe est incorrect." });
    }
    await utilisateur.modifier(req.utilisateur.identifiant, {
      motDePasseHash: await bcrypt.hash(nouveauMotDePasse, 12),
      doitChangerMotDePasse: false,
    });
    return res.json({ ok: true, message: "Mot de passe modifié avec succès." });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { inscrire, connecter, modifierMotDePasse, activerCompte };
