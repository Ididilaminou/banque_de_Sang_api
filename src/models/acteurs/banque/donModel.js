const prisma = require("../../../config/prismaConfig");

// Champs autorisés dans les réponses pour ne jamais exposer de données inutiles.
const selectionDon = {
  identifiant: true,
  donneurIdentifiant: true,
  dateDon: true,
  volumeMillilitres: true,
  statut: true,
  commentaire: true,
  dateCreation: true,
  dateModification: true,
};

module.exports = {
  // Enregistre un nouveau don associé à un profil donneur existant.
  creer(donnees) {
    return prisma.don.create({
      data: donnees,
      select: selectionDon,
    });
  },

  // Retourne l'historique d'un donneur du plus récent au plus ancien.
  listerParDonneur(donneurIdentifiant) {
    return prisma.don.findMany({
      where: { donneurIdentifiant },
      select: selectionDon,
      orderBy: { dateDon: "desc" },
    });
  },

  // Vérifie qu'un don existe avant de modifier son statut.
  modifierStatut(identifiant, statut) {
    return prisma.don.update({
      where: { identifiant },
      data: { statut },
      select: selectionDon,
    });
  },
};
