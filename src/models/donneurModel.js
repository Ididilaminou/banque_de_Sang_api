const prisma = require("../config/prismaConfig");

const selectionDonneur = {
  identifiant: true,
  groupeSanguin: true,
  rhesus: true,
  estDisponible: true,
  dateDerniereDisponibilite: true,
  dateCreation: true,
  dateModification: true,
};

module.exports = {
  trouverParUtilisateur(utilisateurIdentifiant) {
    return prisma.donneur.findUnique({
      where: { utilisateurIdentifiant },
      select: selectionDonneur,
    });
  },

  // Utilisé en interne pour vérifier qu'un profil donneur existe.
  trouverParIdentifiantInterne(identifiant) {
    return prisma.donneur.findUnique({
      where: { identifiant },
      select: { identifiant: true },
    });
  },

  enregistrer(utilisateurIdentifiant, groupeSanguin, rhesus) {
    return prisma.donneur.upsert({
      where: { utilisateurIdentifiant },
      create: { utilisateurIdentifiant, groupeSanguin, rhesus },
      update: { groupeSanguin, rhesus },
      select: selectionDonneur,
    });
  },

  modifierDisponibilite(utilisateurIdentifiant, estDisponible) {
    return prisma.donneur.update({
      where: { utilisateurIdentifiant },
      data: {
        estDisponible,
        dateDerniereDisponibilite: estDisponible ? new Date() : null,
      },
      select: selectionDonneur,
    });
  },

  rechercher(filtres) {
    return prisma.donneur.findMany({
      where: filtres,
      select: {
        identifiant: true,
        groupeSanguin: true,
        rhesus: true,
        estDisponible: true,
        dateDerniereDisponibilite: true,
        utilisateur: {
          select: {
            identifiant: true,
            prenom: true,
            nom: true,
            telephone: true,
          },
        },
      },
      orderBy: { dateModification: "desc" },
    });
  },
};
