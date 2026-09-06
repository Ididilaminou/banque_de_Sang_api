const prisma = require("../config/prismaConfig");

module.exports = {
  // Remplace l'ancien code par un nouveau code d'activation.
  creerOuRemplacer(utilisateurIdentifiant, codeHash, dateExpiration) {
    return prisma.activationCompte.upsert({
      where: { utilisateurIdentifiant },
      create: {
        utilisateurIdentifiant,
        codeHash,
        dateExpiration,
      },
      update: {
        codeHash,
        dateExpiration,
        estUtilise: false,
        dateUtilisation: null,
      },
    });
  },

  // Recherche le code actif associé au compte du donneur.
  trouverParUtilisateur(utilisateurIdentifiant) {
    return prisma.activationCompte.findUnique({
      where: { utilisateurIdentifiant },
    });
  },

  // Marque le code comme utilisé pour empêcher sa réutilisation.
  marquerCommeUtilise(identifiant) {
    return prisma.activationCompte.update({
      where: { identifiant },
      data: {
        estUtilise: true,
        dateUtilisation: new Date(),
      },
    });
  },
};
