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
  // Récupère une demande avant une opération de recommandation.
  trouverParIdentifiant(identifiant) {
    return prisma.demandeSang.findUnique({
      where: { identifiant },
      select: {
        identifiant: true,
        produit: true,
        groupeSanguin: true,
        rhesus: true,
        quantite: true,
        statut: true,
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
    });
  },

  // Crée une demande dans la base de données.
  creer(donnees) {
    return prisma.demandeSang.create({
      data: donnees,
      select: selectionDemande,
    });
  },

  // Liste les demandes selon les filtres reçus.
  lister(filtres) {
    return prisma.demandeSang.findMany({
      where: filtres,
      select: selectionDemande,
      orderBy: [{ urgence: "desc" }, { dateCreation: "desc" }],
    });
  },

  // Met à jour le statut ou l'établissement destinataire.
  modifier(identifiant, donnees) {
    return prisma.demandeSang.update({
      where: { identifiant },
      data: donnees,
      select: selectionDemande,
    });
  },
};
