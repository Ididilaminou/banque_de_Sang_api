const prisma = require("../../../config/prismaConfig");

// Cette sélection définit les informations visibles dans les réponses API.
const selectionDemande = {
  identifiant: true,
  etablissementDemandeurId: true,
  etablissementDestinataireId: true,
  produit: true,
  groupeSanguin: true,
  rhesus: true,
  quantite: true,
  urgence: true,
  motif: true,
  statut: true,
  dateCreation: true,
  dateModification: true,
  etablissementDemandeur: {
    select: { identifiant: true, nom: true, ville: true },
  },
  etablissementDestinataire: {
    select: { identifiant: true, nom: true, ville: true },
  },
};

module.exports = {
  creer(donnees) {
    return prisma.demandeSang.create({
      data: donnees,
      select: selectionDemande,
    });
  },

  async lister(filtres, pagination) {
    const [demandes, total] = await prisma.$transaction([
      prisma.demandeSang.findMany({
        where: filtres,
        select: selectionDemande,
        orderBy: [{ urgence: "desc" }, { dateCreation: "desc" }],
        skip: pagination.saut,
        take: pagination.limite,
      }),
      prisma.demandeSang.count({ where: filtres }),
    ]);
    return { demandes, total };
  },

  trouverParIdentifiant(identifiant) {
    return prisma.demandeSang.findUnique({
      where: { identifiant },
      select: {
        ...selectionDemande,
        recommandations: {
          select: { identifiant: true, donneurIdentifiant: true, statut: true },
        },
      },
    });
  },

  modifier(identifiant, donnees) {
    return prisma.demandeSang.update({
      where: { identifiant },
      data: donnees,
      select: selectionDemande,
    });
  },

  creerHistorique(donnees) {
    return prisma.historiqueDemandeSang.create({ data: donnees });
  },

  listerHistorique(demandeSangIdentifiant) {
    return prisma.historiqueDemandeSang.findMany({
      where: { demandeSangIdentifiant },
      select: {
        identifiant: true,
        ancienStatut: true,
        nouveauStatut: true,
        commentaire: true,
        dateCreation: true,
        utilisateur: {
          select: { identifiant: true, prenom: true, nom: true, role: true },
        },
      },
      orderBy: { dateCreation: "desc" },
    });
  },

  trouverRecommandationPourDonneur(demandeSangIdentifiant, donneurIdentifiant) {
    return prisma.recommandationDonneur.findUnique({
      where: {
        demandeSangIdentifiant_donneurIdentifiant: {
          demandeSangIdentifiant,
          donneurIdentifiant,
        },
      },
      select: { identifiant: true, statut: true },
    });
  },

  enregistrerRecommandations(demandeSangIdentifiant, donneurs) {
    return prisma.recommandationDonneur.createMany({
      data: donneurs.map((donneur) => ({
        demandeSangIdentifiant,
        donneurIdentifiant: donneur.identifiant,
      })),
      skipDuplicates: true,
    });
  },

  repondreRecommandation(identifiant, statut) {
    return prisma.recommandationDonneur.update({
      where: { identifiant },
      data: { statut, dateReponse: new Date() },
      select: { identifiant: true, demandeSangIdentifiant: true, statut: true },
    });
  },
};
