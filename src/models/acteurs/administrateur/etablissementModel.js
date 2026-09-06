const prisma = require("../../../config/prismaConfig");

const selectionEtablissement = {
  identifiant: true,
  nom: true,
  type: true,
  adresse: true,
  ville: true,
  telephone: true,
  courriel: true,
  statut: true,
  dateCreation: true,
  dateModification: true,
};

module.exports = {
  // Vérifie qu'un établissement est bien une banque autorisée.
  trouverBanqueAutorisee(identifiant) {
    return prisma.etablissement.findFirst({
      where: {
        identifiant,
        type: "BANQUE_SANG",
        statut: "AUTORISE",
      },
      select: { identifiant: true, nom: true },
    });
  },

  creer(donnees) {
    return prisma.etablissement.create({
      data: donnees,
      select: selectionEtablissement,
    });
  },

  lister() {
    return prisma.etablissement.findMany({
      select: selectionEtablissement,
      orderBy: { dateCreation: "desc" },
    });
  },

  modifierStatut(identifiant, statut) {
    return prisma.etablissement.update({
      where: { identifiant },
      data: { statut },
      select: selectionEtablissement,
    });
  },
};
