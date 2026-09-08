
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const utilisateur = require("../../../models/acteurs/commun/utilisateurModel");
const activationCompte = require("../../../models/acteurs/commun/activationCompteModel");
const rattachementDonneur = require("../../../models/acteurs/commun/rattachementDonneurModel");
const etablissement = require("../../../models/acteurs/administrateur/etablissementModel");
const env = require("../../../config/envConfig");

/**
 * ============================================================
 * REPONSE PUBLIQUE UTILISATEUR
 * ============================================================
 */
function reponseUtilisateur(utilisateurConnecte) {
  return {
    identifiant: utilisateurConnecte.identifiant,
    courriel: utilisateurConnecte.courriel,
    prenom: utilisateurConnecte.prenom,
    nom: utilisateurConnecte.nom,
    telephone: utilisateurConnecte.telephone,
    role: utilisateurConnecte.role,
    estActif: utilisateurConnecte.estActif,
    doitChangerMotDePasse:
      utilisateurConnecte.doitChangerMotDePasse,
    etablissementIdentifiant:
      utilisateurConnecte.etablissementIdentifiant ?? null,
  };
}

/**
 * ============================================================
 * INSCRIPTION D'UN DONNEUR
 * ============================================================
 *
 * Le donneur :
 * - crée son compte ;
 * - fournit son groupe sanguin et son rhésus ;
 * - peut choisir une banque de sang ;
 * - son compte reste inactif ;
 * - une demande de rattachement est créée ;
 * - la banque devra confirmer le rattachement ;
 * - le rattachement réel sera effectué uniquement
 *   après confirmation par la banque.
 */
async function inscrire(req, res, next) {
  const {
    courriel,
    motDePasse,
    prenom,
    nom,
    telephone,
    groupeSanguin,
    rhesus,
    etablissementIdentifiant,
  } = req.body;

  try {
    // ==========================================================
    // 1. Vérification des champs obligatoires
    // ==========================================================

    if (
      typeof courriel !== "string" ||
      typeof motDePasse !== "string" ||
      typeof prenom !== "string" ||
      typeof nom !== "string"
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Les champs courriel, motDePasse, prenom et nom sont obligatoires.",
      });
    }

    // ==========================================================
    // 2. Normalisation
    // ==========================================================

    const courrielNormalise =
      courriel.trim().toLowerCase();

    const prenomNormalise =
      prenom.trim();

    const nomNormalise =
      nom.trim();

    const telephoneNormalise =
      typeof telephone === "string"
        ? telephone.trim() || null
        : null;

    // ==========================================================
    // 3. Vérification des valeurs
    // ==========================================================

    if (
      !courrielNormalise ||
      !prenomNormalise ||
      !nomNormalise
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Le courriel, le prénom et le nom ne doivent pas être vides.",
      });
    }

    if (motDePasse.length < 8) {
      return res.status(400).json({
        ok: false,
        message:
          "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    // ==========================================================
    // 4. Vérification du courriel
    // ==========================================================

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        courrielNormalise
      )
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Le format du courriel est invalide.",
      });
    }

    // ==========================================================
    // 5. Vérification groupe sanguin
    // ==========================================================

    const groupesAutorises = new Set([
      "A",
      "B",
      "AB",
      "O",
    ]);

    const rhesusAutorises = new Set([
      "POSITIF",
      "NEGATIF",
    ]);

    if (
      !groupesAutorises.has(groupeSanguin) ||
      !rhesusAutorises.has(rhesus)
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Le groupe sanguin doit être A, B, AB ou O et le rhésus doit être POSITIF ou NEGATIF.",
      });
    }

    // ==========================================================
    // 6. Vérification de la banque sélectionnée
    // ==========================================================

    let banque = null;

    if (
      etablissementIdentifiant !== undefined &&
      etablissementIdentifiant !== null &&
      etablissementIdentifiant !== ""
    ) {
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

      banque =
        await etablissement.trouverBanqueAutorisee(
          idBanque
        );

      if (!banque) {
        return res.status(400).json({
          ok: false,
          message:
            "La banque de sang sélectionnée n'existe pas ou n'est pas autorisée.",
        });
      }
    }

    // ==========================================================
    // 7. Vérification du courriel existant
    // ==========================================================

    const utilisateurExistant =
      await utilisateur.trouverParCourriel(
        courrielNormalise
      );

    if (utilisateurExistant) {
      return res.status(409).json({
        ok: false,
        message:
          "Un utilisateur existe déjà avec ce courriel.",
      });
    }

    // ==========================================================
    // 8. Hash du mot de passe
    // ==========================================================

    const motDePasseHash =
      await bcrypt.hash(
        motDePasse,
        12
      );

    // ==========================================================
    // 9. Création de l'utilisateur et du donneur
    // ==========================================================
    //
    // IMPORTANT :
    //
    // etablissementIdentifiant = null
    //
    // Le donneur n'est PAS directement rattaché à la banque.
    // Le rattachement sera effectué uniquement après
    // confirmation de la banque.
    //
    // ==========================================================

    const cree =
      await utilisateur.creer({
        courriel: courrielNormalise,

        motDePasseHash,

        prenom: prenomNormalise,

        nom: nomNormalise,

        telephone: telephoneNormalise,

        estActif: false,

        etablissementIdentifiant: null,

        donneur: {
          create: {
            groupeSanguin,
            rhesus,

            dossier: {
              create: {},
            },
          },
        },
      });

    // ==========================================================
    // 10. Création de la demande de rattachement
    // ==========================================================
    //
    // UNE SEULE demande est créée.
    //
    // Si aucune banque n'a été sélectionnée :
    // aucune demande n'est créée.
    //
    // ==========================================================

    let demandeRattachement = null;

    if (banque) {
      if (!cree.donneur) {
        throw new Error(
          "Le donneur n'a pas été créé correctement."
        );
      }

      demandeRattachement =
        await rattachementDonneur.creer({
          donneurIdentifiant:
            cree.donneur.identifiant,

          etablissementIdentifiant:
            banque.identifiant,
        });
    }

    // ==========================================================
    // 11. Réponse
    // ==========================================================

    return res.status(201).json({
      ok: true,

      message: banque
        ? "Inscription réussie. Votre demande de rattachement a été envoyée à la banque de sang. Votre compte sera activé après vérification."
        : "Inscription réussie. Vous devez choisir une banque de sang afin de faire vérifier et activer votre compte.",

      utilisateur: cree,

      rattachement: demandeRattachement
        ? {
            identifiant:
              demandeRattachement.identifiant,

            etablissementIdentifiant:
              demandeRattachement.etablissementIdentifiant,

            statut:
              demandeRattachement.statut,
          }
        : null,
    });
  } catch (erreur) {
    console.error(
      "Erreur inscription donneur :",
      erreur
    );

    // Contrainte unique Prisma
    if (erreur.code === "P2002") {
      return res.status(409).json({
        ok: false,
        message:
          "Un utilisateur existe déjà avec ce courriel.",
      });
    }

    return next(erreur);
  }
}

