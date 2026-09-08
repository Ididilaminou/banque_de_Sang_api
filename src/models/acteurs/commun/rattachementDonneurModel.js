const prisma = require("../../../config/prismaConfig");

module.exports = {
  // ============================================================
  // Vérifier qu'un établissement est une banque de sang autorisée
  // ============================================================
  async trouverBanqueAutorisee(identifiant) {
    return prisma.etablissement.findFirst({
      where: {
        identifiant: Number(identifiant),
        type: "BANQUE_SANG",
        statut: "AUTORISE",
      },
    });
  },

  // ============================================================
  // Créer une demande de rattachement
  // ============================================================
  creer(data) {
    return prisma.rattachementDonneur.create({
      data: {
        donneurIdentifiant: Number(data.donneurIdentifiant),
        etablissementIdentifiant: Number(data.etablissementIdentifiant),
        statut: "EN_ATTENTE",
      },
    });
  },

  // ============================================================
  // Rechercher un rattachement par identifiant
  // ============================================================
  trouverParIdentifiant(identifiant) {
    return prisma.rattachementDonneur.findUnique({
      where: {
        identifiant: Number(identifiant),
      },
      include: {
        donneur: {
          include: {
            utilisateur: true,
          },
        },
        etablissement: true,
      },
    });
  },

  // ============================================================
  // Demandes en attente pour un établissement
  // ============================================================
  trouverDemandesEnAttente(etablissementIdentifiant) {
    return prisma.rattachementDonneur.findMany({
      where: {
        etablissementIdentifiant: Number(etablissementIdentifiant),
        statut: "EN_ATTENTE",
      },
      include: {
        donneur: {
          include: {
            utilisateur: true,
          },
        },
        etablissement: true,
      },
      orderBy: {
        dateDemande: "asc",
      },
    });
  },

  // ============================================================
  // Trouver la demande active d'un donneur
  // ============================================================
  trouverDemandeActive(donneurIdentifiant) {
    return prisma.rattachementDonneur.findFirst({
      where: {
        donneurIdentifiant: Number(donneurIdentifiant),
        statut: "EN_ATTENTE",
      },
      include: {
        etablissement: true,
      },
      orderBy: {
        dateDemande: "desc",
      },
    });
  },

  // ============================================================
  // Confirmer un rattachement
  // ============================================================
  confirmer(identifiant, motif = null) {
    return prisma.$transaction(async (tx) => {
      const rattachement = await tx.rattachementDonneur.findUnique({
        where: {
          identifiant: Number(identifiant),
        },
      });

      if (!rattachement) {
        throw new Error("RATTACHEMENT_INTROUVABLE");
      }

      if (rattachement.statut !== "EN_ATTENTE") {
        throw new Error("RATTACHEMENT_NON_EN_ATTENTE");
      }

      // --------------------------------------------------------
      // Confirmer la demande
      // --------------------------------------------------------
      const rattachementConfirme =
        await tx.rattachementDonneur.update({
          where: {
            identifiant: Number(identifiant),
          },
          data: {
            statut: "CONFIRME",
            motif: motif || null,
            dateConfirmation: new Date(),
          },
        });

      // --------------------------------------------------------
      // Rattacher réellement le donneur à la banque
      // --------------------------------------------------------
      await tx.utilisateur.update({
        where: {
          identifiant: rattachement.donneurIdentifiant,
        },
        data: {
          etablissementIdentifiant:
            rattachement.etablissementIdentifiant,

        },
      });

      return rattachementConfirme;
    });
  },

  // ============================================================
  // Refuser un rattachement
  // ============================================================
  refuser(identifiant, motif = null) {
    return prisma.rattachementDonneur.update({
      where: {
        identifiant: Number(identifiant),
      },
      data: {
        statut: "REFUSE",
        motif: motif || null,
        dateConfirmation: new Date(),
      },
    });
  },

  // ============================================================
  // Annuler un rattachement
  // ============================================================
  annuler(identifiant) {
    return prisma.rattachementDonneur.update({
      where: {
        identifiant: Number(identifiant),
      },
      data: {
        statut: "ANNULE",
        dateConfirmation: new Date(),
      },
    });
  },
};