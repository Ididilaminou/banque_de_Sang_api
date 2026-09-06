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
  possedeBanqueSangInterne: true,
  dateCreation: true,
  dateModification: true,
};

module.exports = {
  // Vérifie que l'établissement correspond au rôle du personnel créé.
  trouverPourRole(identifiant, role) {
    return prisma.etablissement.findFirst({
      where: {
        identifiant,
        statut: "AUTORISE",
        type: role === "PERSONNEL_BANQUE" ? "BANQUE_SANG" : "HOPITAL",
      },
      select: { identifiant: true, nom: true, type: true },
    });
  },

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

  trouverGestionnaireStockAutorise(identifiant) {
    return prisma.etablissement.findFirst({
      where: {
        identifiant,
        statut: "AUTORISE",
        OR: [
          { type: "BANQUE_SANG" },
          { type: "HOPITAL", possedeBanqueSangInterne: true },
        ],
      },
      select: {
        identifiant: true,
        nom: true,
        type: true,
        possedeBanqueSangInterne: true,
      },
    });
  },

  creer(donnees) {
    return prisma.etablissement.create({
      data: {
        ...donnees,
        dossier: { create: {} },
      },
      select: selectionEtablissement,
    });
  },

  lister() {
    return prisma.etablissement.findMany({
      select: selectionEtablissement,
      orderBy: { dateCreation: "desc" },
    });
  },

  listerDisponiblesPourDonneur() {
    return prisma.etablissement.findMany({
      where: {
        statut: "AUTORISE",
        OR: [
          { type: "BANQUE_SANG" },
          { type: "HOPITAL", possedeBanqueSangInterne: true },
        ],
      },
      select: { identifiant: true, nom: true, type: true, ville: true },
      orderBy: { nom: "asc" },
    });
  },

  modifierStatut(identifiant, statut) {
    return prisma.etablissement.update({
      where: { identifiant },
      data: { statut },
      select: selectionEtablissement,
    });
  },

  modifierBanqueInterne(identifiant, possedeBanqueSangInterne) {
    return prisma.etablissement.update({
      where: { identifiant },
      data: { possedeBanqueSangInterne },
      select: selectionEtablissement,
    });
  },
};