/**
 * ============================================================
 * ACTIVATION DU COMPTE
 * ============================================================
 */
async function activerCompte(req, res, next) {
  const {
    courriel,
    codeActivation,
  } = req.body;

  if (
    typeof courriel !== "string" ||
    typeof codeActivation !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Le courriel et le code d'activation sont obligatoires.",
    });
  }

  const codeNormalise =
    codeActivation.trim().toUpperCase();

  if (
    !/^AID-[A-Z0-9]{6}$/.test(
      codeNormalise
    )
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Le code doit respecter le format AID-XXXXXX.",
    });
  }

  try {
    const trouve =
      await utilisateur.trouverParCourriel(
        courriel.trim().toLowerCase()
      );

    if (!trouve) {
      return res.status(400).json({
        ok: false,
        message:
          "Le code d'activation est invalide ou expiré.",
      });
    }

    const activation =
      await activationCompte.trouverParUtilisateur(
        trouve.identifiant
      );

    if (
      !activation ||
      activation.estUtilise ||
      activation.dateExpiration <= new Date()
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "Le code d'activation est invalide ou expiré.",
      });
    }

    const codeHash =
      crypto
        .createHash("sha256")
        .update(codeNormalise)
        .digest("hex");

    if (codeHash !== activation.codeHash) {
      return res.status(400).json({
        ok: false,
        message:
          "Le code d'activation est invalide ou expiré.",
      });
    }

    await utilisateur.modifier(
      trouve.identifiant,
      {
        estActif: true,
      }
    );

    await activationCompte.marquerCommeUtilise(
      activation.identifiant
    );

    return res.json({
      ok: true,
      message:
        "Compte activé avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (erreur) {
    return next(erreur);
  }
}

/**
 * ============================================================
 * RENVOYER UN CODE D'ACTIVATION
 * ============================================================
 */
