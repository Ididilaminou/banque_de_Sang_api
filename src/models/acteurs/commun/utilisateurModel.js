const prisma = require("../../../config/prismaConfig");

/**
 * ============================================================
 * SÉLECTION PUBLIQUE D'UN UTILISATEUR
 * ============================================================
 *
 * Cette sélection contient uniquement les informations
 * qui peuvent être retournées au contrôleur.
 *
 * Le mot de passe hashé n'est volontairement pas inclus.
 */
const selectionPublique = {
  identifiant: true,
  courriel: true,
  prenom: true,
  nom: true,
  telephone: true,
  role: true,
  estActif: true,
  doitChangerMotDePasse: true,
  etablissementIdentifiant: true,
};

module.exports = {

  /**
   * ==========================================================
   * TROUVER UN UTILISATEUR PAR SON COURRIEL
   * ==========================================================
   *
   * Utilisé notamment pour :
   * - l'inscription
   * - la connexion
   * - l'activation du compte
   * - le renvoi du code d'activation
   *
   * IMPORTANT :
   * Ici, on ne met PAS "select: selectionPublique".
   *
   * Pourquoi ?
   * Parce que la connexion et l'activation ont besoin
   * du motDePasseHash.
   */
  trouverParCourriel(courriel) {
    return prisma.utilisateur.findUnique({
      where: {
        courriel,
      },
    });
  },

  /**
   * ==========================================================
   * TROUVER UN UTILISATEUR PAR SON IDENTIFIANT
   * ==========================================================
   *
   * Par défaut, on retourne uniquement les informations
   * publiques.
   *
   * Le contrôleur peut cependant fournir une sélection
   * personnalisée lorsqu'il a besoin d'autres champs.
   */
  trouverParIdentifiant(
    identifiant,
    selection = selectionPublique
  ) {
    return prisma.utilisateur.findUnique({
      where: {
        identifiant: Number(identifiant),
      },
      select: selection,
    });
  },

  /**
   * ==========================================================
   * CRÉER UN UTILISATEUR
   * ==========================================================
   *
   * Le contrôleur peut envoyer :
   *
   * {
   *   courriel,
   *   motDePasseHash,
   *   prenom,
   *   nom,
   *   telephone,
   *   role,
   *   estActif,
   *   etablissementIdentifiant,
   *   donneur: {
   *     create: {...}
   *   }
   * }
   *
   * Prisma se charge de créer les relations imbriquées.
   */
  creer(
    donnees,
    selection = selectionPublique
  ) {
    return prisma.utilisateur.create({
      data: donnees,
      select: selection,
    });
  },

  /**
   * ==========================================================
   * MODIFIER UN UTILISATEUR
   * ==========================================================
   *
   * Exemple :
   *
   * utilisateur.modifier(id, {
   *   estActif: true
   * });
   *
   * ou :
   *
   * utilisateur.modifier(id, {
   *   motDePasseHash: nouveauHash,
   *   doitChangerMotDePasse: false
   * });
   */
  modifier(
    identifiant,
    donnees,
    selection = selectionPublique
  ) {
    return prisma.utilisateur.update({
      where: {
        identifiant: Number(identifiant),
      },
      data: donnees,
      select: selection,
    });
  },

  /**
   * ==========================================================
   * SUPPRIMER UN UTILISATEUR
   * ==========================================================
   *
   * Peut être utilisé lorsqu'une opération liée à la création
   * du compte échoue.
   */
  supprimer(identifiant) {
    return prisma.utilisateur.delete({
      where: {
        identifiant: Number(identifiant),
      },
    });
  },

  /**
   * ==========================================================
   * LISTER LES UTILISATEURS
   * ==========================================================
   *
   * Retourne les utilisateurs sans exposer leur mot de passe.
   */
  lister() {
    return prisma.utilisateur.findMany({
      select: {
        ...selectionPublique,
        dateCreation: true,
      },
      orderBy: {
        dateCreation: "desc",
      },
    });
  },

  /**
   * ==========================================================
   * COMPTER LES ADMINISTRATEURS
   * ==========================================================
   *
   * Permet notamment de vérifier si la plateforme possède
   * déjà un administrateur.
   */
  compterAdministrateurs() {
    return prisma.utilisateur.count({
      where: {
        role: "ADMINISTRATEUR",
      },
    });
  },
};