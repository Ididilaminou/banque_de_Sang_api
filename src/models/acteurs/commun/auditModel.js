const prisma = require("../../../config/prismaConfig");

module.exports = {
  // Enregistre l'auteur et le contexte d'une opération sensible.
  creer(donnees) {
    return prisma.journalAudit.create({ data: donnees });
  },

  // Réserve la consultation complète du journal à l'administrateur.
  lister(pagination) {
    return prisma.journalAudit.findMany({
      select: {
        identifiant: true,
        utilisateurIdentifiant: true,
        action: true,
        ressource: true,
        ressourceIdentifiant: true,
        details: true,
        dateCreation: true,
        utilisateur: {
          select: { prenom: true, nom: true, role: true },
        },
      },
      orderBy: { dateCreation: "desc" },
      skip: pagination.saut,
      take: pagination.limite,
    });
  },
};