async function renvoyerCodeActivation(
  req,
  res,
  next
) {
  const { courriel } = req.body;

  if (
    typeof courriel !== "string" ||
    !courriel.trim()
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Le courriel est obligatoire.",
    });
  }

  try {
    const trouve =
      await utilisateur.trouverParCourriel(
        courriel.trim().toLowerCase()
      );

    /*
     * Réponse générique afin de ne pas révéler
     * l'existence d'un compte.
     */
    if (!trouve) {
      return res.json({
        ok: true,
        message:
          "Si un compte correspondant existe, un nouveau code d'activation sera généré.",
      });
    }

    if (trouve.estActif) {
      return res.status(400).json({
        ok: false,
        message:
          "Ce compte est déjà activé. Vous pouvez vous connecter.",
      });
    }

    // ========================================================
    // Génération du code
    // ========================================================

    const codeAleatoire =
      crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

    const codeActivation =
      `AID-${codeAleatoire}`;

    // ========================================================
    // Hash
    // ========================================================

    const codeHash =
      crypto
        .createHash("sha256")
        .update(codeActivation)
        .digest("hex");

    // ========================================================
    // Expiration : 15 minutes
    // ========================================================

    const dateExpiration =
      new Date(
        Date.now() +
        10080 * 60 * 1000
      );

    await activationCompte.creerOuRemplacer(
      trouve.identifiant,
      codeHash,
      dateExpiration
    );

    /*
     * TEMPORAIRE POUR LES TESTS.
     *
     * En production, il faudra envoyer le code
     * par email/SMS et ne plus le retourner.
     */

    return res.json({
      ok: true,
      message:
        "Un nouveau code d'activation a été généré.",
      codeActivation,
      dateExpiration,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

/**
 * ============================================================
 * CONNEXION
 * ============================================================
 */
async function connecter(req, res, next) {
  const {
    courriel,
    motDePasse,
  } = req.body;

  if (
    typeof courriel !== "string" ||
    typeof motDePasse !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Les champs courriel et motDePasse sont obligatoires.",
    });
  }

  try {
    const trouve =
      await utilisateur.trouverParCourriel(
        courriel.trim().toLowerCase()
      );

    if (
      !trouve ||
      !(await bcrypt.compare(
        motDePasse,
        trouve.motDePasseHash
      ))
    ) {
      return res.status(401).json({
        ok: false,
        message:
          "Courriel ou mot de passe incorrect.",
      });
    }

    if (!trouve.estActif) {
      return res.status(403).json({
        ok: false,
        activationNecessaire: true,
        message:
          "Votre compte n'est pas encore activé. Attendez la vérification de votre demande par une banque de sang.",
      });
    }

    if (!env.jwtSecret) {
      return next(
        new Error(
          "JWT_SECRET est obligatoire pour générer un jeton."
        )
      );
    }

    const jeton =
      jwt.sign(
        {
          identifiant:
            trouve.identifiant,
          role: trouve.role,
        },
        env.jwtSecret,
        {
          expiresIn:
            env.jwtExpiresIn,
        }
      );

    return res.json({
      ok: true,
      message:
        "Connexion réussie.",
      jeton,
      utilisateur:
        reponseUtilisateur(
          trouve
        ),
    });
  } catch (erreur) {
    return next(erreur);
  }
}

/**
 * ============================================================
 * MODIFIER LE MOT DE PASSE
 * ============================================================
 */
async function modifierMotDePasse(
  req,
  res,
  next
) {
  const {
    ancienMotDePasse,
    nouveauMotDePasse,
  } = req.body;

  if (
    typeof ancienMotDePasse !== "string" ||
    typeof nouveauMotDePasse !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Les champs ancienMotDePasse et nouveauMotDePasse sont obligatoires.",
    });
  }

  if (
    nouveauMotDePasse.length < 8
  ) {
    return res.status(400).json({
      ok: false,
      message:
        "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    });
  }

  try {
    const trouve =
      await utilisateur.trouverParIdentifiant(
        req.utilisateur.identifiant,
        {
          motDePasseHash: true,
        }
      );

    if (
      !trouve ||
      !(await bcrypt.compare(
        ancienMotDePasse,
        trouve.motDePasseHash
      ))
    ) {
      return res.status(401).json({
        ok: false,
        message:
          "L'ancien mot de passe est incorrect.",
      });
    }

    await utilisateur.modifier(
      req.utilisateur.identifiant,
      {
        motDePasseHash:
          await bcrypt.hash(
            nouveauMotDePasse,
            12
          ),

        doitChangerMotDePasse:
          false,
      }
    );

    return res.json({
      ok: true,
      message:
        "Mot de passe modifié avec succès.",
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = {
  inscrire,
  connecter,
  modifierMotDePasse,
  activerCompte,
  renvoyerCodeActivation,
};

